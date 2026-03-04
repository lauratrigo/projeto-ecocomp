const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Mongo conectado"))
.catch(err => console.log(err));

const ReadingSchema = new mongoose.Schema({
  soil: Number,
  temp: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Reading = mongoose.model("Reading", ReadingSchema);

app.get("/health", (req,res)=>{
  res.json({status:"ok"});
});

app.post("/api/data", async (req,res)=>{
  const {soil,temp} = req.body;

  const data = new Reading({
    soil,
    temp
  });

  await data.save();

  res.json({message:"dados salvos"});
});

app.get("/api/data", async (req,res)=>{
  const data = await Reading.find().sort({createdAt:-1}).limit(10);

  res.json(data);
});

app.listen(PORT, ()=>{
  console.log("Server rodando");
});
