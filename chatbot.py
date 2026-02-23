"""
Offline Policy Chatbot - Simple Streamlit app
This version provides a basic offline chatbot for policy documents with concise, combined answers using a lightweight rule-based simplifier and chat history.
"""

import streamlit as st
import pdfplumber
import docx2txt
from io import BytesIO
import tempfile
import os
import re
import torch
from typing import List
from sentence_transformers import SentenceTransformer
import chromadb
from utils.gpu_config import get_device

# -------------------- Utilities --------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                text_parts.append(txt)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        tmp_path = tmp.name
    text = docx2txt.process(tmp_path)
    try:
        os.remove(tmp_path)
    except Exception:
        pass
    return text or ""


def clean_text(s: str) -> str:
    s = re.sub(r"\n{2,}", "\n\n", s)
    return s.strip()


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i+chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks

# Simple rule-based simplifier + shortener
def simplify_text(text: str) -> str:
    replacements = {
        "pursuant to": "under",
        "in accordance with": "as per",
        "commence": "start",
        "terminate": "end",
        "utilize": "use",
        "notwithstanding": "despite",
        "endeavour": "try",
        "furnish": "provide",
        "procure": "get",
    }
    simplified = text
    for k, v in replacements.items():
        simplified = re.sub(rf"\b{k}\b", v, simplified, flags=re.IGNORECASE)
    return simplified

# Combine multiple chunks into a short summary
def combine_and_simplify(chunks: List[str]) -> str:
    if not chunks:
        return ""
    simplified_parts = [simplify_text(c) for c in chunks]
    combined = " ".join(simplified_parts)
    # Keep only the first 3–4 sentences for brevity
    sentences = re.split(r"(?<=[.!?]) +", combined)
    return " ".join(sentences[:4])

# -------------------- Streamlit GUI --------------------
st.set_page_config(page_title="Offline Policy Chatbot", layout="wide")
st.title("📚 Offline Policy Chatbot")

# Sidebar: Settings
with st.sidebar:
    st.header("Settings")
    embedding_model_name = st.text_input("Embedding model", value="all-MiniLM-L6-v2")
    st.caption("This chatbot works fully offline. Make sure to download models beforehand.")

# Load embedding model
@st.cache_resource(show_spinner=False)
def load_embedding_model(model_name: str):
    device = get_device()
    model = SentenceTransformer(model_name)
    model.to(device)
    return model

embedder = load_embedding_model(embedding_model_name)

# Init Chroma DB
@st.cache_resource(show_spinner=False)
def init_chroma():
    return chromadb.PersistentClient(path="./chroma_db")

client = init_chroma()
try:
    collection = client.get_collection("policies")
except:
    collection = client.create_collection("policies")

# Initialize chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Upload files
st.subheader("1) Upload policy documents")
uploaded_files = st.file_uploader("Upload PDFs or DOCX files", accept_multiple_files=True, type=["pdf","docx"])

if uploaded_files:
    if st.button("Process Documents"):
        added = 0
        for uf in uploaded_files:
            raw_bytes = uf.read()
            if uf.type == "application/pdf" or uf.name.lower().endswith(".pdf"):
                text = extract_text_from_pdf(raw_bytes)
            else:
                text = extract_text_from_docx(raw_bytes)
            text = clean_text(text)
            if not text:
                st.warning(f"No text extracted from {uf.name}")
                continue
            chunks = chunk_text(text)
            embeddings = embedder.encode(chunks, convert_to_numpy=True).tolist()
            ids = [f"{uf.name}_{i}" for i in range(len(chunks))]
            metadatas = [{"source": uf.name, "chunk": i} for i in range(len(chunks))]
            collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)
            added += len(chunks)
        st.success(f"Indexed {added} text chunks.")

# Chat area
st.subheader("2) Ask a question")
query = st.text_input("Enter your question")

if st.button("Ask") and query.strip():
    q_emb = embedder.encode([query], convert_to_numpy=True).tolist()[0]
    results = collection.query(query_embeddings=[q_emb], n_results=3, include=["documents","metadatas"])

    if results and results.get("documents"):
        docs = results["documents"][0]
        summary = combine_and_simplify(docs)
        if summary:
            st.session_state.chat_history.append((query, summary))
        else:
            st.session_state.chat_history.append((query, "No simplified response available."))
    else:
        st.session_state.chat_history.append((query, "No relevant information found."))

# Display chat history
if st.session_state.chat_history:
    st.markdown("### 💬 Chat History")
    for i, (q, a) in enumerate(st.session_state.chat_history):
        st.markdown(f"**You:** {q}")
        st.markdown(f"**Bot:** {a}")
        st.markdown("---")

# Sidebar DB info
st.sidebar.subheader("DB Info")
st.sidebar.write(f"Indexed chunks: {collection.count()}")

st.markdown("---")
st.caption("⚠️ Simple offline chatbot using embeddings + retrieval + combined rule-based simplification with chat history. No internet required.")
