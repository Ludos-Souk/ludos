import Pedido from "../models/Pedido.js";
import { db } from "../config/firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    doc,
    query,
    where
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function criarPedido(pedido) {

    const referencia =
        await addDoc(
            collection(db, "pedidos"),
            pedido.toFirestore()
        );

    return referencia.id;

}

export async function buscarPedido(id) {

    const snapshot =
        await getDoc(
            doc(db, "pedidos", id)
        );

    if (!snapshot.exists()) {
        return null;
    }

    const dados =
        snapshot.data();

    return new Pedido(
        snapshot.id,
        dados.produtos,
        dados.status,
        dados.usuarioId,
        dados.criadoEm
    );

}

export async function listarPedidos() {

    const snapshot =
        await getDocs(
            collection(db, "pedidos")
        );

    return snapshot.docs.map(documento => {

        const dados =
            documento.data();

        return new Pedido(
            documento.id,
            dados.produtos,
            dados.status,
            dados.usuarioId,
            dados.criadoEm
        );

    });

}

export async function listarPedidosUsuario(
    usuarioId
) {

    const consulta =
        query(
            collection(db, "pedidos"),
            where(
                "usuarioId",
                "==",
                usuarioId
            )
        );

    const snapshot =
        await getDocs(consulta);

    return snapshot.docs.map(documento => {

        const dados =
            documento.data();

        return new Pedido(
            documento.id,
            dados.produtos,
            dados.status,
            dados.usuarioId,
            dados.criadoEm
        );

    });

}

export async function atualizarStatusPedido(
    id,
    status
) {

    await updateDoc(
        doc(db, "pedidos", id),
        {
            status: status
        }
    );

}