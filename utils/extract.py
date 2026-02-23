import fitz  # PyMuPDF
import pytesseract
from PIL import Image

def extract_text_from_pdf(file):
    """Extracts text from a PDF file using PyMuPDF."""
    try:
        pdf_document = fitz.open(stream=file.read(), filetype="pdf")
        text = "".join([page.get_text() for page in pdf_document])
        return text.strip() if text.strip() else None
    except Exception:
        return None

def extract_text_from_image(file):
    """Extracts text from an image using Tesseract OCR."""
    try:
        image = Image.open(file)
        text = pytesseract.image_to_string(image)
        return text.strip() if text.strip() else None
    except Exception:
        return None
