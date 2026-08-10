import {
    aplicarConfiguracoesAcessibilidade,
    obterConfiguracoesAcessibilidade,
    salvarConfiguracoesAcessibilidade
} from "../../../services/configuracoesService.js";
import { mostrarFeedbackGlobal } from "./asyncFeedback.js";

const URL_MEDIAPIPE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
const URL_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const URL_MODELO = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SELETOR_INTERATIVO = [
    "a[href]", "button:not([disabled])", "input:not([disabled])",
    "select:not([disabled])", "textarea:not([disabled])", "summary",
    "[role='button']:not([aria-disabled='true'])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");
const TEMPO_CLIQUE = 1400;

const estado = {
    inicializado: false,
    iniciando: false,
    ativo: false,
    geracao: 0,
    fluxo: null,
    detector: null,
    video: null,
    painel: null,
    cursor: null,
    status: null,
    animacao: null,
    ultimaExecucao: -1,
    ultimaInferencia: 0,
    amostras: [],
    neutro: null,
    posicao: { x: innerWidth / 2, y: innerHeight / 2 },
    suavizado: null,
    alvo: null,
    inicioPermanencia: 0,
    ultimoClique: 0
};

function atualizarInterruptores(ativo) {
    document.querySelectorAll("#eye-tracking, #admin-eye-tracking").forEach(controle => {
        controle.checked = ativo;
    });
}

function criarInterface() {
    if (estado.painel?.isConnected) return;

    const painel = document.createElement("aside");
    painel.className = "face-navigation-panel";
    painel.setAttribute("aria-label", "Controles da navegação facial");
    painel.innerHTML = `
        <video class="face-navigation-preview" muted playsinline aria-hidden="true"></video>
        <div class="face-navigation-info">
            <strong>Navegação facial</strong>
            <span class="face-navigation-status" role="status" aria-live="polite">Preparando câmera...</span>
        </div>
        <button type="button" class="face-navigation-calibrate">Calibrar</button>
        <button type="button" class="face-navigation-stop" aria-label="Desativar navegação facial">Parar</button>`;

    const cursor = document.createElement("div");
    cursor.className = "face-navigation-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.style.setProperty("--dwell", "0deg");
    cursor.style.transform = `translate3d(${estado.posicao.x}px,${estado.posicao.y}px,0)`;

    painel.querySelector(".face-navigation-calibrate").addEventListener("click", calibrar);
    painel.querySelector(".face-navigation-stop").addEventListener("click", desativarPelaInterface);
    document.body.append(painel, cursor);

    estado.painel = painel;
    estado.video = painel.querySelector("video");
    estado.status = painel.querySelector(".face-navigation-status");
    estado.cursor = cursor;
}

function definirStatus(texto, estadoVisual = "") {
    if (!estado.status) return;
    estado.status.textContent = texto;
    estado.painel.dataset.state = estadoVisual;
}

function calibrar() {
    estado.amostras = [];
    estado.neutro = null;
    estado.suavizado = null;
    estado.alvo = null;
    estado.posicao = { x: innerWidth / 2, y: innerHeight / 2 };
    definirStatus("Olhe para o centro da tela...", "calibrating");
}

function elementoInterativoEm(x, y) {
    const elemento = document.elementFromPoint(x, y)?.closest?.(SELETOR_INTERATIVO);
    if (!elemento || elemento.closest("[hidden], [inert]") || elemento.getAttribute("aria-disabled") === "true") return null;
    return elemento;
}

function atualizarPermanencia(agora) {
    const alvo = elementoInterativoEm(estado.posicao.x, estado.posicao.y);
    if (alvo !== estado.alvo) {
        estado.alvo?.classList.remove("face-navigation-target");
        estado.alvo = alvo;
        estado.inicioPermanencia = agora;
        alvo?.classList.add("face-navigation-target");
    }

    const progresso = alvo ? Math.min(1, (agora - estado.inicioPermanencia) / TEMPO_CLIQUE) : 0;
    estado.cursor.style.setProperty("--dwell", `${progresso * 360}deg`);

    if (alvo && progresso >= 1 && agora - estado.ultimoClique > 900) {
        estado.ultimoClique = agora;
        estado.inicioPermanencia = Number.POSITIVE_INFINITY;
        alvo.focus?.({ preventScroll: true });
        alvo.click();
    }
}

function moverCursor(ponto, agora) {
    estado.suavizado ||= { x: ponto.x, y: ponto.y };
    estado.suavizado.x += (ponto.x - estado.suavizado.x) * .22;
    estado.suavizado.y += (ponto.y - estado.suavizado.y) * .22;

    if (!estado.neutro) {
        estado.amostras.push({ ...estado.suavizado });
        if (estado.amostras.length >= 35) {
            estado.neutro = estado.amostras.reduce((media, item) => ({
                x: media.x + item.x / estado.amostras.length,
                y: media.y + item.y / estado.amostras.length
            }), { x: 0, y: 0 });
            definirStatus("Mova o rosto e pare sobre um botão para clicar.", "active");
        }
        return;
    }

    let dx = estado.suavizado.x - estado.neutro.x;
    let dy = estado.suavizado.y - estado.neutro.y;
    const zonaMorta = .008;
    dx = Math.abs(dx) < zonaMorta ? 0 : dx - Math.sign(dx) * zonaMorta;
    dy = Math.abs(dy) < zonaMorta ? 0 : dy - Math.sign(dy) * zonaMorta;

    estado.posicao.x = Math.max(14, Math.min(innerWidth - 14, estado.posicao.x + dx * 115));
    estado.posicao.y = Math.max(14, Math.min(innerHeight - 14, estado.posicao.y + dy * 125));
    estado.cursor.style.transform = `translate3d(${estado.posicao.x}px,${estado.posicao.y}px,0)`;

    if (estado.posicao.y < 38) window.scrollBy({ top: -7, behavior: "auto" });
    if (estado.posicao.y > innerHeight - 38) window.scrollBy({ top: 7, behavior: "auto" });
    atualizarPermanencia(agora);
}

function processarFrame() {
    if (!estado.ativo || !estado.video || !estado.detector) return;
    const agora = performance.now();

    if (estado.video.readyState >= 2 && estado.video.currentTime !== estado.ultimaExecucao && agora - estado.ultimaInferencia >= 50) {
        estado.ultimaExecucao = estado.video.currentTime;
        estado.ultimaInferencia = agora;
        try {
            const resultado = estado.detector.detectForVideo(estado.video, agora);
            const rosto = resultado.faceLandmarks?.[0];
            if (rosto?.[1]) {
                definirStatus(estado.neutro ? "Navegação ativa" : "Olhe para o centro da tela...", estado.neutro ? "active" : "calibrating");
                moverCursor(rosto[1], agora);
            } else {
                definirStatus("Rosto não encontrado. Olhe para a câmera.", "warning");
                estado.alvo?.classList.remove("face-navigation-target");
                estado.alvo = null;
            }
        } catch (erro) {
            console.warn("Falha ao analisar quadro da navegação facial:", erro);
        }
    }
    estado.animacao = requestAnimationFrame(processarFrame);
}

function encerrarRecursos() {
    cancelAnimationFrame(estado.animacao);
    estado.animacao = null;
    estado.fluxo?.getTracks().forEach(trilha => trilha.stop());
    estado.detector?.close?.();
    estado.alvo?.classList.remove("face-navigation-target");
    estado.painel?.remove();
    estado.cursor?.remove();
    Object.assign(estado, {
        ativo: false, iniciando: false, fluxo: null, detector: null, video: null,
        painel: null, cursor: null, status: null, alvo: null, neutro: null,
        amostras: [], suavizado: null, ultimaExecucao: -1, ultimaInferencia: 0
    });
}

function desativarPelaInterface() {
    const configuracoes = salvarConfiguracoesAcessibilidade({ eyeTracking: false });
    aplicarConfiguracoesAcessibilidade(configuracoes);
    atualizarInterruptores(false);
    mostrarFeedbackGlobal("Navegação facial desativada.");
}

function tratarFalha(erro) {
    console.error("Não foi possível iniciar a navegação facial:", erro);
    encerrarRecursos();
    const configuracoes = salvarConfiguracoesAcessibilidade({ eyeTracking: false });
    aplicarConfiguracoesAcessibilidade(configuracoes);
    atualizarInterruptores(false);
    const mensagem = erro?.name === "NotAllowedError"
        ? "A permissão da câmera foi negada. Autorize-a no navegador para usar a navegação facial."
        : "Não foi possível iniciar a navegação facial. Verifique a câmera e sua conexão.";
    mostrarFeedbackGlobal(mensagem, "error", 6500);
}

async function ativar() {
    if (estado.ativo || estado.iniciando) return;
    if (!navigator.mediaDevices?.getUserMedia) {
        tratarFalha(new Error("Câmera não suportada neste navegador."));
        return;
    }

    const geracao = ++estado.geracao;
    estado.iniciando = true;
    criarInterface();
    definirStatus("Solicitando acesso à câmera...", "loading");

    try {
        estado.fluxo = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (geracao !== estado.geracao) return encerrarRecursos();
        estado.video.srcObject = estado.fluxo;
        await estado.video.play();
        definirStatus("Carregando reconhecimento facial...", "loading");

        const { FaceLandmarker, FilesetResolver } = await import(URL_MEDIAPIPE);
        const arquivosVisao = await FilesetResolver.forVisionTasks(URL_WASM);
        const opcoesDetector = {
            baseOptions: { modelAssetPath: URL_MODELO, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: .55,
            minFacePresenceConfidence: .55,
            minTrackingConfidence: .55
        };
        try {
            estado.detector = await FaceLandmarker.createFromOptions(arquivosVisao, opcoesDetector);
        } catch (erroGpu) {
            console.info("GPU indisponível; usando processamento facial pela CPU.", erroGpu);
            estado.detector = await FaceLandmarker.createFromOptions(arquivosVisao, {
                ...opcoesDetector,
                baseOptions: { modelAssetPath: URL_MODELO }
            });
        }
        if (geracao !== estado.geracao) return encerrarRecursos();

        estado.iniciando = false;
        estado.ativo = true;
        calibrar();
        mostrarFeedbackGlobal("Câmera ativa. Olhe para o centro da tela para calibrar.");
        processarFrame();
    } catch (erro) {
        tratarFalha(erro);
    }
}

function alternar(configuracoes) {
    if (configuracoes?.eyeTracking) ativar();
    else {
        estado.geracao++;
        encerrarRecursos();
    }
}

export function iniciarNavegacaoFacial() {
    if (estado.inicializado) return;
    estado.inicializado = true;
    window.addEventListener("ludos:accessibility-change", evento => alternar(evento.detail));
    window.addEventListener("pagehide", encerrarRecursos);
    alternar(obterConfiguracoesAcessibilidade());
}
