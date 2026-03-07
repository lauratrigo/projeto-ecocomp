const API_BASE =
  localStorage.getItem("api_base_url") || "https://projeto-ecocomp.onrender.com";

const ctx = document.getElementById("mainChart").getContext("2d");
const labels = [];
const dadosSoloEstufa = [];
const dadosUmidadeArEstufa = [];
const dadosTempArEstufa = [];

const mainChart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Umidade do Solo (%)",
        data: dadosSoloEstufa,
        borderColor: "#2d6a4f",
        backgroundColor: "rgba(45, 106, 79, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Umidade do Ar (%)",
        data: dadosUmidadeArEstufa,
        borderColor: "#4895ef",
        backgroundColor: "rgba(72, 149, 239, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Temperatura do Ar (°C)",
        data: dadosTempArEstufa,
        borderColor: "#f77f00",
        backgroundColor: "rgba(247, 127, 0, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
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

  setText("solo-estufa", `${dados.soloEstufa}%`);
  setText("umid-ar-estufa", `${dados.umidArEstufa}%`);
  setText("temp-estufa", `${dados.tempEstufa}°C`);

  setText("solo-sub", `Estufa ${dados.soloEstufa}% | Externo ${dados.soloExterno}%`);
  setText(
    "umid-ar-sub",
    `Estufa ${dados.umidArEstufa}% | Externo ${dados.umidArExterno}%`
  );
  setText("temp-sub", `Estufa ${dados.tempEstufa}°C | Externo ${dados.tempExterno}°C`);

  setMeter("solo-meter", dados.soloEstufa, 100);
  setMeter("umid-ar-meter", dados.umidArEstufa, 100);
  setMeter("temp-meter", dados.tempEstufa, 50);

  const horaAtual = dados.horario;

  if (labels.length > 10) {
    labels.shift();
    dadosSoloEstufa.shift();
    dadosUmidadeArEstufa.shift();
    dadosTempArEstufa.shift();
  }

  labels.push(horaAtual);
  dadosSoloEstufa.push(Number(dados.soloEstufa));
  dadosUmidadeArEstufa.push(Number(dados.umidArEstufa));
  dadosTempArEstufa.push(Number(dados.tempEstufa));

  mainChart.update();
}

function normalizarLeitura(item) {
  return {
    soloEstufa: Number(item.soil ?? item.soloEstufa ?? 0).toFixed(0),
    soloExterno: Number(item.soilExternal ?? item.soloExterno ?? 0).toFixed(0),

    tempEstufa: Number(item.airTemp ?? item.temp ?? item.tempEstufa ?? 0).toFixed(1),
    tempExterno: Number(item.tempExternal ?? item.tempExterno ?? 0).toFixed(1),

    umidArEstufa: Number(
      item.airHumidity ?? item.humidity ?? item.umidArEstufa ?? 0
    ).toFixed(0),

    umidArExterno: Number(
      item.airHumidityExternal ??
        item.humidityExternal ??
        item.umidArExterno ??
        0
    ).toFixed(0),

    horario: item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
  };
}

async function buscarDadosDoServidor() {
  try {
    const res = await fetch(`${API_BASE}/api/data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const lista = await res.json();
    if (!Array.isArray(lista) || lista.length === 0) return;

    atualizarInterface(normalizarLeitura(lista[0]));
  } catch (erro) {
    console.error("Falha ao buscar dados do servidor:", erro.message);
  }
}

setInterval(buscarDadosDoServidor, 5000);
buscarDadosDoServidor();
