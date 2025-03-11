"""
file_handler.py
---------------
Ortak dosya yükleme ve metin çıkarma işlemlerini içerir.
PDF, DOCX, TXT gibi farklı dosya formatlarından metin çıkarma fonksiyonları bu modülde yer alır.
"""

import os
from io import BytesIO
from fastapi import UploadFile
from PyPDF2 import PdfReader
import docx

def extract_text_from_pdf(file_stream: BytesIO) -> str:
    text = ""
    reader = PdfReader(file_stream)
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_text_from_docx(file_stream: BytesIO) -> str:
    doc = docx.Document(file_stream)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_txt(file_stream: BytesIO) -> str:
    return file_stream.read().decode('utf-8')

def extract_text(upload_file: UploadFile) -> str:
    ext = os.path.splitext(upload_file.filename)[1].lower()
    content = upload_file.file.read()
    upload_file.file.seek(0)
    if ext == ".pdf":
        return extract_text_from_pdf(BytesIO(content))
    elif ext == ".docx":
        return extract_text_from_docx(BytesIO(content))
    elif ext == ".txt":
        return extract_text_from_txt(BytesIO(content))
    else:
        return ""
