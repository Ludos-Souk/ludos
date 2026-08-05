import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    confirmPasswordReset,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "../config/firebase.js";

import Usuario from "../models/Usuario.js";

import {
    criarUsuario,
    buscarUsuarioPorId
}
from "./usuarioService.js";

export async function login(
    email,
    senha
) {

    const credencial =
        await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

    return credencial.user;

}

export async function cadastro(
    nome,
    email,
    senha
) {

    const credencial =
        await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

    const usuario =
        new Usuario(
            credencial.user.uid,
            email,
            nome,
            "cliente"
        );

    await criarUsuario(
        usuario
    );

    return usuario;

}

export async function recuperarSenha(email) {

    const response = await fetch(
        "https://ludos-password-reset.onrender.com/auth/forgot-password",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.mensagem ||
            "Não foi possível enviar o e-mail de recuperação."
        );
    }

    return data;
}

export async function resetarSenha(oobCode, senha) {
    await confirmPasswordReset(auth, oobCode, senha)
}

export async function logout() {
    await signOut(auth);
}

export function usuarioLogado() {
    return auth.currentUser;
}

export function verificarLogin() {

    return new Promise((resolve) => {

        const cancelar =
            onAuthStateChanged(
                auth,
                (usuario) => {

                    cancelar();

                    resolve(
                        usuario !== null
                    );

                }
            );

    });

}

export async function verificarAdmin() {

    const usuarioFirebase =
        auth.currentUser;

    if (!usuarioFirebase) {
        return false;
    }

    const usuarioBanco =
        await buscarUsuarioPorId(
            usuarioFirebase.uid
        );

    return usuarioBanco?.role === "admin";

}

export function obterUid() {
    return auth.currentUser?.uid;
}

export function aguardarUsuario() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (usuario) => {
            resolve(usuario);
        });
    });
}