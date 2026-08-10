import { db } from "../config/firebase.js";
import {
    addDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function cadastrarCupom(cupom) {
    const codigoNormalizado = cupom.codigo.trim().toUpperCase();
    const consulta = query(
        collection(db, "cupons"),
        where("codigo", "==", codigoNormalizado)
    );
    const existentes = await getDocs(consulta);

    if (!existentes.empty) {
        throw new Error("Já existe um cupom com esse código.");
    }

    cupom.codigo = codigoNormalizado;
    const referencia = await addDoc(
        collection(db, "cupons"),
        cupom.toFirestore()
    );
    return referencia.id;
}
