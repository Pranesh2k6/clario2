# Clario Analytics — Fine-Tuning Scripts

This directory contains scripts for fine-tuning Llama 3.1:8B with teacher-style feedback data.

## 📁 Scripts Overview

| Script | Purpose | Requirements |
|--------|---------|--------------|
| `prepare_finetuning_data.py` | Convert JSONL training data to fine-tuning formats | Python 3.8+ |
| `finetune_ollama.py` | Create custom Ollama model with enhanced prompts | Ollama installed |
| `finetune_unsloth.py` | True parameter fine-tuning using Unsloth | GPU, Unsloth, PyTorch |
| `test_finetuned_model.py` | Evaluate and compare model performance | Ollama running |

## 🚀 Quick Start

### 1. Collect Training Data

Play duels and the system automatically logs data to:
```
training_data/teacher_feedback_v1.jsonl
```

Check your data:
```bash
wc -l training_data/teacher_feedback_v1.jsonl
```

**Recommendation:** Collect at least 100 examples before fine-tuning.

### 2. Prepare Data

```bash
python scripts/prepare_finetuning_data.py
```

This creates:
- `training_data/teacher_feedback_alpaca.jsonl` - Alpaca format
- `training_data/teacher_feedback_chat.jsonl` - Chat/conversation format

### 3. Choose Your Method

#### Method A: Quick Setup (Ollama Custom Model)

**Pros:** Fast, no GPU needed, works immediately
**Cons:** Not true fine-tuning, limited customization

```bash
python scripts/finetune_ollama.py --model llama3.1:8b --output-name clario-teacher
```

#### Method B: True Fine-Tuning (Unsloth)

**Pros:** True parameter updates, best quality
**Cons:** Requires GPU, slower

```bash
# Install dependencies first
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install xformers trl peft accelerate bitsandbytes

# Fine-tune
python scripts/finetune_unsloth.py --epochs 3 --save-gguf
```

### 4. Test Your Model

```bash
# Test single model
python scripts/test_finetuned_model.py --model clario-teacher

# Compare multiple models
python scripts/test_finetuned_model.py --compare llama3.1:8b clario-teacher
```

### 5. Deploy

Update `analytics/config.py`:
```python
OLLAMA_MODEL = "clario-teacher"  # Your fine-tuned model
```

Restart the analytics API:
```bash
python -m analytics.api
```

## 📊 Script Details

### prepare_finetuning_data.py

**Input:** `training_data/teacher_feedback_v1.jsonl`
**Output:** Two formatted JSONL files for training

**Options:**
- None (runs with defaults)

**Example:**
```bash
python scripts/prepare_finetuning_data.py
```

**Output:**
```
✅ Loaded 150 training examples
📊 Training Data Statistics
  Total examples: 150
  Signal distribution:
    - weak_topic: 120 (80.0%)
    - speed_pattern: 145 (96.7%)
  Insight word count:
    - Average: 18.5 words
    - Target: 15-25 words
```

---

### finetune_ollama.py

**Purpose:** Create custom Ollama model with enhanced system prompt

**Options:**
- `--model <name>` - Base model (default: llama3.1:8b)
- `--output-name <name>` - Custom model name (default: clario-teacher)
- `--skip-test` - Don't test after creation

**Example:**
```bash
python scripts/finetune_ollama.py \
  --model llama3.1:8b \
  --output-name clario-teacher-v2
```

**What It Does:**
1. Creates a Modelfile with custom system prompt
2. Loads your training examples into the prompt
3. Creates a new Ollama model
4. Tests the model with sample inputs

**Limitations:**
- Not true parameter fine-tuning
- Limited by context window size
- May not generalize as well as true fine-tuning

---

### finetune_unsloth.py

**Purpose:** True gradient-based parameter fine-tuning

**Requirements:**
- GPU with 16GB+ VRAM (or 8GB with --load-in-4bit)
- CUDA 11.8+
- Python 3.10+

**Options:**
- `--model <hf_model>` - HuggingFace model (default: unsloth/Meta-Llama-3.1-8B-bnb-4bit)
- `--epochs <n>` - Training epochs (default: 3)
- `--batch-size <n>` - Batch size (default: 2)
- `--learning-rate <f>` - Learning rate (default: 2e-4)
- `--max-seq-length <n>` - Max sequence length (default: 2048)
- `--lora-rank <n>` - LoRA rank (default: 16)
- `--load-in-4bit` - Use 4-bit quantization (saves memory)
- `--save-gguf` - Save in GGUF format for Ollama

**Examples:**

Standard training (16GB+ GPU):
```bash
python scripts/finetune_unsloth.py \
  --epochs 3 \
  --batch-size 4 \
  --save-gguf
```

Low-memory training (8-12GB GPU):
```bash
python scripts/finetune_unsloth.py \
  --epochs 3 \
  --batch-size 2 \
  --load-in-4bit \
  --save-gguf
```

Aggressive training (more data, higher LR):
```bash
python scripts/finetune_unsloth.py \
  --epochs 5 \
  --learning-rate 5e-4 \
  --lora-rank 32
```

**Output:**
- `models/clario-teacher-ft/` - Full model checkpoint
- `models/clario-teacher-ft/*.gguf` - Quantized model for Ollama

**Deploy to Ollama:**
```bash
ollama create clario-teacher-ft \
  -f models/clario-teacher-ft/clario-teacher-q4_k_m.gguf
```

---

### test_finetuned_model.py

**Purpose:** Evaluate model quality with standardized test cases

**Options:**
- `--model <name>` - Test single model
- `--compare <model1> <model2> ...` - Compare multiple models

**Test Cases:**
1. Weak on Quantum Numbers (fast_incorrect)
2. Consistent Performer (fast_correct)
3. Slow but Accurate (hard_slow)
4. Rushed and Incorrect (fast_incorrect + weak_topic)

**Evaluation Metrics:**
- **Word Count Score:** How close to 15-25 words
- **Tone Score:** Absence of banned phrases
- **Style Score:** Presence of teacher-style markers
- **Overall Score:** Average of above

**Examples:**

Test your fine-tuned model:
```bash
python scripts/test_finetuned_model.py --model clario-teacher-ft
```

Compare base vs fine-tuned:
```bash
python scripts/test_finetuned_model.py \
  --compare llama3.1:8b clario-teacher-ft
```

**Output:**
```
🧪 Fine-Tuned Model Comparison
================================================================================

Test Case 1: Weak on Quantum Numbers
--------------------------------------------------------------------------------
📊 Model: llama3.1:8b
  1. Most incorrect responses were on Quantum Numbers...
     [18 words | Score: 0.87]
  2. You maintained accuracy on Complex Numbers questions...
     [12 words | Score: 0.73]

📊 Model: clario-teacher-ft
  1. Most incorrect responses were associated with Quantum Numbers, suggesting...
     [16 words | Score: 0.93]
  2. You demonstrated strong confidence in Complex Numbers...
     [19 words | Score: 0.97]

📊 Overall Performance Summary
┌─────────────────┬───────────┬─────────┬────────┐
│ Model           │ Avg Score │ Success │ Errors │
├─────────────────┼───────────┼─────────┼────────┤
│ llama3.1:8b     │ 0.812     │ 4/4     │ 0      │
│ clario-teacher  │ 0.947     │ 4/4     │ 0      │
│ templates       │ 0.923     │ 4/4     │ 0      │
└─────────────────┴───────────┴─────────┴────────┘
```

---

## 🔧 Troubleshooting

### "No training data available"

**Cause:** Haven't collected any data yet

**Solution:**
1. Start the analytics API
2. Play some duels
3. Check `training_data/teacher_feedback_v1.jsonl` exists

### "Ollama is not running"

**Cause:** Ollama service not started

**Solution:**
```bash
brew services start ollama
# Or on Linux:
systemctl start ollama
```

### "Out of Memory" during training

**Cause:** GPU doesn't have enough VRAM

**Solutions:**
1. Use 4-bit quantization: `--load-in-4bit`
2. Reduce batch size: `--batch-size 1`
3. Use Google Colab with T4/A100 GPU
4. Use Ollama method instead (no GPU needed)

### Model produces generic output

**Cause:** Insufficient training data or underfitting

**Solutions:**
1. Collect more examples (aim for 200+)
2. Increase epochs: `--epochs 5`
3. Increase learning rate: `--learning-rate 5e-4`

### Model repeats training examples exactly

**Cause:** Overfitting

**Solutions:**
1. Reduce epochs: `--epochs 2`
2. Lower learning rate: `--learning-rate 1e-4`
3. Collect more diverse examples

---

## 📚 Further Reading

- [Full Fine-Tuning Guide](../FINE_TUNING_GUIDE.md)
- [Unsloth Documentation](https://github.com/unslothai/unsloth)
- [Ollama Documentation](https://ollama.ai/docs)
- [LoRA Paper](https://arxiv.org/abs/2106.09685)

---

## 🤝 Contributing

To improve these scripts:

1. Test with your own data
2. Report issues or suggestions
3. Submit pull requests with improvements
4. Share your fine-tuning results

---

## 📄 License

Part of the Clario Analytics Engine.
