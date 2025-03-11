"""
text_splitter.py
----------------
Metinleri parçalara ayırma (chunking) işlemlerini içerir.
Büyük dokümanların LLM için daha verimli hale getirilmesi amacıyla kullanılır.
"""

def split_text_into_chunks(text: str, chunk_size: int = 1000, overlap: int = 100):
    # Örnek bir basit mantık
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks
