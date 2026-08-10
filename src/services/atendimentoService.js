import { db } from "../config/firebase.js";
import {
    addDoc,
    collection
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function criarSolicitacaoAtendimento({ usuarioId, email, tipo, duvida = "" }) {
    if (!usuarioId) throw new Error("Não foi possível identificar o usuário.");
    if (!email) throw new Error("O usuário não possui um e-mail vinculado.");
    if (!['texto', 'libras'].includes(tipo)) throw new Error("Selecione uma forma de atendimento válida.");
    if (tipo === 'texto' && !String(duvida).trim()) throw new Error("Digite sua dúvida antes de enviar.");

    const referencia = await addDoc(collection(db, "atendimentos"), {
        usuarioId,
        email,
        tipo,
        duvida: tipo === 'texto' ? String(duvida).trim() : "",
        status: "Pendente",
        criadoEm: new Date().toISOString()
    });
    return referencia.id;
}
