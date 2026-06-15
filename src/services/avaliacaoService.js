import Avaliacao from "../models/Avaliacao.js";

import { db } from "../config/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function criarAvaliacao(
    avaliacao
) {

    const referencia =
        await addDoc(
            collection(
                db,
                "avaliacoes"
            ),
            avaliacao.toFirestore()
        );

    return referencia.id;

}

export async function listarAvaliacoesProduto(
    produtoId
) {

    const consulta =
        query(
            collection(
                db,
                "avaliacoes"
            ),
            where(
                "produtoId",
                "==",
                produtoId
            )
        );

    const snapshot =
        await getDocs(
            consulta
        );

    return snapshot.docs.map(documento => {

        const dados =
            documento.data();

        return new Avaliacao(
            documento.id,
            dados.comentario,
            dados.criadoEm,
            dados.nota,
            dados.produtoId,
            dados.usuarioId
        );

    });

}

export async function calcularNotaMedia(
    produtoId
) {

    const avaliacoes =
        await listarAvaliacoesProduto(
            produtoId
        );

    if (
        avaliacoes.length === 0
    ) {
        return 0;
    }

    const soma =
        avaliacoes.reduce(
            (total, avaliacao) =>
                total + avaliacao.nota,
            0
        );

    return (
        soma /
        avaliacoes.length
    );

}