from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

# Load model and processor
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Fashion-related descriptors
labels = [
    "a red dress", "a denim jacket", "a leather jacket", "a floral shirt",
    "a white t-shirt", "a black hoodie", "a blue jeans", "a striped sweater",
    "a formal suit", "a summer top", "a casual outfit", "a woolen coat"
]

def extract_features(image_file):
    image = Image.open(image_file).convert("RGB")
    inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
    outputs = model(**inputs)

    probs = outputs.logits_per_image.softmax(dim=1).detach().numpy().flatten()
    top_labels = sorted(zip(labels, probs), key=lambda x: -x[1])[:5]

    return [{"label": lbl, "confidence": round(float(score), 3)} for lbl, score in top_labels]