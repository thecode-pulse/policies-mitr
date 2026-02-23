from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "facebook/bart-large-cnn"
save_dir = "./models/bart-summarizer"

print("⏳ Downloading model, this may take a while...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

print("💾 Saving model locally...")
tokenizer.save_pretrained(save_dir)
model.save_pretrained(save_dir)

print(f"✅ Model saved at {save_dir}")

from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "facebook/bart-large-mnli"
save_dir = "./models/classifier"

print("⏳ Downloading classifier...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

print("💾 Saving classifier locally...")
tokenizer.save_pretrained(save_dir)
model.save_pretrained(save_dir)

print(f"✅ Classifier saved at {save_dir}")
