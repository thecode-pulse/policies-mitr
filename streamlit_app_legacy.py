import streamlit as st
st.set_page_config(page_title="PolicyMitr", page_icon="📜", layout="wide")

import sqlite3
import hashlib
import re
import time
import random
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from utils.extract import extract_text_from_pdf, extract_text_from_image
from utils.classify import load_classifier
from utils.summarize import load_summarizer, summarize_text, simplify_text
from utils.storage import create_table, insert_policy, fetch_all_policies, delete_policy
from utils.tts import text_to_speech
from utils.translate import translate_to_hindi

# -------------------- DATABASE --------------------
DB_NAME = "policymitr.db"
conn = sqlite3.connect(DB_NAME, check_same_thread=False)
c = conn.cursor()

# -------------------- USER TABLE --------------------
def create_user_table():
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT,
            password TEXT
        )
    """)
    conn.commit()

# -------------------- PASSWORD UTILS --------------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def validate_password(password):
    if len(password) < 6: return False
    if not re.search(r'[A-Za-z]', password): return False
    if not re.search(r'\d', password): return False
    if not re.search(r'[@$!%*?&]', password): return False
    return True

def add_user(username, email, password):
    c.execute("INSERT INTO users (username,email,password) VALUES (?,?,?)",
              (username, email, hash_password(password)))
    conn.commit()

def login_user(username, password):
    c.execute("SELECT * FROM users WHERE username=? AND password=?",
              (username, hash_password(password)))
    return c.fetchone()

def get_user_email(email):
    c.execute("SELECT * FROM users WHERE email=?", (email,))
    return c.fetchone()

def update_password(email, new_pass):
    hashed = hash_password(new_pass)
    c.execute("UPDATE users SET password=? WHERE email=?", (hashed, email))
    conn.commit()

# -------------------- INITIALIZATION --------------------
create_table()
create_user_table()

# -------------------- LOAD OFFLINE MODELS ONCE --------------------
@st.cache_resource
def load_models():
    with st.spinner("🚀 Loading AI models... (This may take a moment)"):
        classifier = load_classifier()
        summarizer = load_summarizer()
        return classifier, summarizer

# -------------------- STYLING --------------------
st.markdown("""
<style>
body {
    background: linear-gradient(to bottom, #e0f7fa, #ffffff);
    font-family: 'Segoe UI', sans-serif;
}
.stButton>button {
    background-color: #009688; color: white; border-radius: 12px;
    padding: 0.8em 0; width:100%; font-weight:bold; transition:all 0.3s ease;
}
.stButton>button:hover { background-color:#FF6F61; transform:scale(1.05); }
.stTextInput>div>input, .stFileUploader>div>div>input {
    border:2px solid #009688 !important; border-radius:8px; padding:8px;
}
h1,h2,h3 { color:#009688; }
.policy-card {
    background-color:#E0F7FA; padding:20px; border-radius:15px; margin:15px auto;
    box-shadow:2px 2px 12px rgba(0,0,0,0.1); transition: transform 0.2s ease;
    width:90%; display:block; text-align:left;
}
.policy-card:hover { transform: scale(1.02); }
.chat-bubble-user {
    background-color:#009688;color:white;padding:12px;border-radius:20px;
    margin:5px;text-align:right;
}
.chat-bubble-bot {
    background-color:#FF6F61;color:white;padding:12px;border-radius:20px;
    margin:5px;text-align:left;
}
</style>
""", unsafe_allow_html=True)

# -------------------- SIDEBAR --------------------
st.sidebar.title("🎉 Quick Navigation")
PAGES = ["🏠 Home", "🔐 Login", "🆕 Signup", "📂 Policy Processor", "📁 My Policies", "🌏 Translator", "🎧 TTS", "🤖 Chatbot"]
for page in PAGES:
    if st.sidebar.button(page, key=f"side_{page}"):
        st.session_state.current_page = page
        st.rerun()

tips = ["📌 Save your policies often!", "🌏 Translate text to Hindi!", "🎧 Listen to summaries!", "💬 Chat with Mitr!"]
st.sidebar.markdown("---")
st.sidebar.info(random.choice(tips))

if "current_page" not in st.session_state:
    st.session_state.current_page = "🏠 Home"

choice = st.session_state.current_page

# -------------------- PAGES --------------------
if choice == "🏠 Home":
    st.image("home.png", use_column_width=True, width=None)
    st.markdown("<h2 style='text-align:center; margin-top:50px;'>⚡ Key Features | प्रमुख विशेषताएँ</h2>", unsafe_allow_html=True)
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("### 📄 Upload Policies\nUpload PDF or images and let AI extract key content.")
        st.markdown("### ✂️ Summarize\nGet concise summaries in simple language.")
    with col2:
        st.markdown("### 🌏 Translate\nTranslate summaries to Hindi automatically.")
        st.markdown("### 🎧 Text-to-Speech\nListen to summaries in English or Hindi.")
    with col3:
        st.markdown("### 🤖 Chatbot\nAsk questions about policies anytime.")
    st.balloons()

elif choice == "🆕 Signup":
    st.subheader("🚀 Create Your Account")
    with st.form("signup_form"):
        username = st.text_input("Choose Username")
        email = st.text_input("Your Email")
        password = st.text_input("Create Password", type="password")
        submitted = st.form_submit_button("Sign Up ✨")
        if submitted:
            if not username or not email or not password:
                st.error("⚠️ Fill in all fields!")
            elif not validate_password(password):
                st.error("⚠️ Password must be ≥6 chars, with letters, numbers & special character.")
            else:
                try:
                    add_user(username, email, password)
                    st.success("🎊 Account created! Redirecting...")
                    st.session_state.current_page = "🔐 Login"
                    st.rerun()
                except sqlite3.IntegrityError:
                    st.error("⚠️ Username already exists!")

elif choice == "🔐 Login":
    st.subheader("🔑 Welcome Back")
    with st.form("login_form"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login 🚪")
        if submitted:
            user = login_user(username, password)
            if user:
                st.session_state["logged_in"] = True
                st.session_state["username"] = username
                st.success(f"Welcome, {username}! 🎉")
                st.session_state.current_page = "📂 Policy Processor"
                st.rerun()
            else:
                st.error("❌ Invalid username or password.")

    st.markdown("---")
    st.markdown("Forgot Password?")
    with st.expander("🔑 Reset Password"):
        email_fp = st.text_input("Enter your registered email:")
        new_pass = st.text_input("New Password:", type="password")
        confirm_pass = st.text_input("Confirm Password:", type="password")
        if st.button("Reset Password"):
            if not email_fp or not new_pass or not confirm_pass:
                st.error("⚠️ Fill all fields!")
            elif new_pass != confirm_pass:
                st.error("⚠️ Passwords do not match!")
            elif not validate_password(new_pass):
                st.error("⚠️ Password must be ≥6 chars, include letters, numbers & special char!")
            elif get_user_email(email_fp):
                update_password(email_fp, new_pass)
                st.success("✅ Password updated! Login now.")
            else:
                st.error("⚠️ Email not registered!")

# -------------------- POLICY PROCESSOR --------------------
elif choice == "📂 Policy Processor":
    if not st.session_state.get("logged_in"):
        st.warning("⚠️ Login first to process policies!")
        st.stop()

    st.subheader("📂 Upload & Process Policy")
    uploaded_file = st.file_uploader("Upload PDF/Image", type=["pdf","png","jpg","jpeg"])

    if uploaded_file:
        progress = st.progress(0)
        status_text = st.empty()

        with st.spinner("🔍 Processing policy..."):
            # Lazy load models only when processing starts
            classifier_model, summarizer_model = load_models()

            # Step 1: Extract
            status_text.text("Step 1/4: Extracting text...")
            text = extract_text_from_pdf(uploaded_file) if uploaded_file.type=="application/pdf" else extract_text_from_image(uploaded_file)
            progress.progress(25)
            time.sleep(0.1)

            if not text or len(text.strip()) < 50:
                st.error("❌ This doesn't seem like a valid policy. Please upload a proper policy document.")
                st.stop()

            # Step 2: Classify
            status_text.text("Step 2/4: Classifying policy...")
            categories = ["Education","Healthcare","Environment","Finance","Technology",
                          "Social Welfare","Agriculture","Employment","Housing","Transport",
                          "Energy","Women Empowerment"]
            prediction = classifier_model(text[:1000], candidate_labels=categories, multi_label=False)
            category = prediction["labels"][0]
            if prediction["scores"][0] < 0.2:
                st.error("❌ This document does not appear to be a valid policy.")
                st.stop()
            progress.progress(50)
            time.sleep(0.5)

            # Step 3: Summarize
            status_text.text("Step 3/4: Summarizing...")
            summary = summarize_text(summarizer_model, text, max_words=150)
            progress.progress(75)
            time.sleep(0.1)

            # Step 4: Simplify + Auto-Translate
            status_text.text("Step 4/4: Simplifying + Translating...")
            simplified = simplify_text(summary)
            hindi_summary = translate_to_hindi(summary)
            progress.progress(100)
            time.sleep(0.5)
            status_text.text("✅ Processing complete!")

        # Only save/display simplified if different
        from difflib import SequenceMatcher
        def is_different(text1, text2, threshold=0.9):
            return SequenceMatcher(None, text1.strip(), text2.strip()).ratio() < threshold

        show_simplified = is_different(summary, simplified)

        # Auto-save with timestamp
        policy_name = f"Policy_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        insert_policy(
            category,
            summary + "\n\n(Hindi)\n" + hindi_summary,
            simplified if show_simplified else None,   # NULL in DB if not different
            policy_name
        )
        st.success(f"✅ Policy auto-saved as '{policy_name}'")

        st.success(f"📌 Detected Category: {category}")
        with st.expander("📝 Summary"):
            st.write(summary)
        with st.expander("🌏 Hindi Summary"):
            st.write(hindi_summary)
        if show_simplified:
            with st.expander("✂️ Simplified"):
                st.write(simplified)

        # TTS Option
        listen_lang = st.radio("🎧 Listen to Summary:", ["English","Hindi"])
        if st.button("Play ▶ TTS"):
            text_to_play = summary if listen_lang == "English" else hindi_summary
            audio = text_to_speech(text_to_play, lang="en" if listen_lang=="English" else "hi")
            if audio:
                st.audio(audio, format="audio/wav")

# -------------------- MY POLICIES --------------------
elif choice == "📁 My Policies":
    if not st.session_state.get("logged_in"):
        st.warning("⚠️ Please login first!")
        st.stop()

    st.subheader("📁 Your Saved Policies")
    policies = fetch_all_policies()

    if policies:
        for pid, category, summary, simplified, policy_name, timestamp in policies:
            st.markdown(f"""
            <div class='policy-card'>
                <h4>📄 {policy_name} | {timestamp}</h4>
                <p><b>Category:</b> {category}</p>
            </div>
            """, unsafe_allow_html=True)

            # Expander list
            with st.expander("📝 Summary"):
                st.write(summary)
            with st.expander("🌏 Hindi Summary"):
                if "(Hindi)" in summary:
                    hindi_part = summary.split("(Hindi)")[-1].strip()
                    st.write(hindi_part)
                else:
                    st.info("No Hindi summary saved.")
            if simplified:
                with st.expander("✂️ Simplified"):
                    st.write(simplified)

            # TTS Controls
            listen_lang = st.radio(f"🎧 Listen:", ["English","Hindi"], key=f"tts_{pid}")
            if st.button(f"Play ▶", key=f"play_{pid}"):
                text_to_play = summary if listen_lang=="English" else translate_to_hindi(summary)
                audio = text_to_speech(text_to_play, lang="en" if listen_lang=="English" else "hi")
                if audio:
                    st.audio(audio, format="audio/wav")

            # Delete button
            if st.button(f"🗑 Delete Policy", key=f"del_{pid}"):
                delete_policy(pid)
                st.success(f"Deleted policy '{policy_name}'")
                st.experimental_rerun()
    else:
        st.info("ℹ️ No saved policies yet!")


# -------------------- TRANSLATOR -------------------- #
elif choice == "🌏 Translator":
    st.subheader("🌏 Offline Translator")
    uploaded_file = st.file_uploader("Upload PDF for Translation", type=["pdf"])
    text_to_translate = st.text_area("Or enter text:", height=150)
    if uploaded_file: text_to_translate = extract_text_from_pdf(uploaded_file)
    if st.button("Translate 🌐") and text_to_translate:
        translated_text = translate_to_hindi(text_to_translate)
        st.text_area("Hindi Translation", translated_text, height=150)

# -------------------- TTS -------------------- #
elif choice == "🎧 TTS":
    st.subheader("🎧 Text-to-Speech")
    uploaded_file = st.file_uploader("Upload PDF for TTS", type=["pdf"])
    text_to_read = st.text_area("Or enter text:", height=150)
    if uploaded_file: text_to_read = extract_text_from_pdf(uploaded_file)
    listen_lang = st.radio("Choose Voice:", ["English","Hindi"])
    if st.button("Play ▶️") and text_to_read:
        audio = text_to_speech(text_to_read, lang="en" if listen_lang=="English" else "hi")
        if audio:
            st.audio(audio, format="audio/wav")

# -------------------- CHATBOT -------------------- #
elif choice == "🤖 Chatbot":
    st.subheader("🤖Mitr -  Your Friendly Policy Chatbot ")
    st.markdown("Hi 👋! I’m *Mitr, your AI-powered assistant. Ask me anything about **this app, its features, or government policies*!")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # -------------------- Gemini API Setup -------------------- #
    import google.generativeai as genai

    # Configure with Gemini API key from .env
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        st.error("⚠️ GEMINI_API_KEY not found in .env! Please configure it.")
        st.stop()
        
    genai.configure(api_key=api_key)

    # Create model
    model = genai.GenerativeModel("gemini-1.5-flash") # Using latest flash model

    # User input
    user_input = st.text_input("💬 Type your question:")

    if st.button("Send") and user_input:
        # Save user message
        st.session_state.chat_history.append(("user", user_input))

        try:
            # Prepare chat history as context
            history_text = "\n".join(
                [f"User: {u}\nBot: {b}" for u, b in zip(
                    [m for r, m in st.session_state.chat_history if r == "user"],
                    [m for r, m in st.session_state.chat_history if r == "bot"] + [""]
                )]
            )

            # Generate response
            prompt = f"""
You are Mitr, a friendly AI chatbot inside the PolicyMitr app. 
Your job is to help users understand how this app works, its features, and provide 
information about government policies in a simple, friendly way.

Here is the chat history so far:
{history_text}

The user just asked: {user_input}

Reply in a helpful, engaging way.
"""

            response = model.generate_content(prompt)
            bot_reply = response.text.strip()

        except Exception as e:
            bot_reply = f"⚠️ Oops! Error: {str(e)}"

        # Save bot message
        st.session_state.chat_history.append(("bot", bot_reply))

    # -------------------- Display Conversation -------------------- #
    for role, msg in st.session_state.chat_history:
        if role == "user":
            st.markdown(f"<div class='chat-bubble user-msg'>{msg}</div>", unsafe_allow_html=True)
        else:
            st.markdown(f"<div class='chat-bubble bot-msg'>{msg}</div>", unsafe_allow_html=True)
# -------------------- FOOTER -------------------- #
st.markdown("---")
st.markdown("<div style='text-align:center; font-size:14px; color:#009688; padding:10px;'>Made as part of Semester Project using Streamlit & AI<br>© 2025 PolicyMitr</div>", unsafe_allow_html=True)