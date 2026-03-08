const API_BASE =
  localStorage.getItem("api_base_url") || "https://projeto-ecocomp.onrender.com";

const estados = {
  bomba: false,
  lampada: false,
  ventoinha: false,
};

const labels = {
  bomba: "Bomba",
  lampada: "Lâmpada",
  ventoinha: "Ventoinha",
};

const acaoEmAndamento = {
  bomba: false,
  lampada: false,
  ventoinha: false,
};

function atualizarEstadoVisual(tipo) {
  const status = document.getElementById(`status-${tipo}`);
  if (!status) return;

  const ativo = estados[tipo];
  status.innerText = ativo ? "Ativado" : "Desligado";
  status.className = `status-pill ${tipo} ${ativo ? "on" : "off"}`;

  const botao = status.closest(".config-actuator-card")?.querySelector("button");
  if (botao) {
    botao.innerText = acaoEmAndamento[tipo]
      ? "Enviando..."
      : `${ativo ? "Desativar" : "Ativar"} ${labels[tipo]}`;
    botao.disabled = acaoEmAndamento[tipo];
  }
}

function sincronizarCampos(numberId, rangeId) {
  const numero = document.getElementById(numberId);
  const barra = document.getElementById(rangeId);
  if (!numero || !barra) return;

  const clamp = (value) => {
    const min = Number(numero.min || barra.min || 0);
    const max = Number(numero.max || barra.max || 100);
    const n = Number(value);
    return Math.min(max, Math.max(min, Number.isNaN(n) ? min : n));
  };

  const atualizarDaBarra = () => {
    numero.value = String(clamp(barra.value));
  };

  const atualizarDoNumero = () => {
    const v = clamp(numero.value);
    numero.value = String(v);
    barra.value = String(v);
  };

  barra.addEventListener("input", atualizarDaBarra);
  numero.addEventListener("input", atualizarDoNumero);
  numero.addEventListener("blur", atualizarDoNumero);
}

async function enviarComando(tipo, ativo) {
  const res = await fetch(`${API_BASE}/api/actuators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, ativo }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

async function toggleDispositivo(tipo) {
  if (acaoEmAndamento[tipo]) return;

  acaoEmAndamento[tipo] = true;
  estados[tipo] = !estados[tipo];
  atualizarEstadoVisual(tipo);

  try {
    await enviarComando(tipo, estados[tipo]);
  } catch (erro) {
    estados[tipo] = !estados[tipo];
    alert(`Falha ao enviar comando para ${tipo}: ${erro.message}`);
  } finally {
    acaoEmAndamento[tipo] = false;
    atualizarEstadoVisual(tipo);
  }
}

async function salvarConfig() {
  const solo = Number(document.getElementById("threshold-solo").value);
  const tMax = Number(document.getElementById("threshold-temp-max").value);
  const tMin = Number(document.getElementById("threshold-temp-min").value);

  if ([solo, tMax, tMin].some((v) => Number.isNaN(v))) {
    alert("Preencha todos os parâmetros com valores válidos.");
    return;
  }
  if (tMin >= tMax) {
    alert("A temperatura mínima deve ser menor que a temperatura máxima.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soloMin: solo, tempMax: tMax, tempMin: tMin }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    alert("Parâmetros atualizados com sucesso.");
  } catch (erro) {
    alert(`Falha ao salvar configuração: ${erro.message}`);
  }
}

async function carregarEstadoInicial() {
  try {
    const res = await fetch(`${API_BASE}/api/actuators`);
    if (!res.ok) return;
    const data = await res.json();
    const base = Array.isArray(data) ? data[0] : data;
    if (!base || typeof base !== "object") return;

    if (typeof base.bomba === "boolean") estados.bomba = base.bomba;
    if (typeof base.ventoinha === "boolean") estados.ventoinha = base.ventoinha;
    if (typeof base.lampada === "boolean") estados.lampada = base.lampada;
  } catch (_erro) {
    // Mantém valores locais caso a API não tenha endpoint de leitura.
  } finally {
    ["bomba", "ventoinha", "lampada"].forEach(atualizarEstadoVisual);
  }
}

async function carregarConfigInicial() {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    if (!res.ok) return;
    const cfg = await res.json();
    if (!cfg || typeof cfg !== "object") return;

    const solo = Number(cfg.soloMin);
    const tMax = Number(cfg.tempMax);
    const tMin = Number(cfg.tempMin);

    if (!Number.isNaN(solo)) document.getElementById("threshold-solo").value = String(solo);
    if (!Number.isNaN(tMax)) document.getElementById("threshold-temp-max").value = String(tMax);
    if (!Number.isNaN(tMin)) document.getElementById("threshold-temp-min").value = String(tMin);

    const syncNumberToRange = (numberId, rangeId) => {
      const number = document.getElementById(numberId);
      const range = document.getElementById(rangeId);
      if (!number || !range) return;
      range.value = number.value;
    };
    syncNumberToRange("threshold-solo", "threshold-solo-range");
    syncNumberToRange("threshold-temp-max", "threshold-temp-max-range");
    syncNumberToRange("threshold-temp-min", "threshold-temp-min-range");
  } catch (_erro) {
    // Mantém valores default caso a API não tenha endpoint de leitura.
  }
}

window.toggleDispositivo = toggleDispositivo;
window.salvarConfig = salvarConfig;

["bomba", "ventoinha", "lampada"].forEach(atualizarEstadoVisual);
sincronizarCampos("threshold-solo", "threshold-solo-range");
sincronizarCampos("threshold-temp-max", "threshold-temp-max-range");
sincronizarCampos("threshold-temp-min", "threshold-temp-min-range");
carregarEstadoInicial();
carregarConfigInicial();
