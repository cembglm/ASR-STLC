""" 
app.py
------
FastAPI uygulamasının ana giriş noktası. Burada FastAPI instance'ı tanımlanır, 
STLC adımlarına ait router'lar eklenir ve uygulama başlatılır.
"""

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import logging
from io import BytesIO
from fastapi.responses import JSONResponse

# Import process handlers
from stlc.code_review import run_step as run_code_review
from stlc.requirement_analysis import run_step as run_requirement_analysis

# Set up logging
logger = logging.getLogger("app")
logging.basicConfig(level=logging.INFO)

# Define process handlers dictionary
PROCESS_HANDLERS = {
    'code-review': run_code_review,
    'requirement-analysis': run_requirement_analysis
}

app = FastAPI(
    title="STLC Manager Backend",
    description="STLC Manager Backend API",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "STLC Manager Backend is running!"}

@app.post("/api/processes/code_review/run")
async def process_code_review(files: List[UploadFile] = File(...)):
    try:
        file_paths = []
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            file_paths.append(file_path)

        result = await run_code_review({"files": file_paths})

        # Cleanup temporary files
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Güncellenmiş endpoint - Requirement Analysis
@app.post("/api/processes/requirement_analysis/run")
async def process_requirement_analysis(files: List[UploadFile] = File(...)):
    logger.info("Requirement Analysis API ile bağlantı kuruldu")
    
    try:
        file_paths = []
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            file_paths.append(file_path)
            logger.info(f"Dosya kaydedildi: {file_path}")

        logger.info("Requirement Analysis işlemi başlatılıyor...")
        result = await run_requirement_analysis({"files": file_paths})

        # Cleanup temporary files
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)

        # run_step'in döndüğü cevabı olduğu gibi dön
        return result

    except Exception as e:
        logger.error(f"Requirement Analysis hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
       
@app.post("/api/processes/{process_type}/run")
async def run_process(process_type: str, files: List[UploadFile] = File(...)):
    logger.info(f"Received request for process: {process_type}")
    
    if process_type not in PROCESS_HANDLERS:
        raise HTTPException(status_code=404, detail=f"Process {process_type} not found")
    
    try:
        file_paths = []
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            file_paths.append(file_path)
            logger.info(f"Saved file: {file_path}")

        handler = PROCESS_HANDLERS[process_type]
        result = await handler({"files": file_paths})

        # Cleanup
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)

        return result
    except Exception as e:
        logger.error(f"Process failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)