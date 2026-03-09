"""
Clario Analytics — Fine-Tuning Data Preparation
Converts teacher_feedback_v1.jsonl into formats suitable for fine-tuning Llama 3.1:8B.

This script prepares the training data collected from the NLG formatter
for fine-tuning a local Ollama model.
"""

import json
import os
from pathlib import Path
from datetime import datetime

# Paths
ANALYTICS_DIR = Path(__file__).parent.parent / "analytics"
TRAINING_DATA_DIR = Path(__file__).parent.parent / "training_data"
INPUT_FILE = TRAINING_DATA_DIR / "teacher_feedback_v1.jsonl"
OUTPUT_ALPACA_FILE = TRAINING_DATA_DIR / "teacher_feedback_alpaca.jsonl"
OUTPUT_CHAT_FILE = TRAINING_DATA_DIR / "teacher_feedback_chat.jsonl"


def load_training_data():
    """Load the raw JSONL training data."""
    if not INPUT_FILE.exists():
        print(f"❌ Training data file not found: {INPUT_FILE}")
        return []

    data = []
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                data.append(entry)
            except json.JSONDecodeError as e:
                print(f"⚠️  Skipping malformed line {line_num}: {e}")
                continue

    print(f"✅ Loaded {len(data)} training examples from {INPUT_FILE}")
    return data


def convert_to_alpaca_format(data):
    """
    Convert to Alpaca instruction format:
    {
        "instruction": "...",
        "input": "...",
        "output": "..."
    }
    """
    alpaca_data = []
    for entry in data:
        # Convert signals dict to formatted text
        signals = entry.get("input", {})
        signals_text = "\n".join([f"- {k}: {v}" for k, v in signals.items() if v])

        # Convert insights list to single text block
        insights = entry.get("output", [])
        if isinstance(insights, list):
            output_text = "\n".join([f"- {insight}" for insight in insights])
        else:
            output_text = str(insights)

        alpaca_entry = {
            "instruction": entry.get("instruction", "Generate professional teacher-style duel feedback."),
            "input": signals_text,
            "output": output_text,
        }
        alpaca_data.append(alpaca_entry)

    return alpaca_data


def convert_to_chat_format(data):
    """
    Convert to chat/conversation format for models like Llama 3.1:
    {
        "messages": [
            {"role": "system", "content": "..."},
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }
    """
    chat_data = []
    system_prompt = (
        "You are an educational performance analyst generating professional "
        "teacher-style feedback for students after competitive duel quizzes. "
        "Your feedback must be concise (15-25 words per insight), specific to "
        "the signals provided, and use professional pedagogical language."
    )

    for entry in data:
        signals = entry.get("input", {})
        insights = entry.get("output", [])

        user_content = f"Student Performance Signals:\n{json.dumps(signals, indent=2)}\n\nGenerate 3-4 teacher-style feedback insights."

        if isinstance(insights, list):
            assistant_content = "\n".join([f"- {insight}" for insight in insights])
        else:
            assistant_content = str(insights)

        chat_entry = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
                {"role": "assistant", "content": assistant_content},
            ]
        }
        chat_data.append(chat_entry)

    return chat_data


def save_jsonl(data, output_file):
    """Save data to JSONL format."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        for entry in data:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"✅ Saved {len(data)} examples to {output_file}")


def generate_stats(data):
    """Generate statistics about the training data."""
    if not data:
        return

    total = len(data)
    print("\n" + "=" * 60)
    print("📊 Training Data Statistics")
    print("=" * 60)
    print(f"Total examples: {total}")

    # Count examples by signal type
    signal_counts = {}
    for entry in data:
        signals = entry.get("input", {})
        for key in signals.keys():
            signal_counts[key] = signal_counts.get(key, 0) + 1

    print("\nSignal distribution:")
    for signal, count in sorted(signal_counts.items(), key=lambda x: -x[1]):
        print(f"  - {signal}: {count} ({count/total*100:.1f}%)")

    # Output length stats
    output_lengths = []
    for entry in data:
        insights = entry.get("output", [])
        if isinstance(insights, list):
            for insight in insights:
                word_count = len(str(insight).split())
                output_lengths.append(word_count)

    if output_lengths:
        avg_length = sum(output_lengths) / len(output_lengths)
        min_length = min(output_lengths)
        max_length = max(output_lengths)
        print(f"\nInsight word count:")
        print(f"  - Average: {avg_length:.1f} words")
        print(f"  - Range: {min_length} - {max_length} words")
        print(f"  - Target: 15-25 words")

    print("=" * 60 + "\n")


def main():
    print("🚀 Preparing Llama 3.1:8B Fine-Tuning Data\n")

    # Load raw data
    data = load_training_data()
    if not data:
        print("❌ No training data available. Play some duels first!")
        return

    # Generate statistics
    generate_stats(data)

    # Convert to Alpaca format
    print("Converting to Alpaca instruction format...")
    alpaca_data = convert_to_alpaca_format(data)
    save_jsonl(alpaca_data, OUTPUT_ALPACA_FILE)

    # Convert to chat format
    print("Converting to chat/conversation format...")
    chat_data = convert_to_chat_format(data)
    save_jsonl(chat_data, OUTPUT_CHAT_FILE)

    print("\n✅ Data preparation complete!")
    print(f"\nNext steps:")
    print(f"1. Review the prepared data in:")
    print(f"   - {OUTPUT_ALPACA_FILE}")
    print(f"   - {OUTPUT_CHAT_FILE}")
    print(f"2. Run the fine-tuning script: python scripts/finetune_ollama.py")
    print(f"3. Or use Unsloth for GPU fine-tuning: python scripts/finetune_unsloth.py")


if __name__ == "__main__":
    main()
