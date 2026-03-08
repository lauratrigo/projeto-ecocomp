from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# --- CONFIGURAÇÃO DE CORS ---
# Permite que seu site (frontend) se comunique com esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONEXÃO MONGODB ---
MONGO_DETAILS = os.getenv("MONGO_URI")
if not MONGO_DETAILS:
    # Apenas para teste local se a variável de ambiente não estiver definida
    MONGO_DETAILS = "mongodb://localhost:27017"

client = MongoClient(MONGO_DETAILS)
db = client.ecocomp
collection = db.sensor_data
config_collection = db.config  # Nova coleção para salvar thresholds

# --- MODELOS DE DADOS (Pydantic) ---
class SensorData(BaseModel):
    soil: float
    airHumidity: float
    airTemp: float

class AtuadorData(BaseModel):
    tipo: str
    ativo: bool

class ConfigData(BaseModel):
    soloMin: float
    tempMax: float
    tempMin: float

# --- ROTAS DA API ---

@app.get("/")
async def home():
    return {"status": "API EcoComp rodando", "versao": "1.2"}

# 1. Receber dados do ESP32
@app.post("/api/data")
async def receber_dados(data: SensorData):
    print(f"Recebendo dados: {data}") # Isso vai aparecer no log
    documento = {
        "soil": data.soil,
        "airHumidity": data.airHumidity,
        "airTemp": data.airTemp,
        "createdAt": datetime.utcnow()
    }
    try:
        # Tenta conectar e inserir
        resultado = collection.insert_one(documento)
        print("Inserção no MongoDB com sucesso!")
        return {"status": "sucesso", "id": str(resultado.inserted_id)}
    except Exception as e:
        # ESTA LINHA É A MAIS IMPORTANTE:
        print(f"ERRO CRÍTICO NO MONGODB: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# 2. Histórico para o Gráfico (Rota que o JS chama)
@app.get("/api/data")
async def pegar_historico(days: int = Query(30)):
    # Busca dados dos últimos 'x' dias
    limite_data = datetime.utcnow() - timedelta(days=days)
    
    # Busca os últimos 1000 registros para não travar o gráfico
    cursor = collection.find({"data_hora": {"$gte": limite_data}}).sort("data_hora", -1).limit(1000)
    
    dados_formatados = []
    for d in cursor:
        dados_formatados.append({
            "createdAt": d["data_hora"].isoformat(),
            "soil": d.get("umidadeSolo", 0),
            "airHumidity": d.get("umidadeAr", 0),
            "airTemp": d.get("temperatura", 0),
            "soilExternal": d.get("umidadeSolo", 0) * 0.9, # Exemplo de dado externo
            "tempExternal": d.get("temperatura", 0) - 2    # Exemplo de dado externo
        })
    return dados_formatados

# Rota para o site enviar o comando (Site -> API -> Banco)
@app.post("/api/actuators")
async def controlar_atuadores(data: dict): # Mudamos de AtuadorData para dict para ser mais flexível
    try:
        tipo = data.get("tipo")
        ativo = data.get("ativo")
        
        # Converte para 1 ou 0
        valor_binario = 1 if ativo else 0
        
        # Tenta gravar no banco
        db.status.update_one(
            {"id": "atuadores"},
            {"$set": {tipo: valor_binario, "ultima_atualizacao": datetime.utcnow()}},
            upsert=True
        )
        
        return {"status": "sucesso", "valor": valor_binario}
    except Exception as e:
        print(f"ERRO NO SERVIDOR: {e}") # Isso vai aparecer no LOG do Render
        raise HTTPException(status_code=500, detail=str(e))

# Rota para o ESP32 ler o que deve fazer (ESP32 -> API -> Banco)
@app.get("/api/actuators")
async def buscar_estado_atuadores():
    estado = db.status.find_one({"id": "atuadores"})
    if not estado:
        return {"bomba": 0, "lampada": 0, "ventoinha": 0}
    
    # Retorna os valores (0 ou 1) para o ESP32 ou para o Site
    return {
        "bomba": estado.get("bomba", 0),
        "lampada": estado.get("lampada", 0),
        "ventoinha": estado.get("ventoinha", 0)
    }
# 4. Configurações de Threshold
@app.post("/api/config")
async def salvar_config(data: ConfigData):
    config_collection.update_one(
        {"id": "thresholds"},
        {"$set": data.dict()},
        upsert=True
    )
    return {"status": "configuração salva"}

@app.get("/api/config")
async def buscar_config():
    cfg = config_collection.find_one({"id": "thresholds"})
    if not cfg:
        return {"soloMin": 40, "tempMax": 30, "tempMin": 18} # Valores padrão
    return {
        "soloMin": cfg.get("soloMin"),
        "tempMax": cfg.get("tempMax"),
        "tempMin": cfg.get("tempMin")
    }
