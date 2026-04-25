const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

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

// Leituras dos sensores
const ReadingSchema = new mongoose.Schema({
    deviceId: String, // id de cada esp de cada estufa
    soil: Number,               // interno
    airHumidity: Number,        // interno
    airTemp: Number,            // interno
    soilExternal: Number,       // externo
    airHumidityExternal: Number,// externo
    tempExternal: Number,       // externo
    createdAt: { type: Date, default: Date.now }
});

// coleção de estufas
const DeviceSchema = new mongoose.Schema({
    deviceId: String,
    name: String,
    location: String,
    active: Boolean
});

const Device = mongoose.model("Device", DeviceSchema, "devices");

// Atuadores
const ActuatorSchema = new mongoose.Schema({
    bomba: { type: Boolean, default: false },
    ventoinha: { type: Boolean, default: false },
    lampada: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

// Configuração automática
const ConfigSchema = new mongoose.Schema({
    soloMin: Number,
    tempMax: Number,
    tempMin: Number
});

/* ================================
   MODELS
================================ */
const Reading = mongoose.model("Reading", ReadingSchema);
const Actuator = mongoose.model("Actuator", ActuatorSchema);
const Config = mongoose.model("Config", ConfigSchema);

/* ================================
   ROTAS DE TESTE
================================ */
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

/* ================================
   ROTAS DE ATUADORES
================================ */
app.post("/api/actuators", async (req, res) => {
    try {
        const { tipo, ativo } = req.body;

        let actuators = await Actuator.findOne();
        if (!actuators) actuators = new Actuator();

        actuators[tipo] = ativo;
        actuators.updatedAt = new Date();

        await actuators.save();
        res.json({ message: "atuador atualizado", actuators });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "erro ao atualizar atuador" });
    }
});

app.get("/api/actuators", async (req, res) => {
    try {
        let actuators = await Actuator.findOne();
        if (!actuators) {
            actuators = new Actuator();
            await actuators.save();
        }
        res.json(actuators);
    } catch (error) {
        res.status(500).json({ erro: "erro ao buscar atuadores" });
    }
});

/* ================================
   ROTAS DE CONFIGURAÇÃO
================================ */
app.post("/api/config", async (req, res) => {
    try {
        const { soloMin, tempMax, tempMin } = req.body;

        let config = await Config.findOne();
        if (!config) config = new Config();

        config.soloMin = soloMin;
        config.tempMax = tempMax;
        config.tempMin = tempMin;

        await config.save();
        res.json({ message: "configuração salva", config });
    } catch (error) {
        res.status(500).json({ erro: "erro ao salvar config" });
    }
});

app.get("/api/config", async (req, res) => {
    try {
        let config = await Config.findOne();
        if (!config) {
            config = new Config({ soloMin: 40, tempMax: 32, tempMin: 18 });
            await config.save();
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ erro: "erro ao buscar config" });
    }
});

/* ================================
   ROTAS DE SENSORES
================================ */
// SALVAR LEITURA (ESP32 envia)
app.post("/api/data", async (req, res) => {
    try {
        const {
            soil, airHumidity, airTemp,
            soilExternal, airHumidityExternal, tempExternal
        } = req.body;

        const data = new Reading({
            soil: soil ?? 0,
            airHumidity: airHumidity ?? 0,
            airTemp: airTemp ?? 0,
            soilExternal: soilExternal ?? 0,
            airHumidityExternal: airHumidityExternal ?? 0,
            tempExternal: tempExternal ?? 0
        });

        await data.save();
        res.json({ message: "dados salvos", data });
    } catch (error) {
        console.error("Erro no POST:", error);
        res.status(500).json({ erro: "erro ao salvar dados" });
    }
});

// BUSCAR DADOS HISTÓRICOS
app.get("/api/data", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 500;

        const data = await Reading.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        const dadosFormatados = data.map(item => ({
            createdAt: item.createdAt,

            // INTERNO
            soil: item.soil ?? 0,
            airHumidity: item.airHumidity ?? 0,
            airTemp: item.airTemp ?? 0,

            // EXTERNO
            soilExternal: item.soilExternal ?? 0,
            airHumidityExternal: item.airHumidityExternal ?? 0,
            tempExternal: item.tempExternal ?? 0
        }));

        res.json(dadosFormatados);
    } catch (error) {
        res.status(500).json({ erro: "erro ao buscar dados" });
    }
});

/* ================================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
    console.log("Server rodando na porta", PORT);
});

const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    devices: [String], // lista de estufas vinculadas
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password, deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({ erro: "deviceId não enviado" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ erro: "Email já cadastrado" });
        }

        const device = await Device.findOne({ deviceId });

        if (!device) {
            return res.status(400).json({ erro: "Estufa inválida" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            devices: [device.deviceId]
        });

        await user.save();

        return res.json({ message: "Usuário criado com sucesso" });

    } catch (error) {
        console.error("ERRO REGISTER:", error);
        return res.status(500).json({
            erro: "Erro interno no servidor",
            detalhe: error.message
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ erro: "Usuário não encontrado" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ erro: "Senha incorreta" });
        }

        res.json({ message: "Login OK", user: { id: user._id, name: user.name } });

    } catch (error) {
        res.status(500).json({ erro: "Erro no login" });
    }
});

app.get("/ativar", (req, res) => {
    const deviceId = req.query.device;

    if (!deviceId) {
        return res.status(400).send("Device inválido");
    }

    // redireciona pro frontend (GitHub Pages ou login/cadastro)
    return res.redirect(
        `https://lauratrigo.github.io/projeto-ecocomp/cadastro.html?device=${deviceId}`
    );
});

app.post("/api/reset-password-direct", async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ erro: "Usuário não encontrado" });
        }

        const bcrypt = require("bcrypt");
        const hash = await bcrypt.hash(newPassword, 10);

        user.password = hash;
        await user.save();

        res.json({ message: "Senha alterada com sucesso" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao alterar senha" });
    }
});
