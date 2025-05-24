from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch
import os
from serpapi import GoogleSearch
import openai
from dotenv import load_dotenv
import re
import json
import hashlib
import logging
from pathlib import Path
import io
import openai
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Constants
MAX_PRODUCTS = 12
CACHE_FILE = Path("blip_caption_cache.json")

# Load BLIP model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)

# Load cache
if CACHE_FILE.exists():
    caption_cache = json.loads(CACHE_FILE.read_text())
else:
    caption_cache = {}

def hash_image(image_bytes):
    return hashlib.md5(image_bytes).hexdigest()

def get_fashion_caption(image_bytes):
    img_hash = hash_image(image_bytes)
    if img_hash in caption_cache:
        logging.info("Using cached caption.")
        return caption_cache[img_hash]

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = blip_processor(images=image, return_tensors="pt").to(device)
    out = blip_model.generate(**inputs, max_new_tokens=50)
    caption = blip_processor.decode(out[0], skip_special_tokens=True)
    caption_cache[img_hash] = caption
    CACHE_FILE.write_text(json.dumps(caption_cache))
    logging.info(f"Generated caption: {caption}")
    return caption

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    try:
        image_bytes = request.files['image'].read()
        caption = get_fashion_caption(image_bytes)

        # Get optional filters from form data (for Preferences)
        filters = request.form.get('filters')
        if filters:
            filters = json.loads(filters)
        else:
            filters = {}

        # Build query using filters + caption
        query = " ".join(str(value) for value in filters.values()) + " " + caption

        # Build product search payload
        product_payload = {
            "query": query,
            "filters": filters
        }

        # Call product search inline
        with app.test_request_context():
            product_request = app.test_client().post("/get-products", json=product_payload)
            product_data = product_request.get_json()

        return jsonify({
            'description': caption,
            'message': f"I found this description: '{caption}'. Based on your preferences, here are some results.",
            'products': product_data.get("products", []),
            'appliedFilters': filters
        })

    except Exception as e:
        logging.error("Image processing error:", exc_info=True)
        return jsonify({'error': 'Failed to process image. Please try another image.'}), 500

@app.route("/get-products", methods=["POST"])
def get_products():
    data = request.get_json()
    query = data.get('query', '').strip()
    filters = data.get('filters', {})

    if not query:
        return jsonify({"error": "Please provide a search query"}), 400

    params = {
        "engine": "google_shopping",
        "q": query,
        "api_key": os.getenv("SERPAPI_KEY"),
        "num": MAX_PRODUCTS,
        "gl": "in",
        "hl": "en"
    }

    if 'maxPrice' in filters:
        try:
            params["price_to"] = int(float(filters['maxPrice']))
        except (ValueError, TypeError):
            logging.warning("Invalid price filter")

    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        shopping_results = results.get("shopping_results", [])[:MAX_PRODUCTS]

        products = []
        for item in shopping_results:
            product_link = item.get("offers", {}).get("link", item.get("link", "#"))
            products.append({
                "title": item.get("title", "Product"),
                "link": product_link,
                "image": item.get("thumbnail", ""),
                "price": item.get("price", "Price not available"),
                "source": item.get("source", ""),
                "merchant": item.get("merchant", "")
            })

        return jsonify({"products": products})

    except Exception as e:
        logging.error("Product search error:", exc_info=True)
        return jsonify({"error": "Failed to fetch products"}), 500
def generate_prompt(user_message, current_caption):
    return f"The user is shopping for a fashion item. The current item is described as: \"{current_caption}\".\n" \
           f"The user says: \"{user_message}\".\n" \
           f"Update or refine the search filters (e.g. color, style, brand, price, category) based on the user's message."
SYSTEM_INSTRUCTIONS = "You are a helpful shopping assistant who helps users refine product searches based on their input. Your goal is to interpret user messages and update search filters like color, category, price, style, or brand."

def parse_filters_from_response(response_text):
    filters = {}

    # Extract color
    color_match = re.search(r'color\s*[:=]?\s*([a-zA-Z]+)', response_text, re.IGNORECASE)
    if color_match:
        filters['color'] = color_match.group(1).lower()

    # Extract style
    style_match = re.search(r'style\s*[:=]?\s*([a-zA-Z ]+)', response_text, re.IGNORECASE)
    if style_match:
        filters['style'] = style_match.group(1).strip().lower()

    # Extract brand
    brand_match = re.search(r'brand\s*[:=]?\s*([a-zA-Z0-9 ]+)', response_text, re.IGNORECASE)
    if brand_match:
        filters['brand'] = brand_match.group(1).strip()

    # Extract max price
    price_match = re.search(r'(?:max\s*)?price\s*[:=]?\s*\$?(\d+)', response_text, re.IGNORECASE)
    if price_match:
        filters['maxPrice'] = price_match.group(1)

    return filters

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        filters = data.get('filters', {})
        current_caption = data.get('current_caption', '')

        prompt = generate_prompt(user_message, current_caption)

        headers = {
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": SYSTEM_INSTRUCTIONS},
                {"role": "user", "content": prompt}
            ]
        }

        # Send message to OpenRouter (chat model)
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()

        response_text = response_data["choices"][0]["message"]["content"]
        updated_filters = parse_filters_from_response(response_text)
        # New logic to get products based on updated filters + caption
        query = " ".join(updated_filters.values())+ " " + current_caption
        product_payload = {
            "query": query,
            "filters": updated_filters
        }

        # Reuse the /get-products logic
        with app.test_request_context():
            product_request = app.test_client().post("/get-products", json=product_payload)
            product_data = product_request.get_json()
        # Combine filters from previous + new ones
        combined_filters = {**filters, **updated_filters}
        search_query = current_caption or "fashion clothing"

        # Call product search inline
        params = {
            "engine": "google_shopping",
            "q": search_query,
            "api_key": os.getenv("SERPAPI_KEY"),
            "num": MAX_PRODUCTS,
            "gl": "in",
            "hl": "en"
        }

        if 'maxPrice' in combined_filters:
            try:
                params["price_to"] = int(float(combined_filters['maxPrice']))
            except (ValueError, TypeError):
                logging.warning("Invalid price filter")

        search = GoogleSearch(params)
        results = search.get_dict()
        shopping_results = results.get("shopping_results", [])[:MAX_PRODUCTS]

        products = []
        for item in shopping_results:
            product_link = item.get("offers", {}).get("link", item.get("link", "#"))
            products.append({
                "title": item.get("title", "Product"),
                "link": product_link,
                "image": item.get("thumbnail", ""),
                "price": item.get("price", "Price not available"),
                "source": item.get("source", ""),
                "merchant": item.get("merchant", "")
            })

        return jsonify({
            "response": response_text,
            "filters": updated_filters,
            "products": product_data.get("products", []),
            "new_caption": current_caption
        })

    except Exception as e:
        logging.error("Error in /chat route:", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=bool(os.getenv("FLASK_DEBUG", False)))