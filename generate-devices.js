const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://ecocomp:projeto-engcomp@cluster0.ictnsp1.mongodb.net/ecocomp");

const DeviceSchema = new mongoose.Schema({
  deviceId: String,
  name: String,
  location: String,
  active: Boolean
});

const Device = mongoose.model("Device", DeviceSchema);

const devices = [];

for (let i = 1; i <= 100; i++) {
  const id = `estufa-${String(i).padStart(3, "0")}`;

  devices.push({
    deviceId: id,
    name: `Estufa ${i}`,
    location: "Brasil",
    active: true
  });
}

async function seed() {
  try {
    await Device.deleteMany({}); // limpa antes (opcional)
    await Device.insertMany(devices);

    console.log("✅ 100 estufas inseridas com sucesso");
  } catch (err) {
    console.error("Erro ao inserir:", err);
  } finally {
    mongoose.disconnect();
  }
}

seed();