# Clario Duel Analysis — Teacher-Style Feedback System

## Objective
Convert raw machine-learning accuracy/speed metrics into professional, pedagogical "teacher-style" feedback. The NLG layer will use structured signals instead of raw numbers to ensure the LLM outputs high-quality, actionable insights without generating generic or overly statistical statements.

## Proposed Architecture Changes

The data flow will be strictly enforced:
`Telemetry (Node.js) → ML Engine (Python) → Structured Signals → NLG Layer (Ollama) → UI`

### 1. Structured Signal Extraction ([analytics-engine/analytics/feature_extraction.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/feature_extraction.py))
We will create a new function `extract_duel_performance_signals(duel_data, knowledge_profile)` that computes and categorizes performance into discrete string patterns, rather than just returning percentages.

**Output Schema:**
```json
{
  "weak_topic": "Quantum Numbers",              // Topic with lowest duel accuracy or < 50% mastery
  "strong_topic": "Complex Numbers",            // Topic with highest accuracy & speed
  "speed_pattern": "fast_incorrect",            // (fast_correct, fast_incorrect, slow_correct, slow_incorrect)
  "difficulty_pattern": "easy_fast_medium_slow",// Analyzes time taken relative to question difficulty
  "consistent_accuracy_topic": "Atomic Structure" // 100% accuracy on a topic with >1 question
}
```

### 2. Teacher-Style Feedback Templates ([analytics-engine/analytics/nlg_formatter.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py))
The [_template_fallback](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py#234-273) logic will be entirely rewritten to use the specific pedagogical templates provided. These will be used directly if the LLM fails, and serve as the baseline logic.

**Mapping Logic Implementation:**
- `weak_topic` ➔ Template 1 or 8 *(e.g., "Most incorrect responses were associated with {topic}...")*
- `strong_topic` ➔ Template 9 *(e.g., "You demonstrated strong confidence in {topic}...")*
- `fast_correct` ➔ Template 5 *(e.g., "Despite the competitive pace of the duel, you maintained strong accuracy...")*
- `fast_incorrect` ➔ Template 7 *(e.g., "Some responses were submitted very quickly but were incorrect...")*
- `medium_slow` ➔ Template 4 or 6 *(e.g., "Questions requiring multiple reasoning steps took longer to solve...")*
- `consistent_topic_accuracy` ➔ Template 3 *(e.g., "Your accuracy remained consistent across multiple questions involving {topic}...")*

### 3. LLM Prompt Engineering & Constraints ([analytics-engine/analytics/nlg_formatter.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py))
Update [_build_prompt](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py#169-202) for `context == "duel_result"` to enforce the persona.

**New Prompt Structure:**
```text
System:
You are an educational performance analyst generating professional teacher-style feedback for students.

User Input:
{structured_signals_json}

Task:
Generate up to 4 short insights about the student's duel performance based on the input signals.

Constraints:
- Max 4 sentences total.
- Each sentence must be 15-25 words.
- Tone MUST be professional teacher feedback.
- MUST AVOID terms like "Accuracy dropped", "Low performance", or generic motivational phrases.
- Prefer phrasing like "Several incorrect responses were associated with...", "You demonstrated strong confidence in..."
```

### 4. Data Collection for Fine-Tuning Llama 3.1:8B ([analytics-engine/analytics/nlg_formatter.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py))
We will add a logging hook ([mlflow_tracking.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/mlflow_tracking.py) or a simple JSONL file logger) inside [nlg_formatter.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py). Every time the NLG formatter runs, it will append the `instruction`, [input](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py#34-38) (structured signals), and `output` (generated insights) to `analytics-engine/training_data/teacher_feedback_v1.jsonl`. This builds the exact dataset needed to fine-tune the local Ollama instance in the future.

### 5. Frontend UI Adjustments ([frontend/src/pages/DuelResult.jsx](file:///Users/praneshjs/Education/Clario3/frontend/src/pages/DuelResult.jsx))
- Ensure the `nlgInsights` loop handles up to 4 strings perfectly.
- Ensure CSS styling (`text-[12px]`, `leading-relaxed`) is optimized for reading 15-25 word sentences.
- *Crucially*, we will remove the hardcoded `dynamicInsights` logic in React that previously generated strings like `"Quick responses — you answered most questions under 15s"`. The UI will now rely **100%** on the backend's `/insights` endpoint to guarantee consistent teacher-style tone.

## Verification Plan

1. **Python Unit Testing:** Write a script to pass mock signal JSONs directly to [nlg_formatter.py](file:///Users/praneshjs/Education/Clario3/analytics-engine/analytics/nlg_formatter.py) and verify that the LLM (or fallback) returns text adhering to the 15-25 word constraint and the requested templates.
2. **End-to-End Integration:** Play a test duel, simulate rapid incorrect answers on a specific topic. Verify that the UI displays Template 7 ("Some responses were submitted very quickly...") and Template 8 ("Most incorrect responses were associated with...").
3. **Training Data Check:** Verify that `teacher_feedback_v1.jsonl` is correctly appending the instructions, input, and outputs in the required format.
