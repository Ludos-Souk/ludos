import Usuario from "../models/Usuario.js";
import Endereco from "../models/Endereco.js";
import { db } from "../config/firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    doc
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function buscarUsuarioPorId(uid) {

    const referencia =
        doc(db, "usuarios", uid);

    const snapshot =
        await getDoc(referencia);

    if (!snapshot.exists()) {
        return null;
    }

    const dados =
        snapshot.data();

    return new Usuario(
        snapshot.id,
        dados.email,
        dados.nome,
        dados.role,
        dados.imagemUrl || null
    );

}

export async function criarUsuario(usuario) {

    await setDoc(
        doc(
            db,
            "usuarios",
            usuario.id
        ),
        usuario.toFirestore()
    );

}

export async function atualizarUsuario(
    uid,
    usuario
) {

    const referencia =
        doc(
            db,
            "usuarios",
            uid
        );

    await updateDoc(
        referencia,
        {
            email: usuario.email,
            nome: usuario.nome,
            role: usuario.role
        }
    );

}

export async function atualizarFotoPerfil(uid, imagemUrl) {
    if (!uid || !imagemUrl) {
        throw new Error("Usuário e URL da imagem são obrigatórios.");
    }

    await updateDoc(
        doc(db, "usuarios", uid),
        { imagemUrl }
    );

    return imagemUrl;
}

export async function listarUsuarios() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "usuarios"
            )
        );

    return snapshot.docs.map(documento => {

        const dados =
            documento.data();

        return new Usuario(
            documento.id,
            dados.email,
            dados.nome,
            dados.role,
            dados.imagemUrl || null
        );
        
    });

}


export async function listarEnderecos(uid) {

    const referencia =
        doc(
            db,
            "usuarios",
            uid
        );

    const snapshot =
        await getDoc(referencia);

    if (!snapshot.exists()) {
        return [];
    }

    const dados =
        snapshot.data();

    // Usuário ainda não possui endereços
    if (!dados.enderecos) {
        return [];
    }

    return dados.enderecos.map(
        dadosEndereco => {

            return new Endereco(
                dadosEndereco.etiqueta,
                dadosEndereco.cep,
                dadosEndereco.rua,
                dadosEndereco.uf,
                dadosEndereco.cidade,
                dadosEndereco.bairro,
                dadosEndereco.numero,
                dadosEndereco.complemento,
                dadosEndereco.informacoesAdicionais,
                dadosEndereco.nome,
                dadosEndereco.email,
                dadosEndereco.id
            );

        }
    );
}


export async function buscarEnderecoPorId(
    uid,
    enderecoId
) {

    const enderecos =
        await listarEnderecos(uid);

    return enderecos.find(
        endereco =>
            endereco.id === enderecoId
    ) || null;
}


export async function adicionarEndereco(
    uid,
    endereco
) {

    const referencia =
        doc(
            db,
            "usuarios",
            uid
        );

    const snapshot =
        await getDoc(referencia);

    if (!snapshot.exists()) {
        throw new Error(
            "Usuário não encontrado."
        );
    }

    const dados =
        snapshot.data();

    const enderecos =
        dados.enderecos || [];

    enderecos.push(
        endereco.toFirestore()
    );

    await updateDoc(
        referencia,
        {
            enderecos: enderecos
        }
    );

    return endereco;
}


export async function atualizarEndereco(
    uid,
    enderecoId,
    endereco
) {

    const referencia =
        doc(
            db,
            "usuarios",
            uid
        );

    const snapshot =
        await getDoc(referencia);

    if (!snapshot.exists()) {
        throw new Error(
            "Usuário não encontrado."
        );
    }

    const dados =
        snapshot.data();

    const enderecos =
        dados.enderecos || [];

    const indice =
        enderecos.findIndex(
            endereco =>
                endereco.id === enderecoId
        );

    if (indice === -1) {
        throw new Error(
            "Endereço não encontrado."
        );
    }

    // Garante que o ID original seja mantido
    endereco.id = enderecoId;

    enderecos[indice] =
        endereco.toFirestore();

    await updateDoc(
        referencia,
        {
            enderecos: enderecos
        }
    );

    return endereco;
}


export async function removerEndereco(
    uid,
    enderecoId
) {

    const referencia =
        doc(
            db,
            "usuarios",
            uid
        );

    const snapshot =
        await getDoc(referencia);

    if (!snapshot.exists()) {
        throw new Error(
            "Usuário não encontrado."
        );
    }

    const dados =
        snapshot.data();

    const enderecos =
        dados.enderecos || [];

    const novosEnderecos =
        enderecos.filter(
            endereco =>
                endereco.id !== enderecoId
        );

    if (
        novosEnderecos.length ===
        enderecos.length
    ) {
        throw new Error(
            "Endereço não encontrado."
        );
    }

    await updateDoc(
        referencia,
        {
            enderecos: novosEnderecos
        }
    );

}
