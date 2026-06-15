import Usuario from "../models/Usuario.js";
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
        dados.role
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
            dados.role
        );
        
    });

}