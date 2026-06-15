import { db } from "../config/firebase.js";

import Produto from "../models/Produto.js";


import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


export async function listarProdutos() {

    const snapshot =
        await getDocs(
            collection(db, "produtos")
        );

    return snapshot.docs.map(documento => {

        const dados = documento.data();

        return new Produto(
            documento.id,
            dados.ativo,
            dados.criadoEm,
            dados.descricao,
            dados.estoque,
            dados.franquia,
            dados.imagem,
            dados.nome,
            dados.preco
        );

    });

}

export async function buscarProdutoPorId(id) {

    const referencia =
        doc(db, "produtos", id);

    const snapshot =
        await getDoc(referencia);

    if (!snapshot.exists()) {
        return null;
    }

    const dados = snapshot.data();

    return new Produto(
        snapshot.id,
        dados.ativo,
        dados.criadoEm,
        dados.descricao,
        dados.estoque,
        dados.franquia,
        dados.imagem,
        dados.nome,
        dados.preco
    );

}

export async function buscarProdutosAtivos() {

    const consulta =
        query(
            collection(db, "produtos"),
            where("ativo", "==", true)
        );

    const snapshot =
        await getDocs(consulta);

    return snapshot.docs.map(documento => {

        const dados = documento.data();

        return new Produto(
            documento.id,
            dados.ativo,
            dados.criadoEm,
            dados.descricao,
            dados.estoque,
            dados.franquia,
            dados.imagem,
            dados.nome,
            dados.preco
        );

    });

}

export async function cadastrarProduto(produto) {

    const referencia =
        await addDoc(
            collection(db, "produtos"),
            produto.toFirestore()
        );

    return referencia.id;

}

export async function atualizarProduto(
    id,
    produto
) {

    const referencia =
        doc(db, "produtos", id);

    await updateDoc(
        referencia,
        {
            ativo: produto.ativo,
            descricao: produto.descricao,
            estoque: produto.estoque,
            franquia: produto.franquia,
            imagem: produto.imagem,
            nome: produto.nome,
            preco: produto.preco
        }
    );

}

export async function desativarProduto(id) {

    const referencia =
        doc(db, "produtos", id);

    await updateDoc(
        referencia,
        {
            ativo: false
        }
    );

}

export async function excluirProduto(id) {

    await deleteDoc(
        doc(
            db,
            "produtos",
            id
        )
    );

}