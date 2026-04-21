const API_BASE =
  localStorage.getItem("api_base_url") || "https://projeto-ecocomp.onrender.com";

let historyChart;
let periodoAtualDias = 30;

const SENSOR_CONTROLS = [
  { checkboxId: "sensor-soil", datasetIndexes: [0, 3] }, // Solo e Solo Externo
  { checkboxId: "sensor-air", datasetIndexes: [1, 5] },  // Ar e Ar Externo
  { checkboxId: "sensor-temp", datasetIndexes: [2, 4] }, // Temp e Temp Externa
];

function formatarData(dataIso) {
  const data = new Date(dataIso);
  return data.toLocaleString("pt-BR");
}

function normalizar(item) {
  return {
    createdAt: item.createdAt || new Date().toISOString(),
    soil: Number(item.soil ?? 0),
    soilExternal: Number(item.soilExternal ?? 0),
    airHumidity: Number(item.airHumidity ?? 0),
    airHumidityExternal: Number(item.airHumidityExternal ?? 0),
    temp: Number(item.airTemp ?? item.temp ?? 0),
    tempExternal: Number(item.tempExternal ?? 0)
  };
}

async function carregarDadosHistoricos() {
  const limit = 2000;

  try {
    const res = await fetch(`${API_BASE}/api/data?days=${periodoAtualDias}&limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const listaOriginal = (await res.json()).map(normalizar);

    atualizarTabela(listaOriginal);

    const listaParaGrafico = [...listaOriginal].reverse();
    atualizarGrafico(listaParaGrafico);

  } catch (erro) {
    console.error("Falha ao carregar historico:", erro.message);
  }
}

function atualizarTabela(lista) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  for (const item of lista) {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${formatarData(item.createdAt)}</td>

      <td>${item.soil.toFixed(0)}%</td>
      <td>${item.soilExternal.toFixed(0)}%</td>

      <td>${item.airHumidity.toFixed(0)}%</td>
      <td>${item.airHumidityExternal.toFixed(0)}%</td>

      <td>${item.temp.toFixed(1)}°C</td>
      <td>${item.tempExternal.toFixed(1)}°C</td>
    `;

    tbody.appendChild(row);
  }
}

function atualizarGrafico(lista) {
  const labels = lista.map((x) => formatarData(x.createdAt));
  const dadosSolo = lista.map((x) => x.soil);
  const dadosSoloExterno = lista.map((x) => x.soilExternal);
  const dadosUmidadeAr = lista.map((x) => x.airHumidity);
  const dadosTemp = lista.map((x) => x.temp);
  const dadosTempExterna = lista.map((x) => x.tempExternal);
  const dadosUmidadeArExterna = lista.map((x) => x.airHumidityExternal);

  const ctx = document.getElementById("historyChart").getContext("2d");

  if (historyChart) {
    historyChart.destroy();
  }

  historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [

        // SOLO
        {
          label: "Solo Estufa (%)",
          data: dadosSolo,
          borderColor: "#2d6a4f",
          backgroundColor: "rgba(45,106,79,0.1)",
          fill: false,
          borderWidth: 2.4,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          tension: 0,
          yAxisID: "y",
        },
        {
          label: "Solo Externo (%)",
          data: dadosSoloExterno,
          borderColor: "#74c69d",
          backgroundColor: "rgba(116,198,157,0.1)",
          fill: false,
          borderWidth: 2.2,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          tension: 0,
          yAxisID: "y",
        },

        // UMIDADE
        {
          label: "Umidade Ar Estufa (%)",
          data: dadosUmidadeAr,
          borderColor: "#4895ef",
          backgroundColor: "rgba(72,149,239,0.1)",
          fill: false,
          borderWidth: 2.4,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          tension: 0,
          yAxisID: "y",
        },
        {
          label: "Umidade Externa (%)",
          data: dadosUmidadeArExterna,
          borderColor: "#90dbf4",
          backgroundColor: "rgba(144,219,244,0.1)",
          fill: false,
          borderWidth: 2.2,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          tension: 0,
          yAxisID: "y",
        },

        // TEMPERATURA
        {
          label: "Temperatura do Ar (°C)",
          data: dadosTemp,
          borderColor: "#ee6f13",
          backgroundColor: "rgba(238,111,19,0.12)",
          fill: false,
          borderWidth: 2.4,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          tension: 0,
          yAxisID: "y",
        },
        {
          label: "Temperatura Externa (°C)",
          data: dadosTempExterna,
          borderColor: "#ffb703",
          backgroundColor: "rgba(255,183,3,0.12)",
          fill: false,
          borderWidth: 2.2,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          tension: 0,
          yAxisID: "y",
        }

      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      layout: {
        padding: {
          left: 10,
          right: 10,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "center",
          labels: {
            usePointStyle: false,
            boxWidth: 26,
            boxHeight: 12,
            padding: 14,
            color: "#4b5563",
            font: { size: 12, weight: "600" },
          },
        },
      },
      scales: {
        y: {
          position: "left",
          min: 10,
          max: 100,
          ticks: { stepSize: 10, color: "#6b7280" },
          title: { display: false },
          grid: { color: "#e5e7eb", borderDash: [4, 4] },
        },
        x: {
          ticks: { color: "#6b7280", maxRotation: 18, minRotation: 18, autoSkip: true, maxTicksLimit: 12 },
          grid: { color: "#f1f5f9", borderDash: [4, 4] },
        },
      },
    },
  });

  aplicarFiltroSensores();
}

function aplicarFiltroSensores() {
  if (!historyChart) return;

  SENSOR_CONTROLS.forEach(({ checkboxId, datasetIndexes }) => {

    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;

    datasetIndexes.forEach(index => {
      historyChart.setDatasetVisibility(index, checkbox.checked);
    });

  });

  historyChart.update();
}

function atualizarTabsAtivas(periodo) {
  const periodoStr = String(periodo);
  document.querySelectorAll(".period-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.period === periodoStr);
  });
}

function selecionarPeriodo(botao) {
  const periodo = botao.dataset.period;
  if (periodo === "custom") {
    const valor = Number(prompt("Digite o período em dias (1 a 90):", String(periodoAtualDias)));
    if (!Number.isFinite(valor) || valor < 1 || valor > 90) {
      atualizarTabsAtivas(periodoAtualDias);
      return;
    }
    periodoAtualDias = Math.round(valor);
    atualizarTabsAtivas("custom");
  } else {
    periodoAtualDias = Number(periodo);
    atualizarTabsAtivas(periodoAtualDias);
  }

  carregarDadosHistoricos();
}

function configurarTabsDePeriodo() {
  document.querySelectorAll(".period-tab").forEach((botao) => {
    botao.addEventListener("click", () => selecionarPeriodo(botao));
  });
}

function configurarDropdownSensores() {
  const toggleBtn = document.getElementById("sensor-toggle");
  const menu = document.getElementById("sensor-menu");
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggleBtn.contains(event.target)) {
      menu.classList.add("hidden");
    }
  });

  SENSOR_CONTROLS.forEach(({ checkboxId }) => {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;
    checkbox.addEventListener("change", aplicarFiltroSensores);
  });
}

function configurarDropdownExportacao() {
  const toggleBtn = document.getElementById("export-toggle");
  const menu = document.getElementById("export-menu");
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggleBtn.contains(event.target)) {
      menu.classList.add("hidden");
    }
  });
}

function exportarCSV() {
  const { header, rows } = obterLinhasTabela();
  const csvRows = [header, ...rows];

  const csv = csvRows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "historico_estufa.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function obterLinhasTabela() {
  const header = [...document.querySelectorAll(".data-table thead th")].map((th) => th.innerText.trim());
  const trList = document.querySelectorAll("#table-body tr");
  const rows = trList.length
    ? [...trList].map((tr) => [...tr.querySelectorAll("td")].map((td) => td.innerText))
    : [];
  return { header, rows };
}

function exportarPDF() {
  const tabela = document.querySelector(".history-table-wrap");
  const canvas = document.getElementById("historyChart");
  if (!tabela) return;

  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) return;

  const chartImage = canvas ? canvas.toDataURL("image/png") : "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Histórico de Medições</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          .chart-block { margin-bottom: 16px; }
          .chart-block img { width: 100%; max-width: 980px; border: 1px solid #e5e7eb; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Histórico de Medições</h1>
        ${chartImage ? `<div class="chart-block"><img src="${chartImage}" alt="Gráfico histórico"></div>` : ""}
        ${tabela.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function exportarImagem() {
  const canvas = document.getElementById("historyChart");
  if (!canvas) return;
  const url = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = url;
  link.download = "historico_grafico.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.carregarDadosHistoricos = carregarDadosHistoricos;
window.exportarCSV = exportarCSV;
window.exportarPDF = exportarPDF;
window.exportarImagem = exportarImagem;

configurarTabsDePeriodo();
configurarDropdownSensores();
configurarDropdownExportacao();
atualizarTabsAtivas(periodoAtualDias);
carregarDadosHistoricos();


function logout() {
    // limpa login salvo (se você usar depois)
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // volta pro login
    window.location.href = "login.html";
}