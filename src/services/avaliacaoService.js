import Avaliacao from "../models/Avaliacao.js";

import { db } from "../config/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    writeBatch,
    doc
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

export async function criarAvaliacoesPedido(avaliacoes, pedidoId) {
    if (!pedidoId || !Array.isArray(avaliacoes) || avaliacoes.length === 0) {
        throw new Error("Dados da avaliação inválidos.");
    }

    const lote = writeBatch(db);

    avaliacoes.forEach(avaliacao => {
        const referencia = doc(collection(db, "avaliacoes"));
        lote.set(referencia, avaliacao.toFirestore());
    });

    lote.update(
        doc(db, "pedidos", pedidoId),
        { avaliado: true }
    );

    await lote.commit();
}
