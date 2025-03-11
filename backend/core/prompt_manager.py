"""
prompt_manager.py
-----------------
Her STLC adımı için MongoDB'den system prompt ve query_str gibi verileri çekmeye yarar.
Ayrıca structured_output formatı gibi ilave bilgileri de buradan alabilirsiniz.
"""

from core.database import get_db

def get_prompts_for_step(step_name: str):
    db = get_db()
    collection = db["stlc_prompts"]  # Örnek koleksiyon adı
    document = collection.find_one({"step": step_name})
    if document:
        return {
            "system_prompt": document.get("system_prompt", ""),
            "query_str": document.get("query_str", ""),
            "structured_output_schema": document.get("structured_output_schema", {})
        }
    return {}
