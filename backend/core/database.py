"""
database.py
-----------
MongoDB bağlantısını ve temel veritabanı işlemlerini yönetir.
Örneğin, koleksiyonlara erişim, CRUD işlemleri gibi fonksiyonları burada tanımlayabilirsiniz.
"""

from pymongo import MongoClient
from config import MONGO_URI

def get_db():
    client = MongoClient(MONGO_URI)
    return client["stlc_database"]  # Örnek veritabanı adı
