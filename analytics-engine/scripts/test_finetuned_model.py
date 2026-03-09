"""
Clario Analytics — Fine-Tuned Model Testing Script
Test and compare fine-tuned models against the base model and templates.

Usage:
    python scripts/test_finetuned_model.py --model clario-teacher-ft
    python scripts/test_finetuned_model.py --compare llama3.1:8b clario-teacher-ft
"""

import argparse
import json
import httpx
from pathlib import Path
from datetime import datetime
from tabulate import tabulate

# Test cases covering different signal patterns
TEST_CASES = [
    {
        "name": "Weak on Quantum Numbers",
        "signals": {
            "weak_topic": "Quantum Numbers",
            "strong_topic": "Complex Numbers",
            "speed_pattern": "fast_incorrect",
            "difficulty_pattern": "easy_fast_medium_slow",
        },
    },
    {
        "name": "Consistent Performer",
        "signals": {
            "strong_topic": "Thermodynamics",
            "speed_pattern": "fast_correct",
            "consistent_accuracy_topic": "Atomic Structure",
        },
    },
    {
        "name": "Slow but Accurate",
        "signals": {
            "weak_topic": "Organic Chemistry",
            "speed_pattern": "slow_correct",
            "difficulty_pattern": "hard_slow",
        },
    },
    {
        "name": "Rushed and Incorrect",
        "signals": {
            "weak_topic": "Calculus",
            "speed_pattern": "fast_incorrect",
            "difficulty_pattern": "easy_fast_medium_slow",
        },
    },
]


def generate_with_ollama(model_name, signals, timeout=15):
    """Generate insights using an Ollama model."""
    prompt = f"""Student Performance Signals:
{json.dumps(signals, indent=2)}

Generate 3-4 teacher-style feedback insights. Each insight should be 15-25 words.
Output as a bulleted list with "- " prefix."""

    try:
        response = httpx.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.25,
                    "num_predict": 250,
                },
            },
            timeout=timeout,
        )

        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            insights = parse_insights(result)
            return insights, None
        else:
            return None, f"HTTP {response.status_code}"

    except Exception as e:
        return None, str(e)


def generate_with_templates(signals):
    """Generate insights using deterministic templates."""
    # Import the template fallback function
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from analytics.nlg_formatter import _teacher_template_fallback

    return _teacher_template_fallback(signals)


def parse_insights(text):
    """Parse LLM output into list of insights."""
    lines = text.strip().split("\n")
    insights = []
    for line in lines:
        line = line.strip()
        if line.startswith("- "):
            line = line[2:]
        # Remove numbering
        if len(line) > 3 and line[0].isdigit() and line[1] in ".)" and line[2] == " ":
            line = line[3:]
        if line and len(line) > 5:
            insights.append(line)
    return insights[:4]


def evaluate_insight(insight):
    """Evaluate quality of a single insight."""
    words = insight.split()
    word_count = len(words)

    # Check word count (15-25 is target)
    if 15 <= word_count <= 25:
        word_score = 1.0
    elif 10 <= word_count <= 30:
        word_score = 0.7
    else:
        word_score = 0.3

    # Check for banned phrases
    banned = ["accuracy dropped", "low performance", "keep practicing",
              "great job", "well done", "good work", "review core concepts"]
    has_banned = any(phrase in insight.lower() for phrase in banned)
    tone_score = 0.0 if has_banned else 1.0

    # Check for teacher-style markers
    teacher_markers = ["associated with", "demonstrated", "confidence in",
                       "remained consistent", "suggesting", "indicating",
                       "may benefit", "required"]
    has_markers = any(marker in insight.lower() for marker in teacher_markers)
    style_score = 1.0 if has_markers else 0.5

    overall = (word_score + tone_score + style_score) / 3
    return {
        "word_count": word_count,
        "word_score": word_score,
        "tone_score": tone_score,
        "style_score": style_score,
        "overall": overall,
    }


def compare_models(models):
    """Compare multiple models across test cases."""
    print("\n" + "=" * 80)
    print("🧪 Fine-Tuned Model Comparison")
    print("=" * 80 + "\n")

    results = {model: [] for model in models}
    results["templates"] = []

    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"Test Case {i}: {test_case['name']}")
        print("-" * 80)
        print(f"Signals: {json.dumps(test_case['signals'], indent=2)}\n")

        # Test each model
        for model in models:
            print(f"\n📊 Model: {model}")
            insights, error = generate_with_ollama(model, test_case["signals"])

            if error:
                print(f"  ❌ Error: {error}")
                results[model].append({"error": error})
                continue

            if not insights:
                print(f"  ⚠️  No insights generated")
                results[model].append({"error": "No output"})
                continue

            # Evaluate each insight
            scores = []
            for j, insight in enumerate(insights, 1):
                eval_result = evaluate_insight(insight)
                scores.append(eval_result["overall"])
                print(f"  {j}. {insight}")
                print(f"     [{eval_result['word_count']} words | Score: {eval_result['overall']:.2f}]")

            avg_score = sum(scores) / len(scores) if scores else 0
            results[model].append({"insights": insights, "score": avg_score})

        # Test templates
        print(f"\n📝 Deterministic Templates")
        template_insights = generate_with_templates(test_case["signals"])
        scores = []
        for j, insight in enumerate(template_insights, 1):
            eval_result = evaluate_insight(insight)
            scores.append(eval_result["overall"])
            print(f"  {j}. {insight}")
            print(f"     [{eval_result['word_count']} words | Score: {eval_result['overall']:.2f}]")

        avg_score = sum(scores) / len(scores) if scores else 0
        results["templates"].append({"insights": template_insights, "score": avg_score})

        print("\n" + "=" * 80 + "\n")

    # Summary table
    print("\n📊 Overall Performance Summary")
    print("=" * 80)

    summary_data = []
    for model_name, test_results in results.items():
        scores = [r.get("score", 0) for r in test_results if "score" in r]
        errors = sum(1 for r in test_results if "error" in r)
        avg_score = sum(scores) / len(scores) if scores else 0
        summary_data.append([
            model_name,
            f"{avg_score:.3f}",
            f"{len(scores)}/{len(test_results)}",
            errors,
        ])

    headers = ["Model", "Avg Score", "Success", "Errors"]
    print(tabulate(summary_data, headers=headers, tablefmt="grid"))
    print()


def test_single_model(model_name):
    """Test a single model and show detailed results."""
    print("\n" + "=" * 80)
    print(f"🧪 Testing Model: {model_name}")
    print("=" * 80 + "\n")

    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"\nTest Case {i}: {test_case['name']}")
        print("-" * 80)
        print(f"Signals: {json.dumps(test_case['signals'], indent=2)}\n")

        insights, error = generate_with_ollama(model_name, test_case["signals"])

        if error:
            print(f"❌ Error: {error}\n")
            continue

        if not insights:
            print(f"⚠️  No insights generated\n")
            continue

        print("Generated Insights:")
        total_score = 0
        for j, insight in enumerate(insights, 1):
            eval_result = evaluate_insight(insight)
            total_score += eval_result["overall"]

            status = "✅" if eval_result["overall"] >= 0.7 else "⚠️"
            print(f"  {status} {j}. {insight}")
            print(f"      Words: {eval_result['word_count']} | "
                  f"Word Score: {eval_result['word_score']:.2f} | "
                  f"Tone: {eval_result['tone_score']:.2f} | "
                  f"Style: {eval_result['style_score']:.2f} | "
                  f"Overall: {eval_result['overall']:.2f}")

        avg_score = total_score / len(insights) if insights else 0
        print(f"\n  Average Score: {avg_score:.3f}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Test and compare fine-tuned Llama models"
    )
    parser.add_argument(
        "--model",
        help="Test a single model"
    )
    parser.add_argument(
        "--compare",
        nargs="+",
        help="Compare multiple models (e.g., --compare llama3.1:8b clario-teacher-ft)"
    )

    args = parser.parse_args()

    if args.compare:
        compare_models(args.compare)
    elif args.model:
        test_single_model(args.model)
    else:
        # Default: compare base model with templates
        print("No model specified. Use --model or --compare")
        print("\nExamples:")
        print("  python scripts/test_finetuned_model.py --model clario-teacher-ft")
        print("  python scripts/test_finetuned_model.py --compare llama3.1:8b clario-teacher-ft")


if __name__ == "__main__":
    main()
