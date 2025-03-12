from pymongo import MongoClient
import certifi

MONGO_URI = "mongodb+srv://wicklash77:1234@cluster0.z3ubb.mongodb.net/requirement_analysis_db?retryWrites=true&w=majority&tls=true"
try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), connectTimeoutMS=30000, socketTimeoutMS=30000)
    db = client["requirement_analysis_db"]
    print("Bağlantı başarılı:", db.list_collection_names())
except Exception as e:
    print("Bağlantı hatası:", str(e))