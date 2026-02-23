# utils/tts.py
import asyncio
from io import BytesIO
import pyttsx3  # Offline English TTS
import edge_tts  # Online Hindi TTS
import tempfile
import os

# Default voices
DEFAULT_ENGLISH_VOICE = None  # Use system default in pyttsx3
DEFAULT_HINDI_VOICE = "hi-IN-SwaraNeural"  # Online TTS voice

_engine = None

def get_tts_engine():
    global _engine
    if _engine is None:
        import pyttsx3
        _engine = pyttsx3.init()
        _engine.setProperty('rate', 150)
        _engine.setProperty('volume', 1.0)
    return _engine

def _english_tts_offline(text: str) -> BytesIO:
    """
    Generate English speech offline using pyttsx3 and return as BytesIO (MP3).
    """
    if not text.strip():
        return None
    
    try:
        engine = get_tts_engine()
        # Use a temporary file to save speech
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tf:
            temp_filename = tf.name

        # Save speech to file
        engine.save_to_file(text, temp_filename)
        engine.runAndWait()

        # Read the MP3 into BytesIO
        audio_stream = BytesIO()
        with open(temp_filename, "rb") as f:
            audio_stream.write(f.read())

        audio_stream.seek(0)
        os.remove(temp_filename)
        return audio_stream

    except Exception as e:
        print("Offline English TTS failed:", e)
        return None


async def _hindi_tts_online(text: str) -> BytesIO:
    """
    Generate Hindi speech online using edge-tts and return as BytesIO.
    """
    if not text.strip():
        return None
    
    try:
        communicate = edge_tts.Communicate(text, voice=DEFAULT_HINDI_VOICE)
        audio_stream = BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        audio_stream.seek(0)
        return audio_stream
    except Exception as e:
        print("Online Hindi TTS failed:", e)
        return None


def text_to_speech(text: str, lang: str = "en") -> BytesIO:
    """
    Wrapper function for TTS.
    English -> offline (pyttsx3)
    Hindi -> online (edge-tts)
    """
    if lang == "hi":
        return asyncio.run(_hindi_tts_online(text))
    else:
        return _english_tts_offline(text)
