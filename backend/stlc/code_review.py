import os
import logging
import time
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from ollama import chat
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Remove this line as it causes circular import
# from stlc.code_review import run_step as run_code_review

app = FastAPI()
logger = logging.getLogger("code_review")
logging.basicConfig(level=logging.INFO)

# LLM için token limiti ve chunk ayarları (backend.py ile uyumlu)
LLM_TOKEN_LIMIT = 4096
BASE_CHUNK_SIZE = 1000
MIN_CHUNK_SIZE = 500

def count_tokens(text: str) -> int:
    """
    Basit token sayımı (kelime sayısına dayalı).
    """
    return len(text.split())

def determine_chunk_size(text: str, base_size=BASE_CHUNK_SIZE, min_size=MIN_CHUNK_SIZE) -> int:
    """
    Metnin token sayısına göre dinamik chunk boyutu belirler.
    Eğer metin LLM_TOKEN_LIMIT’i aşıyorsa, chunk boyutu azaltılır.
    """
    tokens = count_tokens(text)
    if tokens > LLM_TOKEN_LIMIT:
        factor = tokens / LLM_TOKEN_LIMIT
        new_size = max(int(base_size / factor), min_size)
        logger.info(f"Adjusting chunk size: base {base_size} -> {new_size} (token count: {tokens})")
        return new_size
    return base_size

def sanitize_text(text: str) -> str:
    """
    Metindeki gereksiz boşluk ve satır sonlarını temizler.
    """
    return " ".join(text.split())

async def review_chunk(file_name: str, chunk: str, chunk_index: int, total_chunks: int) -> str:
    """
    Verilen kod parçası (chunk) için detaylı kod incelemesi talep eder.
    """
    prompt = (
        f"Please perform a detailed code review of the following code snippet from file '{file_name}' "
        f"(chunk {chunk_index+1} of {total_chunks}).\n"
        "Focus on:\n"
        "1. Potential bugs\n"
        "2. Code improvements\n"
        "3. Best practices\n"
        "4. Security concerns\n"
        "Provide structured feedback with suggestions for improvement.\n\n"
        f"Code:\n{chunk}"
    )
    try:
        response = chat(
            model="llama3.2",
            messages=[{"role": "user", "content": prompt}]
        )
        # Beklenen cevap sözlüğün içinde yer alıyor
        return response['message']['content']
    except Exception as e:
        logger.error(f"Error during review API call for {file_name} chunk {chunk_index+1}: {e}")
        raise HTTPException(status_code=500, detail=f"Error during review API call for {file_name}")

@app.post("/api/processes/code_review/run")  # Changed underscore to hyphen
async def process_code_review(files: list[UploadFile] = File(...)):
    """
    Birden fazla dosya yüklenebilen kod incelemesi endpoint’i.
    Her dosya için:
    - Dosya içeriği UTF-8 olarak okunur,
    - sanitize edilir,
    - RecursiveCharacterTextSplitter kullanılarak dinamik olarak parçalara ayrılır,
    - Her parça için Ollama chat API çağrısı yapılır,
    - Tüm chunk’lerin sonuçları dosya bazında birleştirilir ve yapılandırılmış olarak döndürülür.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Hiçbir dosya yüklenmedi.")

    all_reviews = []
    for file in files:
        try:
            contents = await file.read()
            code_content = contents.decode("utf-8")
        except Exception as e:
            logger.error(f"Error reading file {file.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Error reading file {file.filename}: {e}")
        
        code_content = sanitize_text(code_content)
        if not code_content.strip():
            logger.warning(f"No valid content found in {file.filename}")
            continue

        # Dinamik chunk boyutu belirleme ve chunking işlemi
        chunk_size = determine_chunk_size(code_content)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=100)
        chunks = text_splitter.split_text(code_content)
        total_chunks = len(chunks)
        logger.info(f"File {file.filename} split into {total_chunks} chunks (chunk size: {chunk_size}).")

        file_reviews = []
        for idx, chunk in enumerate(chunks):
            review = await review_chunk(file.filename, chunk, idx, total_chunks)
            file_reviews.append(f"Chunk {idx+1}/{total_chunks} Review:\n{review}")

        all_reviews.append({
            "file_name": os.path.basename(file.filename),
            "reviews": "\n\n".join(file_reviews)
        })

    if not all_reviews:
        raise HTTPException(status_code=400, detail="Hiçbir geçerli kod içeriği incelenemedi.")

    return JSONResponse(content={"status": "success", "code_reviews": all_reviews})

async def run_step(data: dict) -> dict:
    """
    Execute code review process for given files
    """
    try:
        if not data.get("files"):
            raise HTTPException(status_code=400, detail="No files provided")

        review_results = []
        
        for file_path in data["files"]:
            logger.info(f"Processing file: {file_path}")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    code_content = f.read()

                prompt = (
                    "Please perform a detailed code review of the following code. "
                    "Focus on:\n"
                    "1. Potential bugs\n"
                    "2. Code improvements\n"
                    "3. Best practices\n"
                    "4. Security concerns\n\n"
                    f"Code to review:\n{code_content}"
                )

                response = chat(
                    model="llama3.2",
                    messages=[{"role": "user", "content": prompt}]
                )

                review_results.append({
                    "file_name": os.path.basename(file_path),
                    "review": response['message']['content']
                })
                
                logger.info(f"Completed review for: {file_path}")

            except Exception as e:
                logger.error(f"Error processing file {file_path}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing file {os.path.basename(file_path)}: {str(e)}")

        return {
            "status": "success",
            "reviews": review_results
        }

    except Exception as e:
        logger.error(f"Code review failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("code_review:app", host="127.0.0.1", port=8000, reload=True)
