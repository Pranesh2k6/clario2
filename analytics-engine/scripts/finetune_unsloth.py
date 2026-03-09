"""
Clario Analytics — Unsloth Fine-Tuning Script
True parameter fine-tuning of Llama 3.1:8B using Unsloth for efficient training.

Unsloth provides 2x faster training and 60% less memory usage compared to
standard PyTorch/HuggingFace implementations.

Requirements:
    pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
    pip install xformers trl peft accelerate bitsandbytes

Usage:
    python scripts/finetune_unsloth.py --epochs 3 --batch-size 4

Hardware Requirements:
    - GPU with at least 16GB VRAM (e.g., RTX 4090, A100)
    - For smaller GPUs (8-12GB), use --load-in-4bit flag
"""

import argparse
import json
import os
from pathlib import Path
from datetime import datetime
import sys

# Check if unsloth is available
try:
    from unsloth import FastLanguageModel
    from unsloth import is_bfloat16_supported
    import torch
    from datasets import load_dataset
    from trl import SFTTrainer
    from transformers import TrainingArguments
    UNSLOTH_AVAILABLE = True
except ImportError as e:
    UNSLOTH_AVAILABLE = False
    IMPORT_ERROR = str(e)

TRAINING_DATA_DIR = Path(__file__).parent.parent / "training_data"
CHAT_FORMAT_FILE = TRAINING_DATA_DIR / "teacher_feedback_chat.jsonl"
OUTPUT_DIR = Path(__file__).parent.parent / "models" / "clario-teacher-ft"


def check_requirements():
    """Check if all required packages are installed."""
    if not UNSLOTH_AVAILABLE:
        print("❌ Required packages not installed.")
        print("\nInstall with:")
        print('  pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"')
        print("  pip install xformers trl peft accelerate bitsandbytes")
        print(f"\nError: {IMPORT_ERROR}")
        return False

    # Check for CUDA
    if not torch.cuda.is_available():
        print("⚠️  WARNING: CUDA not available. Training will be very slow on CPU.")
        print("Consider using Google Colab with GPU runtime instead.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            return False

    return True


def load_and_prepare_data():
    """Load training data from JSONL and prepare for training."""
    if not CHAT_FORMAT_FILE.exists():
        print(f"❌ Training data not found: {CHAT_FORMAT_FILE}")
        print("Run prepare_finetuning_data.py first:")
        print("  python scripts/prepare_finetuning_data.py")
        return None

    # Load dataset
    dataset = load_dataset("json", data_files=str(CHAT_FORMAT_FILE), split="train")

    print(f"✅ Loaded {len(dataset)} training examples")

    # Show sample
    print("\n📝 Sample training example:")
    print("=" * 60)
    sample = dataset[0]
    for msg in sample["messages"]:
        print(f"{msg['role'].upper()}:")
        print(msg['content'][:200] + ("..." if len(msg['content']) > 200 else ""))
        print()
    print("=" * 60 + "\n")

    return dataset


def formatting_func(example):
    """Format training examples for the model."""
    messages = example["messages"]
    text = ""
    for msg in messages:
        if msg["role"] == "system":
            text += f"<|system|>\n{msg['content']}<|end|>\n"
        elif msg["role"] == "user":
            text += f"<|user|>\n{msg['content']}<|end|>\n"
        elif msg["role"] == "assistant":
            text += f"<|assistant|>\n{msg['content']}<|end|>\n"
    return text


def train_model(args):
    """Fine-tune Llama 3.1:8B using Unsloth."""
    print("🚀 Starting Fine-Tuning Process\n")
    print("=" * 60)
    print(f"Base model: {args.model}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size}")
    print(f"Learning rate: {args.learning_rate}")
    print(f"Max sequence length: {args.max_seq_length}")
    print(f"LoRA rank: {args.lora_rank}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60 + "\n")

    # Load dataset
    dataset = load_and_prepare_data()
    if dataset is None:
        return False

    # Load model with Unsloth optimizations
    print("📦 Loading base model with Unsloth optimizations...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.max_seq_length,
        dtype=None,  # Auto-detect
        load_in_4bit=args.load_in_4bit,
    )

    # Add LoRA adapters
    print("🔧 Adding LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_rank,  # LoRA rank
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,  # Optimized by Unsloth
        bias="none",
        use_gradient_checkpointing="unsloth",  # Very long context support
        random_state=42,
    )

    # Training arguments
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        num_train_epochs=args.epochs,
        learning_rate=args.learning_rate,
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        save_strategy="epoch",
        save_total_limit=2,
        report_to="none",  # Disable wandb
    )

    # Create trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        formatting_func=formatting_func,
        args=training_args,
    )

    # Train!
    print("\n🎓 Starting training...\n")
    trainer.train()

    # Save model
    print("\n💾 Saving fine-tuned model...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    # Save in GGUF format for Ollama
    if args.save_gguf:
        print("\n📦 Converting to GGUF format for Ollama...")
        gguf_path = OUTPUT_DIR / "clario-teacher-q4_k_m.gguf"
        model.save_pretrained_gguf(
            str(gguf_path),
            tokenizer,
            quantization_method="q4_k_m"  # 4-bit quantization
        )
        print(f"✅ GGUF model saved to {gguf_path}")
        print("\nTo use with Ollama:")
        print(f"  ollama create clario-teacher -f {gguf_path}")

    print("\n✅ Fine-tuning complete!")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Fine-tune Llama 3.1:8B for teacher-style feedback using Unsloth"
    )
    parser.add_argument(
        "--model",
        default="unsloth/Meta-Llama-3.1-8B-bnb-4bit",
        help="Base model from HuggingFace (default: unsloth/Meta-Llama-3.1-8B-bnb-4bit)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs (default: 3)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=2,
        help="Training batch size (default: 2)"
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=2e-4,
        help="Learning rate (default: 2e-4)"
    )
    parser.add_argument(
        "--max-seq-length",
        type=int,
        default=2048,
        help="Maximum sequence length (default: 2048)"
    )
    parser.add_argument(
        "--lora-rank",
        type=int,
        default=16,
        help="LoRA rank (default: 16)"
    )
    parser.add_argument(
        "--load-in-4bit",
        action="store_true",
        help="Load model in 4-bit quantization (saves memory)"
    )
    parser.add_argument(
        "--save-gguf",
        action="store_true",
        help="Save model in GGUF format for Ollama"
    )

    args = parser.parse_args()

    print("🎓 Clario Teacher Feedback Model — Unsloth Fine-Tuning\n")

    # Check requirements
    if not check_requirements():
        sys.exit(1)

    # Train
    success = train_model(args)

    if success:
        print("\n" + "=" * 60)
        print("🎉 Fine-tuning successful!")
        print("=" * 60)
        print("\nNext steps:")
        print(f"1. Test the model: python scripts/test_finetuned_model.py")
        print(f"2. Deploy to Ollama (if you saved GGUF)")
        print(f"3. Update analytics/config.py with the new model path")
    else:
        print("\n❌ Fine-tuning failed. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
