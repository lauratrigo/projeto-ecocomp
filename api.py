from fastapi import FastAPI, Request, HTTPException
from pymongo import MongoClient
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.getenv("PORT", 3000))

# conexão Mongo
MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    raise Exception("MONGODB_URI não definida")

client = MongoClient(MONGO_URI)
db = client.ecocomp
collection = db.readings

# rota health (igual Node)
@app.get("/health")
async def health():
    return {"status": "ok"}

# salvar dados (igual Node)
@app.post("/api/data")
async def salvar_dados(request: Request):
    try:

        body = await request.json()

        soil = body.get("soil")
        airHumidity = body.get("airHumidity")
        airTemp = body.get("airTemp")

        data = {
            "soil": soil,
            "airHumidity": airHumidity,
            "airTemp": airTemp,
            "createdAt": datetime.utcnow()
        }

        result = collection.insert_one(data)

        return {
            "message": "dados salvos",
            "data": {
                "_id": str(result.inserted_id),
                **data
            }
        }

    except Exception as error:
        print(error)
        raise HTTPException(status_code=500, detail="erro ao salvar dados")

# buscar dados (igual Node)
@app.get("/api/data")
async def buscar_dados(limit: int = 500, days: int = None, from_date: str = None, to_date: str = None):

    try:

        max_limit = 10000
        limit = max(1, min(limit, max_limit))

        query = {}

        if days and days > 0:
            start = datetime.utcnow() - timedelta(days=days)
            query["createdAt"] = {"$gte": start}

        if from_date:
            from_dt = datetime.fromisoformat(from_date)
            query.setdefault("createdAt", {})
            query["createdAt"]["$gte"] = from_dt

        if to_date:
            to_dt = datetime.fromisoformat(to_date)
            query.setdefault("createdAt", {})
            query["createdAt"]["$lte"] = to_dt

        cursor = collection.find(query).sort("createdAt", -1).limit(limit)

        data = []

        for d in cursor:
            data.append({
                "_id": str(d["_id"]),
                "soil": d.get("soil"),
                "airHumidity": d.get("airHumidity"),
                "airTemp": d.get("airTemp"),
                "createdAt": d.get("createdAt")
            })

        return data

    except Exception as error:
        print(error)
        raise HTTPException(status_code=500, detail="erro ao buscar dados")
