// ================================
// Configurações da API e estado local
// ================================
const API_BASE = localStorage.getItem("api_base_url") || "https://projeto-ecocomp-zuk4.onrender.com";

const estados = { bomba: false, lampada: false, ventoinha: false };
const labels = { bomba: "Bomba", lampada: "Lâmpada", ventoinha: "Ventoinha" };
const acaoEmAndamento = { bomba: false, lampada: false, ventoinha: false };

// ================================
// Funções para atuadores
// ================================
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

async function enviarComando(tipo, ativo) {
  try {
    const res = await fetch(`${API_BASE}/api/actuators`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ tipo, ativo }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Erro detalhado no Fetch:", err);
    throw err;
  }
}

async function toggleDispositivo(tipo) {
  if (acaoEmAndamento[tipo]) return;

  acaoEmAndamento[tipo] = true;

  const novoEstado = !estados[tipo];

  try {
    const resultado = await enviarComando(tipo, novoEstado);

    estados[tipo] = novoEstado;

    if (resultado?.actuators) {
      estados.bomba = !!resultado.actuators.bomba;
      estados.ventoinha = !!resultado.actuators.ventoinha;
      estados.lampada = !!resultado.actuators.lampada;
    }

    atualizarEstadoVisual(tipo);

  } catch (erro) {
    alert(`Falha ao enviar comando para ${tipo}: ${erro.message}`);
  } finally {
    acaoEmAndamento[tipo] = false;
    atualizarEstadoVisual(tipo);
  }
}


// ================================
// Funções para limites de automação
// ================================
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


async function carregarConfigInicial() {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    if (!res.ok) return;
    const cfg = await res.json();
    if (!cfg) return;

    document.getElementById("threshold-solo").value = cfg.soloMin;
    document.getElementById("threshold-temp-max").value = cfg.tempMax;
    document.getElementById("threshold-temp-min").value = cfg.tempMin;

    // Sincroniza sliders com input numérico
    ["threshold-solo", "threshold-temp-max", "threshold-temp-min"].forEach(id => {
      const input = document.getElementById(id);
      const range = document.getElementById(`${id}-range`);
      if (input && range) range.value = input.value;
    });
  } catch (erro) {
    console.error("Erro ao carregar config:", erro);
  }
}

// ================================
// Funções para sincronizar sliders e inputs
// ================================
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

  const atualizarDaBarra = () => { numero.value = clamp(barra.value); };
  const atualizarDoNumero = () => { 
    const v = clamp(numero.value);
    numero.value = v;
    barra.value = v;
  };

  barra.addEventListener("input", atualizarDaBarra);
  numero.addEventListener("input", atualizarDoNumero);
  numero.addEventListener("blur", atualizarDoNumero);
}

// ================================
// Funções para carregar estado dos atuadores
// ================================
async function carregarEstadoInicial() {
  try {
    const res = await fetch(`${API_BASE}/api/actuators`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data) return;

    estados.bomba = !!data.bomba;
    estados.ventoinha = !!data.ventoinha;
    estados.lampada = !!data.lampada;
  } catch (_) {
    // Mantém valores locais caso falhe
  } finally {
    ["bomba", "ventoinha", "lampada"].forEach(atualizarEstadoVisual);
  }
}

// ================================
// Inicialização da página
// ================================
window.toggleDispositivo = toggleDispositivo;
window.salvarConfig = salvarConfig;

["bomba", "ventoinha", "lampada"].forEach(atualizarEstadoVisual);

sincronizarCampos("threshold-solo", "threshold-solo-range");
sincronizarCampos("threshold-temp-max", "threshold-temp-max-range");
sincronizarCampos("threshold-temp-min", "threshold-temp-min-range");

carregarEstadoInicial();
carregarConfigInicial();

function logout() {
    // limpa login salvo (se você usar depois)
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // volta pro login
    window.location.href = "login.html";
}

setInterval(carregarEstadoInicial, 5000);