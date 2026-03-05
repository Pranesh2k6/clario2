"""
Clario Analytics Engine — NLG Formatter (Ollama Llama 3.1 8B)
Translates structured ML output into natural, readable English.

IMPORTANT: The LLM does NOT perform any analysis. It only reformats
pre-computed ML metrics into human-friendly sentences.
"""

import json
import httpx
import hashlib
import redis as redis_lib
from .config import config

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"
CACHE_TTL = 3600  # 1 hour

# Redis client for caching generated text
_redis = None


def _get_redis():
    global _redis
    if _redis is None:
        _redis = redis_lib.from_url(config.REDIS_URL, decode_responses=True)
    return _redis


def _cache_key(data_hash):
    return f"nlg:cache:{data_hash}"


def _hash_input(data):
    """Create a deterministic hash of the input data for caching."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()[:16]


def format_insights(ml_output, context="duel_result"):
    """
    Format ML analysis output into readable insights.

    Args:
        ml_output: dict with ML-computed metrics (mastery, behavior, etc.)
        context: one of 'duel_result', 'study_planner', 'recommendation'

    Returns:
        list of human-readable insight strings
    """
    # Check cache first
    cache_data = {"output": ml_output, "context": context}
    data_hash = _hash_input(cache_data)

    try:
        r = _get_redis()
        cached = r.get(_cache_key(data_hash))
        if cached:
            return json.loads(cached)
    except Exception:
        pass  # Redis down — skip cache

    # Build the prompt
    prompt = _build_prompt(ml_output, context)

    try:
        response = httpx.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 300,
                    "top_p": 0.9,
                },
            },
            timeout=15.0,
        )

        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            insights = _parse_response(result)

            # Cache the result
            try:
                r = _get_redis()
                r.setex(_cache_key(data_hash), CACHE_TTL, json.dumps(insights))
            except Exception:
                pass

            return insights

    except (httpx.ConnectError, httpx.TimeoutException):
        pass  # Ollama not running — fall back to template

    # Fallback: template-based formatting (no LLM needed)
    return _template_fallback(ml_output, context)


def format_recommendation(rec_data):
    """
    Format a single recommendation into a readable suggestion.

    Args:
        rec_data: dict with keys like topic, mastery, behavior, priority

    Returns:
        dict with 'title' and 'description' as readable strings
    """
    cache_data = {"rec": rec_data, "type": "recommendation"}
    data_hash = _hash_input(cache_data)

    try:
        r = _get_redis()
        cached = r.get(_cache_key(data_hash))
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    prompt = f"""You are a friendly JEE study assistant. Convert this data into ONE short, 
encouraging study suggestion. Output ONLY the suggestion text, nothing else.

Data: {json.dumps(rec_data, default=str)}

Rules:
- Be concise (max 15 words for title, max 25 words for description)
- Be encouraging and specific
- Do NOT analyze or add new information
- Output format: TITLE: <title>\\nDESCRIPTION: <description>"""

    try:
        response = httpx.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 100},
            },
            timeout=10.0,
        )

        if response.status_code == 200:
            text = response.json().get("response", "").strip()
            result = _parse_recommendation(text, rec_data)
            try:
                r = _get_redis()
                r.setex(_cache_key(data_hash), CACHE_TTL, json.dumps(result))
            except Exception:
                pass
            return result

    except (httpx.ConnectError, httpx.TimeoutException):
        pass

    # Fallback
    return {
        "title": f"Practice {rec_data.get('topic', 'this topic')}",
        "description": f"Focus on {rec_data.get('subject', 'this subject')} — "
                       f"your mastery is at {round((rec_data.get('mastery', 0)) * 100)}%",
    }


# ─── Prompt Builders ──────────────────────────────────────────────────────────

def _build_prompt(ml_output, context):
    """Build the LLM prompt based on context."""
    if context == "duel_result":
        return f"""You are a friendly JEE preparation coach writing post-duel insights.
Convert the following ML analysis data into 3-4 short, natural English bullet points.

Rules:
- Each bullet should be ONE concise sentence (max 15 words)
- Be encouraging but honest
- Do NOT add analysis — only rephrase what the data says
- Do NOT use technical terms like 'mastery_probability' or 'BKT'
- Output ONLY the bullet points, one per line, prefixed with "- "

ML Data:
{json.dumps(ml_output, indent=2, default=str)}"""

    elif context == "study_planner":
        return f"""You are a friendly JEE study planner assistant.
Convert these study analytics into 3-4 actionable, motivating sentences for a student's dashboard.

Rules:
- Each sentence should be concise (max 15 words)
- Be specific about topics and progress
- Do NOT add analysis — only rephrase the data
- Output ONLY the sentences, one per line, prefixed with "- "

Analytics Data:
{json.dumps(ml_output, indent=2, default=str)}"""

    else:
        return f"""Rephrase this data into 3 clear, friendly English sentences.
Data: {json.dumps(ml_output, default=str)}
Output only the sentences, one per line, prefixed with "- "."""


def _parse_response(text):
    """Parse LLM response into a list of insight strings."""
    lines = text.strip().split("\n")
    insights = []
    for line in lines:
        line = line.strip()
        if line.startswith("- "):
            line = line[2:]
        if line and len(line) > 3:
            insights.append(line)
    return insights[:4]  # Cap at 4


def _parse_recommendation(text, fallback_data):
    """Parse a TITLE/DESCRIPTION response from the LLM."""
    title = fallback_data.get("topic", "Practice this topic")
    description = ""

    for line in text.split("\n"):
        line = line.strip()
        if line.upper().startswith("TITLE:"):
            title = line[6:].strip()
        elif line.upper().startswith("DESCRIPTION:"):
            description = line[12:].strip()

    return {"title": title, "description": description}


# ─── Template Fallback ────────────────────────────────────────────────────────

def _template_fallback(ml_output, context):
    """Generate insights without the LLM using simple templates."""
    insights = []

    if context == "duel_result":
        accuracy = ml_output.get("accuracy")
        if accuracy is not None:
            pct = round(accuracy * 100) if accuracy <= 1 else round(accuracy)
            if pct >= 80:
                insights.append(f"Excellent accuracy this duel — {pct}% correct")
            elif pct < 50:
                insights.append(f"Accuracy was {pct}% — let's review the missed topics")
            else:
                insights.append(f"Solid {pct}% accuracy — room to improve on harder questions")

        weak = ml_output.get("weak_topics", [])
        if weak:
            topics = ", ".join(t.get("topic", "") for t in weak[:2])
            insights.append(f"Focus areas: {topics}")

        behavior = ml_output.get("behavior")
        if behavior == "guessing":
            insights.append("Slow down on tough questions — speed isn't everything")
        elif behavior == "careful":
            insights.append("Great careful approach — accuracy is paying off")

    elif context == "study_planner":
        mastery = ml_output.get("overall_mastery")
        if mastery is not None:
            insights.append(f"Overall mastery across topics: {round(mastery * 100)}%")

        recs = ml_output.get("recommendations", [])
        for rec in recs[:2]:
            insights.append(f"Suggested: Practice {rec.get('topic', 'weak areas')}")

    if not insights:
        insights.append("Keep practicing to unlock personalized insights!")

    return insights
