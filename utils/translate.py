# utils/translate.py
import os
import argostranslate.package
import argostranslate.translate

# ------------------- HINDI (offline Argos Translate) ------------------- #
HINDI_MODEL_PATH = "./assets/models/translate-en_hi-1_1.argosmodel"

import streamlit as st

@st.cache_resource
def get_hindi_translator():
    if not os.path.exists(HINDI_MODEL_PATH):
        raise FileNotFoundError(f"Hindi model not found at {HINDI_MODEL_PATH}")
    argostranslate.package.install_from_path(HINDI_MODEL_PATH)
    installed_languages = argostranslate.translate.get_installed_languages()
    en_lang = next(lang for lang in installed_languages if lang.code == "en")
    hi_lang = next(lang for lang in installed_languages if lang.code == "hi")
    return en_lang.get_translation(hi_lang)

def translate_to_hindi(text: str) -> str:
    try:
        translator = get_hindi_translator()
        return translator.translate(text)
    except Exception as e:
        return f"Translation failed (Hindi): {e}"
