const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Mongo conectado"))
.catch(err => console.log("Erro Mongo:", err));

// schema dos dados da estufa
const ReadingSchema = new mongoose.Schema({
  soil: Number,        // umidade do solo
  airHumidity: Number, // umidade do ar
  airTemp: Number,     // temperatura do ar
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Reading = mongoose.model("Reading", ReadingSchema);

// rota de teste da API
app.get("/health", (req,res)=>{
  res.json({status:"ok"});
});

// rota para salvar dados
app.post("/api/data", async (req,res)=>{
  try {

    const {soil, airHumidity, airTemp} = req.body;

    const data = new Reading({
      soil,
      airHumidity,
      airTemp
    });

    await data.save();

    res.json({
      message:"dados salvos",
      data
    });

  } catch(error) {
    console.error(error);
    res.status(500).json({erro:"erro ao salvar dados"});
  }
});

// rota para buscar dados
app.get("/api/data", async (req,res)=>{
  try {
    const maxLimit = 10000;
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), maxLimit)
      : 500;

    const query = {};
    const days = Number(req.query.days);
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    if (Number.isFinite(days) && days > 0) {
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      query.createdAt = { ...(query.createdAt || {}), $gte: start };
    }
    if (from instanceof Date && !Number.isNaN(from.getTime())) {
      query.createdAt = { ...(query.createdAt || {}), $gte: from };
    }
    if (to instanceof Date && !Number.isNaN(to.getTime())) {
      query.createdAt = { ...(query.createdAt || {}), $lte: to };
    }

    const data = await Reading
      .find(query)
      .sort({createdAt:-1})
      .limit(limit);

    res.json(data);

  } catch(error){
    res.status(500).json({erro:"erro ao buscar dados"});
  }
});

// iniciar servidor
app.listen(PORT, ()=>{
  console.log("Server rodando");
});
