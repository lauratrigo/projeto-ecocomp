const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================================
   CONEXÃO COM MONGODB
================================ */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Erro Mongo:", err));

/* ================================
   SCHEMAS
================================ */

// Schema Plano (Flat) para facilitar a integração com ESP32 e Chart.js
const ReadingSchema = new mongoose.Schema({
  // Ambiente Interno (Estufa)
  soil: { type: Number, default: 0 },
  airHumidity: { type: Number, default: 0 },
  airTemp: { type: Number, default: 0 },

  // Ambiente Externo
  soilExternal: { type: Number, default: 0 },
  airHumidityExternal: { type: Number, default: 0 },
  tempExternal: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

const ActuatorSchema = new mongoose.Schema({
  bomba: { type: Boolean, default: false },
  ventoinha: { type: Boolean, default: false },
  lampada: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

const ConfigSchema = new mongoose.Schema({
  soloMin: { type: Number, default: 40 },
  tempMax: { type: Number, default: 32 },
  tempMin: { type: Number, default: 18 }
});

const Reading = mongoose.model("Reading", ReadingSchema);
const Actuator = mongoose.model("Actuator", ActuatorSchema);
const Config = mongoose.model("Config", ConfigSchema);

/* ================================
   ROTAS DE SENSORES (POST e GET)
================================ */

// Salvar leitura (ESP32 envia aqui)
app.post("/api/data", async (req, res) => {
  try {
    const { 
      soil, airHumidity, airTemp, 
      soilExternal, airHumidityExternal, tempExternal 
    } = req.body;

    const data = new Reading({
      soil,
      airHumidity,
      airTemp,
      soilExternal: soilExternal || 0,
      airHumidityExternal: airHumidityExternal || 0,
      tempExternal: tempExternal || 0
    });

    await data.save();
    res.json({ message: "Dados salvos com sucesso", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao salvar dados" });
  }
});

// Histórico para o Gráfico e Tabela
app.get("/api/data", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;
    const data = await Reading.find().sort({ createdAt: -1 }).limit(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
});

/* ================================
   ROTAS DE ATUADORES E CONFIG
================================ */

app.get("/api/actuators", async (req, res) => {
  let actuators = await Actuator.findOne() || await Actuator.create({});
  res.json(actuators);
});

app.post("/api/actuators", async (req, res) => {
  const { tipo, ativo } = req.body;
  let actuators = await Actuator.findOne() || new Actuator();
  actuators[tipo] = ativo;
  actuators.updatedAt = new Date();
  await actuators.save();
  res.json(actuators);
});

app.get("/api/config", async (req, res) => {
  let config = await Config.findOne() || await Config.create({});
  res.json(config);
});

app.post("/api/config", async (req, res) => {
  const { soloMin, tempMax, tempMin } = req.body;
  let config = await Config.findOne() || new Config();
  config.soloMin = soloMin;
  config.tempMax = tempMax;
  config.tempMin = tempMin;
  await config.save();
  res.json(config);
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
