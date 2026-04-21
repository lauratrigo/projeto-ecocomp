const API_BASE =
  localStorage.getItem("api_base_url") ||
  "https://projeto-ecocomp-zuk4.onrender.com";

const ctx = document.getElementById("mainChart").getContext("2d");

const labels = [];

// ESTUFA
const dadosSoloEstufa = [];
const dadosUmidadeArEstufa = [];
const dadosTempArEstufa = [];

// EXTERNO
const dadosSoloExterno = [];
const dadosUmidadeArExterno = [];
const dadosTempArExterno = [];

const mainChart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [

      // SOLO
      {
        label: "Solo Estufa (%)",
        data: dadosSoloEstufa,
        borderColor: "#2d6a4f",
        backgroundColor: "rgba(45,106,79,0.1)",
        tension: 0.3
      },
      {
        label: "Solo Externo (%)",
        data: dadosSoloExterno,
        borderColor: "#74c69d",
        backgroundColor: "rgba(116,198,157,0.1)",
        tension: 0.3
      },

      // UMIDADE
      {
        label: "Umidade Ar Estufa (%)",
        data: dadosUmidadeArEstufa,
        borderColor: "#4895ef",
        backgroundColor: "rgba(72,149,239,0.1)",
        tension: 0.3
      },
      {
        label: "Umidade Ar Externo (%)",
        data: dadosUmidadeArExterno,
        borderColor: "#90dbf4",
        backgroundColor: "rgba(144,219,244,0.1)",
        tension: 0.3
      },

      // TEMPERATURA
      {
        label: "Temp Estufa (°C)",
        data: dadosTempArEstufa,
        borderColor: "#ee6f13",
        backgroundColor: "rgba(238,111,19,0.12)",
        tension: 0.3
      },
      {
        label: "Temp Externo (°C)",
        data: dadosTempArExterno,
        borderColor: "#ffb703",
        backgroundColor: "rgba(255,183,3,0.12)",
        tension: 0.3
      }

    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          boxWidth: 20,
          padding: 12,
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

function atualizarInterface(dados) {

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };

  const setMeter = (id, value, max = 100) => {
    const el = document.getElementById(id);
    if (!el) return;

    const pct = Math.max(0, Math.min((Number(value) / max) * 100, 100));
    el.style.width = `${pct}%`;
  };

  // CARDS ESTUFA
  setText("solo-estufa", `${dados.soloEstufa}%`);
  setText("umid-ar-estufa", `${dados.umidArEstufa}%`);
  setText("temp-estufa", `${dados.tempEstufa}°C`);

  // CARDS EXTERNOS
  setText("solo-externo", `${dados.soloExterno}%`);
  setText("umid-ar-externo", `${dados.umidArExterno}%`);
  setText("temp-externo", `${dados.tempExterno}°C`);

  // BARRINHAS - ESTUFA
  setMeter("solo-meter", dados.soloEstufa);
  setMeter("umid-ar-meter", dados.umidArEstufa);
  setMeter("temp-meter", dados.tempEstufa, 50);

  // BARRINHAS - EXTERNO
  setMeter("solo-externo-meter", dados.soloExterno);
  setMeter("umid-ar-externo-meter", dados.umidArExterno);
  setMeter("temp-externo-meter", dados.tempExterno, 50);

  const horaAtual = dados.horario;

  if (labels.length > 10) {

    labels.shift();

    dadosSoloEstufa.shift();
    dadosUmidadeArEstufa.shift();
    dadosTempArEstufa.shift();

    dadosSoloExterno.shift();
    dadosUmidadeArExterno.shift();
    dadosTempArExterno.shift();
  }

  labels.push(horaAtual);

  // ESTUFA
  dadosSoloEstufa.push(Number(dados.soloEstufa));
  dadosUmidadeArEstufa.push(Number(dados.umidArEstufa));
  dadosTempArEstufa.push(Number(dados.tempEstufa));

  // EXTERNO
  dadosSoloExterno.push(Number(dados.soloExterno));
  dadosUmidadeArExterno.push(Number(dados.umidArExterno));
  dadosTempArExterno.push(Number(dados.tempExterno));

  mainChart.update();
}

function normalizarLeitura(item) {

  if (!item) return null;

  return {
    soloEstufa: item.soil ?? 0,
    tempEstufa: item.airTemp ?? 0,
    umidArEstufa: item.airHumidity ?? 0,

    soloExterno: item.soilExternal ?? 0,
    tempExterno: item.tempExternal ?? 0,
    umidArExterno: item.airHumidityExternal ?? 0,

    horario: item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--"
  };
};

async function buscarDadosDoServidor() {

  try {

    const res = await fetch(`${API_BASE}/api/data?limit=1`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const lista = await res.json();

    if (!Array.isArray(lista) || lista.length === 0) return;

    atualizarInterface(normalizarLeitura(lista[0]));

  } catch (erro) {

    console.error("Falha ao buscar dados:", erro.message);

  }

}

setInterval(buscarDadosDoServidor, 5000);

buscarDadosDoServidor();

function logout() {
    // limpa login salvo (se você usar depois)
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // volta pro login
    window.location.href = "login.html";
}