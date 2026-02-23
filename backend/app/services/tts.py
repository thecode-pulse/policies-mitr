"""
TTS Service - Text-to-Speech using Edge TTS.
"""
import asyncio
from io import BytesIO
import edge_tts

VOICES = {
    "en": "en-US-AriaNeural",
    "hi": "hi-IN-SwaraNeural",
    "mr": "mr-IN-AarohiNeural",
    "ta": "ta-IN-PallaviNeural",
    "bn": "bn-IN-TanishaaNeural",
    "gu": "gu-IN-DhwaniNeural",
}


async def generate_speech(text: str, language: str = "en") -> BytesIO:
    """Generate TTS audio and return as BytesIO stream."""
    voice = VOICES.get(language, VOICES["en"])
    communicate = edge_tts.Communicate(text, voice=voice)
    audio_stream = BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    audio_stream.seek(0)
    return audio_stream
