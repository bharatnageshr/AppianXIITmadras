
# 🛍️ StyleFinder: AI-Powered Personal Shopping Assistant

**Finale Submission - IIT-M AI Hackathon 2025**  
**Theme**: *AI-Powered E-Commerce*

---

## 🚀 Overview

**StyleFinder** is a multimodal AI-based shopping assistant designed to elevate the e-commerce experience. Users can upload an image of any product or style they like, and the assistant will intelligently recommend similar and complementary products by analyzing the image, catalog data, and user preferences.

---

## 🔧 Key Features

- 📸 **Image-Based Input**  
  Upload an image to discover similar or complementary items.

- 🧠 **Visual Understanding with CLIP**  
  Converts the uploaded image into an embedding and combines it with user preferences to find the closest matching description in the catalog.

- 🔍 **Smart Recommendations via SerpAPI**  
  The inferred product description is sent to SerpAPI to retrieve real-world, relevant product results.
- 🛒 **Add to Cart**
  Users can add one or more recommended items to a shopping cart.
  
- 💳 **Checkout with Stripe**
  Seamless checkout process simulated or enabled via Stripe's API.

- 🤖 **Integrated Chatbot**  
  A chatbot helps users interactively refine their searches and understand the results.

- 🎨 **Preference-Aware Personalization**  
  User preferences (from a dedicated tab) are embedded into the recommendation pipeline for better accuracy.

---

## 🧱 System Architecture
mermaid
graph TD
A[User Uploads Image] --> B[CLIP Embedding<br>Generation]
A2[User Preferences] --> B
B --> C[Similarity Matching<br>with Product Catalog]
C --> D[Most Relevant<br>Catalog Description]
D --> E[Fetch Results via<br>SerpAPI]
E --> F[Recommendation Display<br>on Frontend]
F --> G[Chatbot for Interaction<br>& Refinement]
G --> H[Add to Cart<br>+ Checkout via Stripe]


---

## 🤖 AI & Tools Used

| Component              | Tool/Model Used             |
|-----------------------|-----------------------------|
| Vision Embedding      | OpenAI CLIP                 |
| Preferences Integration | Vector-weighted relevance   |
| Description Search    | Similarity search on catalog |
| Web Search API        | SerpAPI                     |
| Chatbot               | GPT API  |
| Backend               | Flask (Python)              |
| Frontend              | React.js                    |
| Data Storage          | JSON (catalog), Numpy       |
| Checkout              | Stripe                      |
---

## ⚙️ Setup Instructions

### 🔩 Backend Setup

```bash
git clone https://github.com/yourusername/shop-smarter.git
cd shop-smarter/backend

# Set up Python environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Add your .env variables (including SerpAPI key)
cp .env.example .env
```

### ▶️ Run Backend

```bash
python app.py
```

Accessible at: `http://localhost:5001`

---

### 🌐 Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

Accessible at: `http://localhost:3000`

---

## 💡 How It Works

1. **Upload** an image from the homepage.
2. The **backend** computes a **CLIP embedding** for the image and combines it with user preferences.
3. The system finds the **most similar item** in the catalog using cosine similarity.
4. The **catalog description** of that item is sent to **SerpAPI**, which returns real-world product matches.
5. A **chatbot** allows users to ask for further suggestions, clarifications, or refinements.
6. The **frontend displays** the results in a clean, intuitive UI.
7. Fetches **similar** and **complementary** products.
8. The user can add items to the **cart**.
9. **Stripe** checkout handles the payment flow.


---

## 🧪 Example Use Cases

- 👗 Upload a dress photo → Get similar dresses and fashion accessories.
- 🏠 Upload living room image → Get lamps, pillows, and matching decor.
- 👟 Upload sneakers → See alternatives and matching athletic gear.
- 💬 Ask chatbot: “Show cheaper alternatives” or “Match this with socks.”

---

## 📂 Project Structure

```
├── backend/
│   ├── app.py
│   ├── recommender/
│   ├── data/
│   │   ├── catalog.json
│   │   ├── embeddings.npy
│   ├── model_utils.py
│   └── build_catalog.py
├── frontend/
│   ├── src/
│   ├── public/
│   └── App.js, Preferences.js, Chatbot.js
└── README.md
```

---

## 🌟 Highlights

- ✅ **Multimodal AI system** (image + preferences)
- ✅ **Live product discovery** with SerpAPI
- ✅ **Chatbot integration** for query handling
- ✅ **Frontend/Backend separation** with easy setup
- ✅ **Complementary products and Personalized products at 
---

## 📽️ Demo Video

📎 [To be added]


---

## 🧑‍💻 Team

- Reddi Srujan
- Bharat Nagesh

---

## 📜 License

MIT License
