from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime
import os

app = FastAPI()

# conexão MongoDB
MONGO_DETAILS = os.getenv("MONGO_URL")

client = MongoClient(MONGO_DETAILS)
db = client.ecocomp
collection = db.sensor_data


# modelo dos dados recebidos
class SensorData(BaseModel):
    temperatura: float
    umidadeAr: float
    umidadeSolo: float


# rota POST para enviar dados
@app.post("/dados")
async def receber_dados(data: SensorData):

    documento = {
        "temperatura": data.temperatura,
        "umidadeAr": data.umidadeAr,
        "umidadeSolo": data.umidadeSolo,
        "data_hora": datetime.utcnow()
    }

    try:
        resultado = collection.insert_one(documento)

        return {
            "status": "sucesso",
            "id": str(resultado.inserted_id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# rota GET para pegar dados
@app.get("/dados")
async def pegar_dados():

    dados = list(collection.find().sort("data_hora", -1).limit(10))

    for d in dados:
        d["_id"] = str(d["_id"])

    return dados


@app.get("/")
async def home():
    return {"status": "API EcoComp rodando"}
