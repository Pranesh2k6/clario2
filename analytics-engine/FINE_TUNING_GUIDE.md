# Clario Teacher Feedback Model — Fine-Tuning Guide

This guide explains how to fine-tune Llama 3.1:8B using the teacher-style feedback data collected from duel results.

## 📊 Overview

The Clario analytics engine automatically logs every NLG generation to `training_data/teacher_feedback_v1.jsonl`. This creates a dataset that maps:

```
Structured Signals → Teacher-Style Feedback Insights
```

After collecting sufficient data (recommended: 100+ examples), you can fine-tune the local Llama 3.1:8B model to better match your desired teaching style.

---

## 🎯 When to Fine-Tune

**Fine-tune when:**
- ✅ You have 100+ training examples (more is better)
- ✅ The LLM-generated feedback doesn't match your preferred tone
- ✅ You want faster, more consistent inference
- ✅ Template fallbacks are being used too often

**Don't fine-tune yet if:**
- ❌ You have fewer than 50 examples (overfitting risk)
- ❌ The current LLM output quality is acceptable
- ❌ You don't have GPU access (training will be very slow)

---

## 📈 Data Collection

### 1. Check Current Data

```bash
cd analytics-engine

# Check how many examples you have
wc -l training_data/teacher_feedback_v1.jsonl

# View sample entries
head -n 3 training_data/teacher_feedback_v1.jsonl | jq
```

### 2. Understand Data Format

Each line in `teacher_feedback_v1.jsonl` contains:

```json
{
  "instruction": "Generate professional teacher-style duel feedback.",
  "input": {
    "weak_topic": "Quantum Numbers",
    "strong_topic": "Complex Numbers",
    "speed_pattern": "fast_incorrect",
    "difficulty_pattern": "easy_fast_medium_slow"
  },
  "output": [
    "Most incorrect responses were associated with Quantum Numbers...",
    "You demonstrated strong confidence in Complex Numbers...",
    "Some responses were submitted very quickly but were incorrect..."
  ],
  "timestamp": "2024-03-09T14:30:00Z"
}
```

### 3. Quality Check

Before fine-tuning, review your data quality:

```bash
# Check for empty outputs
jq 'select(.output | length == 0)' training_data/teacher_feedback_v1.jsonl

# Check word count distribution
jq -r '.output[] | length' training_data/teacher_feedback_v1.jsonl | \
  awk '{sum+=$1; count+=1} END {print "Avg chars:", sum/count}'
```

---

## 🚀 Method 1: Ollama Custom Model (Recommended for Quick Setup)

This method creates a custom Ollama model with an enhanced system prompt. **Note:** This is not true parameter fine-tuning, but it's fast and effective.

### Step 1: Prepare Data

```bash
cd analytics-engine
python scripts/prepare_finetuning_data.py
```

Expected output:
```
✅ Loaded 150 training examples
📊 Training Data Statistics
  Signal distribution:
    - weak_topic: 120 (80.0%)
    - speed_pattern: 145 (96.7%)
    ...
✅ Saved 150 examples to training_data/teacher_feedback_alpaca.jsonl
✅ Saved 150 examples to training_data/teacher_feedback_chat.jsonl
```

### Step 2: Create Custom Model

```bash
python scripts/finetune_ollama.py --model llama3.1:8b --output-name clario-teacher
```

This creates a custom model named `clario-teacher` with your data embedded in the system prompt.

### Step 3: Update Configuration

Edit `analytics/config.py`:

```python
OLLAMA_MODEL = "clario-teacher"  # Changed from "llama3.1:8b"
```

### Step 4: Test

```bash
# Restart analytics API
python -m analytics.api

# In another terminal, test an endpoint
curl "http://localhost:8000/api/v1/analytics/insights/USER_ID?context=duel_result"
```

---

## 🔥 Method 2: True Parameter Fine-Tuning with Unsloth

This method performs actual gradient-based fine-tuning of model parameters. Requires GPU.

### Requirements

- **Hardware:** GPU with 16GB+ VRAM (or use Google Colab with T4/A100)
- **Software:** Python 3.10+, CUDA 11.8+

### Step 1: Install Dependencies

```bash
cd analytics-engine

# Install Unsloth and dependencies
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install xformers trl peft accelerate bitsandbytes
```

### Step 2: Prepare Data

```bash
python scripts/prepare_finetuning_data.py
```

### Step 3: Fine-Tune

**Option A: Local GPU (16GB+ VRAM)**

```bash
python scripts/finetune_unsloth.py \
  --epochs 3 \
  --batch-size 4 \
  --save-gguf
```

**Option B: Limited GPU (8-12GB VRAM)**

```bash
python scripts/finetune_unsloth.py \
  --epochs 3 \
  --batch-size 2 \
  --load-in-4bit \
  --save-gguf
```

**Option C: Google Colab (Free T4 GPU)**

1. Upload `finetune_unsloth.py` to Colab
2. Upload your training data JSONL
3. Run with Colab's GPU runtime

### Step 4: Deploy to Ollama

After training completes:

```bash
# Load the GGUF model into Ollama
ollama create clario-teacher-ft \
  -f models/clario-teacher-ft/clario-teacher-q4_k_m.gguf

# Test it
ollama run clario-teacher-ft "Your signals: ..."
```

### Step 5: Update Configuration

Edit `analytics/config.py`:

```python
OLLAMA_MODEL = "clario-teacher-ft"
```

---

## 📊 Monitoring Quality

### 1. Compare Outputs

Before and after fine-tuning, test with the same signals:

```bash
# Save a test case
cat > test_signals.json <<EOF
{
  "weak_topic": "Quantum Numbers",
  "strong_topic": "Complex Numbers",
  "speed_pattern": "fast_incorrect",
  "difficulty_pattern": "easy_fast_medium_slow"
}
EOF

# Test base model
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Generate teacher feedback for: '$(cat test_signals.json)'"
}'

# Test fine-tuned model
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "clario-teacher-ft",
  "prompt": "Generate teacher feedback for: '$(cat test_signals.json)'"
}'
```

### 2. Evaluate Metrics

Track these quality indicators:

- **Word count consistency:** 15-25 words per insight
- **Template adherence:** Does it use professional tone?
- **Specificity:** Does it reference topic names?
- **Avoidance of banned phrases:** "Accuracy dropped", "Keep practicing", etc.

### 3. A/B Testing

Run production with both models for 1 week and compare:

```python
# In nlg_formatter.py, randomly select model
import random

def format_duel_insights(signals):
    model = random.choice(["llama3.1:8b", "clario-teacher-ft"])
    # ... use selected model
```

Log which model was used, then analyze user feedback or engagement metrics.

---

## 🔧 Hyperparameter Tuning

If the initial fine-tuning doesn't produce good results, adjust:

### Learning Rate

```bash
# Default: 2e-4
python scripts/finetune_unsloth.py --learning-rate 1e-4  # More conservative
python scripts/finetune_unsloth.py --learning-rate 5e-4  # More aggressive
```

### Epochs

```bash
# Default: 3
python scripts/finetune_unsloth.py --epochs 5   # Risk: overfitting
python scripts/finetune_unsloth.py --epochs 2   # Risk: underfitting
```

### LoRA Rank

```bash
# Default: 16
python scripts/finetune_unsloth.py --lora-rank 32  # More capacity
python scripts/finetune_unsloth.py --lora-rank 8   # Faster, less memory
```

### Batch Size

```bash
# Default: 2
python scripts/finetune_unsloth.py --batch-size 4   # Faster if GPU allows
python scripts/finetune_unsloth.py --batch-size 1   # Minimal memory
```

---

## 🐛 Troubleshooting

### Issue: "Out of Memory" Error

**Solution 1:** Use 4-bit quantization
```bash
python scripts/finetune_unsloth.py --load-in-4bit
```

**Solution 2:** Reduce batch size
```bash
python scripts/finetune_unsloth.py --batch-size 1
```

**Solution 3:** Use Google Colab with A100 GPU

### Issue: Model Outputs Generic Text

**Cause:** Not enough training data or too low learning rate

**Solution:**
1. Collect more examples (aim for 200+)
2. Increase learning rate: `--learning-rate 5e-4`
3. Train for more epochs: `--epochs 5`

### Issue: Model Repeats Templates Exactly

**Cause:** Overfitting (too many epochs on small dataset)

**Solution:**
1. Reduce epochs: `--epochs 2`
2. Add more diverse examples
3. Lower learning rate: `--learning-rate 1e-4`

### Issue: CUDA Not Available

**Solution:** Use Google Colab:

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Runtime → Change runtime type → GPU → T4 or A100
3. Upload your training script and data
4. Install dependencies in first cell:
   ```python
   !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   !pip install xformers trl peft accelerate bitsandbytes
   ```

---

## 📚 Best Practices

### 1. **Start with Ollama Method First**
   - Quick setup, no GPU needed
   - Good baseline to see if fine-tuning is even necessary
   - If Ollama custom model works well, save time and resources

### 2. **Collect Diverse Examples**
   - Don't just run duels with one subject
   - Test with different signal patterns
   - Include edge cases (no weak topic, all perfect, etc.)

### 3. **Version Your Models**
   ```bash
   ollama create clario-teacher-v1 ...
   ollama create clario-teacher-v2 ...
   ```

### 4. **Keep Templates as Fallback**
   Even after fine-tuning, keep the template fallback logic in `nlg_formatter.py`. This ensures consistent output if:
   - The fine-tuned model is slow
   - Ollama is down
   - The LLM produces bad output

### 5. **Continuous Improvement**
   - Retrain every 500 new examples
   - Monitor quality metrics over time
   - Keep old model versions for rollback

---

## 🎓 Advanced: Custom Training Pipeline

For complete control, create your own training script:

```python
from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer

# Load your custom data loader
def load_custom_data():
    # Your preprocessing logic
    pass

# Define custom loss function
def custom_loss(outputs, labels):
    # Penalize outputs that don't match teacher style
    pass

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    compute_loss=custom_loss,
)
trainer.train()
```

---

## 📞 Support

If you encounter issues:

1. Check Ollama logs: `ollama logs`
2. Check analytics API logs
3. Verify GPU with: `nvidia-smi`
4. Test with minimal example first

---

## 📄 License

This fine-tuning guide is part of the Clario Analytics Engine.
Llama 3.1 is licensed by Meta under the Llama 3.1 Community License.
