"""
model_client.py
---------------
LLM (Large Language Model) çağrılarını yöneten katman.
Örneğin, ChatOpenAI gibi modelleri buradan çağırabilirsiniz.
"""

from langchain_community.chat_models import ChatOpenAI
from config import MODEL_API_BASE_URL, MODEL_IDENTIFIER

def get_llm_instance(temperature: float = 0.7):
    llm = ChatOpenAI(
        model_name=MODEL_IDENTIFIER,
        openai_api_base=MODEL_API_BASE_URL,
        
        temperature=temperature
    )
    return llm
