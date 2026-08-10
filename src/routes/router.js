import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "../config/firebase.js";
import { ROTAS } from "../config/rotas.js";
import {
    aplicarConfiguracoesAcessibilidade,
    obterConfiguracoesAcessibilidade
} from "../services/configuracoesService.js";
import { buscarUsuarioPorId } from "../services/usuarioService.js";

const ROTAS_AUTENTICACAO = [
    ROTAS.LOGIN,
    ROTAS.CADASTRO,
    ROTAS.ESQUECI_SENHA,
    ROTAS.VERIFICAR_EMAIL,
    ROTAS.RESETAR_SENHA,
    ROTAS.SUCESSO_SENHA,
    ROTAS.ERRO_SENHA
];

const ROTAS_PUBLICAS = [
    ...ROTAS_AUTENTICACAO
];

const ROTAS_PROTEGIDAS = [
    ROTAS.HOME,
    ROTAS.PERFIL,
    ROTAS.ADMIN,
    ROTAS.CARRINHO,
    ROTAS.ENDERECO,
    ROTAS.FINALIZAR_PEDIDO,
    ROTAS.CARTAO,
    ROTAS.PIX,
    ROTAS.SUCESSO_PEDIDO,
    ROTAS.ERRO_PEDIDO,
    ROTAS.AVALIACAO_PRODUTO
];

export function obterRotaAtual() {

    const caminho =
        window.location.pathname
            .replace(/\/+$/, "");

    return decodeURIComponent(
        caminho.substring(
            caminho.lastIndexOf("/") + 1
        )
    );
}

export function ehRotaAutenticacao(rota) {
    return ROTAS_AUTENTICACAO.includes(rota);
}

export function ehRotaPublica(rota) {
    return ROTAS_PUBLICAS.includes(rota);
}

export function ehRotaProtegida(rota) {
    return ROTAS_PROTEGIDAS.includes(rota);
}

export function redirecionarPara(rota) {

    if (obterRotaAtual() !== rota) {
        window.location.replace(rota);
    }
}

function iniciarNavegacaoGlobal() {
    const botaoPerfil = document.querySelector(
        'button[aria-label="Acessar meu perfil"]'
    );

    botaoPerfil?.addEventListener("click", () => {
        window.location.href = ROTAS.PERFIL;
    });
}

export function iniciarRouter() {

    const rotaAtual =
        obterRotaAtual();

    return new Promise((resolve) => {

        const cancelar =
            onAuthStateChanged(
                auth,
                async (usuario) => {

                    cancelar();

                    if (
                        !usuario &&
                        ehRotaProtegida(rotaAtual)
                    ) {
                        redirecionarPara(
                            ROTAS.LOGIN
                        );

                        resolve(false);
                        return;
                    }

                    if (
                        usuario &&
                        ehRotaAutenticacao(rotaAtual)
                    ) {
                        const usuarioBanco =
                            await buscarUsuarioPorId(usuario.uid);
                        redirecionarPara(
                            usuarioBanco?.role === "admin"
                                ? ROTAS.ADMIN
                                : ROTAS.HOME
                        );

                        resolve(false);
                        return;
                    }

                    resolve(true);
                }
            );
    });
}

aplicarConfiguracoesAcessibilidade(obterConfiguracoesAcessibilidade());
iniciarNavegacaoGlobal();
iniciarRouter();
