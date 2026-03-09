"""
Clario Analytics Engine — NLG Formatter (Teacher-Style Feedback)
Translates structured ML performance signals into professional,
pedagogical "teacher-style" feedback sentences.

IMPORTANT: The LLM does NOT perform any analysis. It only reformats
pre-computed structured signals into human-friendly sentences.

Architecture:
    Structured Signals → Template Fallback → (optional) LLM Enhancement → Output
"""

import json
import os
import hashlib
from datetime import datetime, timezone

import httpx
import redis as redis_lib
from .config import config

OLLAMA_URL = config.OLLAMA_URL
MODEL_NAME = config.OLLAMA_MODEL
CACHE_TTL = 3600  # 1 hour

# Redis client for caching generated text
_redis = None

# ─── Training data directory for fine-tuning ──────────────────────────────────
TRAINING_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "training_data")
TRAINING_DATA_FILE = os.path.join(TRAINING_DATA_DIR, "teacher_feedback_v1.jsonl")


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


# ─── Teacher-Style Feedback Templates ─────────────────────────────────────────
# These 9 templates map directly to the structured ML signals.
# They are used as the deterministic fallback AND as the gold-standard tone
# for guiding the LLM prompt.

TEACHER_TEMPLATES = {
    # Template 1 — weak_topic (improving)
    "weak_improving": (
        "Improving accuracy on questions involving {topic} may significantly "
        "increase your overall duel performance."
    ),
    # Template 2 — general performance (no specific topic)
    "general_performance": (
        "Your current performance suggests you are well prepared for questions "
        "at this difficulty level, though refining a few concepts could improve consistency."
    ),
    # Template 3 — consistent_accuracy_topic
    "consistent_accuracy": (
        "Your accuracy remained consistent across multiple questions involving "
        "{topic}, indicating reliable understanding."
    ),
    # Template 4 — difficulty_pattern: easy_fast_medium_slow
    "difficulty_gap": (
        "You solved foundational questions efficiently, while more advanced "
        "questions required additional time and reasoning."
    ),
    # Template 5 — speed_pattern: fast_correct
    "fast_correct": (
        "Despite the competitive pace of the duel, you maintained strong "
        "accuracy on several questions."
    ),
    # Template 6 — difficulty_pattern: hard_slow / progressive_slower
    "slow_complex": (
        "Questions requiring multiple reasoning steps took longer to solve, "
        "suggesting these problems required deeper analysis."
    ),
    # Template 7 — speed_pattern: fast_incorrect
    "fast_incorrect": (
        "Some responses were submitted very quickly but were incorrect, "
        "which may indicate uncertainty with the underlying concept."
    ),
    # Template 8 — weak_topic (most incorrect)
    "weak_topic_review": (
        "Most incorrect responses were associated with {topic}, suggesting "
        "this concept may benefit from further review."
    ),
    # Template 9 — strong_topic
    "strong_confidence": (
        "You demonstrated strong confidence in {topic}, answering these "
        "questions both quickly and accurately."
    ),
}

# ─── Signal → Template Mapping ────────────────────────────────────────────────
# Each ML signal maps to one or more template keys.
SIGNAL_TEMPLATE_MAP = {
    "weak_topic":                ["weak_topic_review", "weak_improving"],
    "strong_topic":              ["strong_confidence"],
    "fast_correct":              ["fast_correct"],
    "fast_incorrect":            ["fast_incorrect"],
    "easy_fast_medium_slow":     ["difficulty_gap"],
    "hard_slow":                 ["slow_complex"],
    "progressive_slower":        ["slow_complex"],
    "consistent_accuracy_topic": ["consistent_accuracy"],
}


def format_duel_insights(signals):
    """
    Format structured duel performance signals into teacher-style feedback.

    This is the PRIMARY entry point for duel result insights.

    Args:
        signals: dict from extract_duel_performance_signals(), e.g.:
            {
                "weak_topic": "Quantum Numbers",
                "strong_topic": "Complex Numbers",
                "speed_pattern": "fast_correct",
                "difficulty_pattern": "easy_fast_medium_slow",
                "consistent_accuracy_topic": "Atomic Structure"
            }

    Returns:
        list of 3-4 human-readable teacher-style insight strings
    """
    # Check cache first
    cache_data = {"signals": signals, "type": "teacher_duel"}
    data_hash = _hash_input(cache_data)

    try:
        r = _get_redis()
        cached = r.get(_cache_key(data_hash))
        if cached:
            return json.loads(cached)
    except Exception:
        pass  # Redis down — skip cache

    # Try LLM-enhanced generation first
    insights = _llm_generate_teacher_insights(signals)

    # Fall back to deterministic templates if LLM fails
    if not insights:
        insights = _teacher_template_fallback(signals)

    # Cap at 4 insights
    insights = insights[:4]

    # Cache the result
    try:
        r = _get_redis()
        r.setex(_cache_key(data_hash), CACHE_TTL, json.dumps(insights))
    except Exception:
        pass

    # Log for fine-tuning dataset
    _log_training_pair(signals, insights)

    return insights


def format_insights(ml_output, context="duel_result"):
    """
    Format ML analysis output into readable insights.
    Backwards-compatible entry point.

    Args:
        ml_output: dict with ML-computed metrics (mastery, behavior, etc.)
        context: one of 'duel_result', 'study_planner', 'recommendation'

    Returns:
        list of human-readable insight strings
    """
    # If this is a duel_result context and we have structured signals, use the
    # new teacher-style pipeline
    if context == "duel_result" and "speed_pattern" in ml_output:
        return format_duel_insights(ml_output)

    # Check cache first
    cache_data = {"output": ml_output, "context": context}
    data_hash = _hash_input(cache_data)

    try:
        r = _get_redis()
        cached = r.get(_cache_key(data_hash))
        if cached:
            return json.loads(cached)
    except Exception:
        pass

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

            try:
                r = _get_redis()
                r.setex(_cache_key(data_hash), CACHE_TTL, json.dumps(insights))
            except Exception:
                pass

            return insights

    except (httpx.ConnectError, httpx.TimeoutException):
        pass

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

    return {
        "title": f"Practice {rec_data.get('topic', 'this topic')}",
        "description": f"Focus on {rec_data.get('subject', 'this subject')} — "
                       f"your mastery is at {round((rec_data.get('mastery', 0)) * 100)}%",
    }


# ─── Teacher-Style LLM Generation ────────────────────────────────────────────

def _llm_generate_teacher_insights(signals):
    """
    Use Ollama to generate teacher-style feedback from structured signals.
    Returns a list of insight strings, or empty list on failure.
    """
    prompt = f"""System:
You are an educational performance analyst generating professional teacher-style feedback for a student after a competitive duel quiz.

User Input:
{json.dumps(signals, indent=2, default=str)}

Task:
Generate 3 to 4 short insights about the student's duel performance based on the input signals.

Constraints:
- Output ONLY the insight sentences, one per line, prefixed with "- ".
- Each sentence MUST be 15-25 words long.
- Tone MUST be professional teacher feedback — like a teacher reviewing a student's test.
- MUST AVOID generic phrases like "Accuracy dropped", "Low performance", "Keep practicing", "Great job", "Review core concepts".
- PREFER phrasing like "Several incorrect responses were associated with...", "You demonstrated strong confidence in...", "Your accuracy remained consistent across..."
- If a topic name is provided in the signals, USE IT in the sentence.
- Do NOT add analysis beyond what the signals indicate.
- Do NOT use bullet numbering or headers."""

    try:
        response = httpx.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.25,
                    "num_predict": 250,
                    "top_p": 0.85,
                },
            },
            timeout=15.0,
        )

        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            insights = _parse_response(result)
            # Validate: each insight should be 10-35 words (some tolerance)
            valid = [i for i in insights if 10 <= len(i.split()) <= 35]
            return valid[:4] if valid else []

    except (httpx.ConnectError, httpx.TimeoutException):
        pass

    return []


# ─── Teacher Template Deterministic Fallback ──────────────────────────────────

def _teacher_template_fallback(signals):
    """
    Generate teacher-style insights using deterministic template mapping.
    This guarantees consistent, high-quality output when Ollama is unavailable.
    """
    insights = []

    # 1. Strong topic → Template 9
    strong = signals.get("strong_topic")
    if strong:
        insights.append(
            TEACHER_TEMPLATES["strong_confidence"].format(topic=strong)
        )

    # 2. Weak topic → Template 8 (or Template 1 as alternate)
    weak = signals.get("weak_topic")
    if weak:
        insights.append(
            TEACHER_TEMPLATES["weak_topic_review"].format(topic=weak)
        )

    # 3. Speed pattern
    speed = signals.get("speed_pattern", "balanced")
    if speed == "fast_correct":
        insights.append(TEACHER_TEMPLATES["fast_correct"])
    elif speed == "fast_incorrect":
        insights.append(TEACHER_TEMPLATES["fast_incorrect"])

    # 4. Difficulty pattern
    difficulty = signals.get("difficulty_pattern", "uniform")
    if difficulty == "easy_fast_medium_slow":
        insights.append(TEACHER_TEMPLATES["difficulty_gap"])
    elif difficulty in ("hard_slow", "progressive_slower"):
        insights.append(TEACHER_TEMPLATES["slow_complex"])

    # 5. Consistent accuracy topic → Template 3
    consistent = signals.get("consistent_accuracy_topic")
    if consistent and len(insights) < 4:
        insights.append(
            TEACHER_TEMPLATES["consistent_accuracy"].format(topic=consistent)
        )

    # If we still have fewer than 2 insights, add a general filler
    if len(insights) < 2:
        insights.append(TEACHER_TEMPLATES["general_performance"])

    return insights[:4]


# ─── Legacy Prompt Builders (for non-duel contexts) ───────────────────────────

def _build_prompt(ml_output, context):
    """Build the LLM prompt for non-duel contexts."""
    if context == "study_planner":
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
        # Remove any numbering like "1. " or "1) "
        if len(line) > 3 and line[0].isdigit() and line[1] in ".)" and line[2] == " ":
            line = line[3:]
        if line and len(line) > 3:
            insights.append(line)
    return insights[:4]


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


# ─── Legacy Template Fallback (non-duel contexts) ────────────────────────────

def _template_fallback(ml_output, context):
    """Generate insights without the LLM for non-duel contexts."""
    insights = []

    if context == "study_planner":
        mastery = ml_output.get("overall_mastery")
        if mastery is not None:
            insights.append(f"Overall mastery across topics: {round(mastery * 100)}%")

        recs = ml_output.get("recommendations", [])
        for rec in recs[:2]:
            insights.append(f"Suggested: Practice {rec.get('topic', 'weak areas')}")

    if not insights:
        insights.append("Keep practicing to unlock personalized insights!")

    return insights


# ─── Fine-Tuning Data Logger ─────────────────────────────────────────────────

def _log_training_pair(signals, insights):
    """
    Append an instruction/input/output triple to the JSONL training file.
    This builds the dataset for fine-tuning Llama 3.1:8B.
    """
    try:
        os.makedirs(TRAINING_DATA_DIR, exist_ok=True)
        entry = {
            "instruction": "Generate professional teacher-style duel feedback.",
            "input": signals,
            "output": insights,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        with open(TRAINING_DATA_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, default=str) + "\n")
    except Exception:
        pass  # Never let logging break the pipeline
