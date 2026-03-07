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

    const data = await Reading
      .find()
      .sort({createdAt:-1})
      .limit(10);

    res.json(data);

  } catch(error){
    res.status(500).json({erro:"erro ao buscar dados"});
  }
});

// iniciar servidor
app.listen(PORT, ()=>{
  console.log("Server rodando");
});
