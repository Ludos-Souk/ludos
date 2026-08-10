import { auth } from "../config/firebase.js";

const API_URL = "https://ludos-password-reset.onrender.com";
const ROTAS_ATENDIMENTO = {
    libras: "/api/atendimentos/libras",
    texto: "/api/atendimentos/duvida"
};

async function lerResposta(response) {
    const tipoConteudo = response.headers.get("content-type") || "";

    if (!tipoConteudo.includes("application/json")) {
        return {
            sucesso: false,
            mensagem: response.ok
                ? "Solicitação enviada com sucesso."
                : "O serviço de atendimento retornou uma resposta inválida."
        };
    }

    return response.json();
}

export async function criarSolicitacaoAtendimento({ nome, tipo, duvida = "" }) {
    const usuario = auth.currentUser;
    const duvidaNormalizada = String(duvida).trim();

    if (!usuario) {
        throw new Error("Entre na sua conta para solicitar atendimento.");
    }

    if (!Object.hasOwn(ROTAS_ATENDIMENTO, tipo)) {
        throw new Error("Selecione uma forma de atendimento válida.");
    }

    if (tipo === "texto" && !duvidaNormalizada) {
        throw new Error("Digite sua dúvida antes de enviar.");
    }

    if (duvidaNormalizada.length > 3000) {
        throw new Error("A dúvida deve ter no máximo 3000 caracteres.");
    }

    const token = await usuario.getIdToken();
    const corpo = {
        nome: String(nome || usuario.displayName || "Cliente").trim() || "Cliente"
    };

    if (tipo === "texto") {
        corpo.duvida = duvidaNormalizada;
    }

    let response;
    try {
        response = await fetch(`${API_URL}${ROTAS_ATENDIMENTO[tipo]}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(corpo)
        });
    } catch (erro) {
        throw new Error("Não foi possível conectar ao atendimento. Tente novamente.", { cause: erro });
    }

    const resultado = await lerResposta(response);
    if (!response.ok || resultado.sucesso === false) {
        throw new Error(resultado.mensagem || "Não foi possível enviar sua solicitação.");
    }

    return resultado;
}
