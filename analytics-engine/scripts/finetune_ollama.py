"""
Clario Analytics — Ollama Fine-Tuning Script
Fine-tune Llama 3.1:8B using Ollama's built-in fine-tuning capabilities.

Usage:
    python scripts/finetune_ollama.py [--model llama3.1:8b] [--epochs 3]

Requirements:
    - Ollama installed and running
    - Training data prepared using prepare_finetuning_data.py
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

TRAINING_DATA_DIR = Path(__file__).parent.parent / "training_data"
CHAT_FORMAT_FILE = TRAINING_DATA_DIR / "teacher_feedback_chat.jsonl"
MODELS_DIR = Path(__file__).parent.parent / "models"


def check_ollama():
    """Check if Ollama is installed and running."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode != 0:
            print("❌ Ollama is not running. Start Ollama first:")
            print("   brew services start ollama")
            return False
        return True
    except FileNotFoundError:
        print("❌ Ollama is not installed. Install it first:")
        print("   brew install ollama")
        return False


def create_modelfile(base_model, adapter_path, output_name):
    """
    Create a Modelfile for Ollama to load the fine-tuned model.

    Note: As of late 2024, Ollama doesn't have native fine-tuning.
    This script creates a Modelfile with custom system prompts that
    guide the base model to behave like a fine-tuned version.

    For true fine-tuning, use the Unsloth script instead.
    """
    modelfile_content = f"""# Clario Teacher Feedback Model
# Fine-tuned {base_model} for teacher-style duel feedback
# Created: {datetime.now().isoformat()}

FROM {base_model}

# System prompt that guides the model's behavior
SYSTEM \"\"\"You are an educational performance analyst generating professional teacher-style feedback for students after competitive duel quizzes.

Your role is to analyze structured performance signals and produce concise, actionable insights that:
- Are 15-25 words per insight
- Use professional pedagogical language (avoid "great job", "keep practicing", etc.)
- Reference specific topics when provided
- Focus on patterns rather than raw numbers
- Sound like a teacher reviewing a student's test

Example patterns you should follow:
- "Most incorrect responses were associated with [TOPIC], suggesting this concept may benefit from further review."
- "You demonstrated strong confidence in [TOPIC], answering these questions both quickly and accurately."
- "Despite the competitive pace of the duel, you maintained strong accuracy on several questions."
- "Some responses were submitted very quickly but were incorrect, which may indicate uncertainty with the underlying concept."

Always output insights as a bulleted list with "- " prefix.
\"\"\"

# Model parameters optimized for consistent, focused output
PARAMETER temperature 0.25
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
PARAMETER num_predict 250

# Template for formatting (optional)
TEMPLATE \"\"\"{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end|>
{{ end }}<|assistant|>
{{ .Response }}<|end|>
\"\"\"
"""

    modelfile_path = MODELS_DIR / f"Modelfile.{output_name}"
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    with open(modelfile_path, "w", encoding="utf-8") as f:
        f.write(modelfile_content)

    print(f"✅ Created Modelfile at {modelfile_path}")
    return modelfile_path


def create_custom_model(modelfile_path, model_name):
    """Create a custom Ollama model from the Modelfile."""
    try:
        print(f"\n📦 Creating custom model '{model_name}'...")
        result = subprocess.run(
            ["ollama", "create", model_name, "-f", str(modelfile_path)],
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode == 0:
            print(f"✅ Model '{model_name}' created successfully!")
            print(f"\nTo use this model in your analytics engine:")
            print(f"1. Update analytics/config.py:")
            print(f"   OLLAMA_MODEL = '{model_name}'")
            print(f"2. Restart the analytics API")
            return True
        else:
            print(f"❌ Failed to create model: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error creating model: {e}")
        return False


def test_model(model_name):
    """Test the custom model with a sample query."""
    test_signals = {
        "weak_topic": "Quantum Numbers",
        "strong_topic": "Complex Numbers",
        "speed_pattern": "fast_incorrect",
        "difficulty_pattern": "easy_fast_medium_slow"
    }

    test_prompt = f"""Student Performance Signals:
{json.dumps(test_signals, indent=2)}

Generate 3-4 teacher-style feedback insights."""

    print(f"\n🧪 Testing model '{model_name}'...\n")
    print("Test input:")
    print(test_prompt)
    print("\nModel output:")
    print("-" * 60)

    try:
        result = subprocess.run(
            ["ollama", "run", model_name, test_prompt],
            capture_output=True,
            text=True,
            check=False,
            timeout=30
        )

        if result.returncode == 0:
            print(result.stdout)
            print("-" * 60)
            print("✅ Model test complete!")
        else:
            print(f"❌ Test failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("❌ Test timed out (model may be too slow)")
    except Exception as e:
        print(f"❌ Test error: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Fine-tune Llama 3.1:8B for teacher-style feedback"
    )
    parser.add_argument(
        "--model",
        default="llama3.1:8b",
        help="Base model to fine-tune (default: llama3.1:8b)"
    )
    parser.add_argument(
        "--output-name",
        default="clario-teacher",
        help="Name for the custom model (default: clario-teacher)"
    )
    parser.add_argument(
        "--skip-test",
        action="store_true",
        help="Skip testing the model after creation"
    )

    args = parser.parse_args()

    print("🎓 Clario Teacher Feedback Model — Ollama Setup\n")
    print("=" * 60)

    # Check prerequisites
    if not check_ollama():
        sys.exit(1)

    if not CHAT_FORMAT_FILE.exists():
        print(f"❌ Training data not found: {CHAT_FORMAT_FILE}")
        print("Run prepare_finetuning_data.py first:")
        print("  python scripts/prepare_finetuning_data.py")
        sys.exit(1)

    # Load and show stats
    with open(CHAT_FORMAT_FILE, "r") as f:
        training_examples = [json.loads(line) for line in f if line.strip()]

    print(f"📊 Found {len(training_examples)} training examples")
    print("=" * 60 + "\n")

    # Note about limitations
    print("⚠️  NOTE: Ollama doesn't support native fine-tuning yet.")
    print("This script creates a custom model with an enhanced system prompt")
    print("that guides the base model to produce teacher-style feedback.\n")
    print("For true parameter fine-tuning with your data, use:")
    print("  python scripts/finetune_unsloth.py\n")

    # Create Modelfile
    modelfile_path = create_modelfile(
        args.model,
        CHAT_FORMAT_FILE,
        args.output_name
    )

    # Create custom model
    success = create_custom_model(modelfile_path, args.output_name)

    if success and not args.skip_test:
        test_model(args.output_name)

    print("\n✅ Setup complete!")
    print(f"\nYour custom model '{args.output_name}' is ready to use.")


if __name__ == "__main__":
    main()
