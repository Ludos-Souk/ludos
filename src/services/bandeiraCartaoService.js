import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "../config/firebase.js";

const COLECAO_BANDEIRAS = "bandeiras_cartao";

const PADROES_BANDEIRAS = {
    visa: [
        /^4/
    ],
    mastercard: [
        /^5[1-5]/,
        /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/
    ],
    elo: [
        /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297)/
    ],
    american_express: [
        /^34/,
        /^37/
    ],
    diners_club: [
        /^30[0-5]/,
        /^36/,
        /^38/,
        /^39/
    ],
    hipercard: [
        /^606282/
    ],
    discover: [
        /^6011/,
        /^65/,
        /^64[4-9]/,
        /^622/
    ],
    jcb: [
        /^35(2[89]|[3-8][0-9])/
    ],
    unionpay: [
        /^62/,
        /^81/
    ],
    maestro: [
        /^5018/,
        /^5020/,
        /^5038/,
        /^5893/,
        /^6304/,
        /^6759/,
        /^676[1-3]/
    ],
    visa_electron: [
        /^4026/,
        /^417500/,
        /^4508/,
        /^4844/,
        /^4913/,
        /^4917/
    ],
    mir: [
        /^220[0-4]/
    ],
    aura: [
        /^50/
    ],
    cabal: [
        /^6042/,
        /^589657/
    ],
    bancontact: [
        /^6703/
    ],
    dankort: [
        /^5019/
    ]
};

export function identificarBandeira(numeroCartao) {

    const numero =
        numeroCartao.replace(/\D/g, "");

    if (numero.length < 6) {
        return null;
    }

    for (
        const [bandeira, padroes]
        of Object.entries(PADROES_BANDEIRAS)
    ) {

        if (
            padroes.some(
                padrao => padrao.test(numero)
            )
        ) {
            return bandeira;
        }
    }

    return null;
}

export async function buscarUrlBandeira(
    nomeBandeira
) {

    if (!nomeBandeira) {
        return null;
    }

    try {

        const referencia = doc(
            db,
            COLECAO_BANDEIRAS,
            nomeBandeira.toLowerCase()
        );

        const snapshot =
            await getDoc(referencia);

        if (!snapshot.exists()) {
            return null;
        }

        return snapshot.data().urlImagem ?? null;

    } catch (erro) {

        console.error(
            "Erro ao buscar imagem da bandeira:",
            erro
        );

        return null;
    }
}

export async function obterImagemBandeira(
    numeroCartao
) {

    const bandeira =
        identificarBandeira(numeroCartao);

    if (!bandeira) {
        return null;
    }

    return await buscarUrlBandeira(
        bandeira
    );
}