"""
PDF and Image text extraction service.
Ported from the original utils/extract.py with enhancements.
"""
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from io import BytesIO
from typing import Optional


def extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """Extract text from PDF bytes using PyMuPDF."""
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in pdf_document:
            text += page.get_text()
        pdf_document.close()
        return text.strip() if text.strip() else None
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return None


def extract_text_from_image(file_bytes: bytes) -> Optional[str]:
    """Extract text from image bytes using Tesseract OCR."""
    try:
        image = Image.open(BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip() if text.strip() else None
    except Exception as e:
        print(f"Image OCR error: {e}")
        return None


def extract_text(file_bytes: bytes, content_type: str) -> Optional[str]:
    """
    Unified text extraction based on content type.
    """
    if "pdf" in content_type:
        return extract_text_from_pdf(file_bytes)
    elif any(ext in content_type for ext in ["png", "jpg", "jpeg", "image"]):
        return extract_text_from_image(file_bytes)
    return None
