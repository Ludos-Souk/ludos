import { db } from "../config/firebase.js";
import {
    addDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import Cupom from "../models/Cupom.js";

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

export async function buscarCupomValidoPorCodigo(codigo) {
    const codigoNormalizado = String(codigo || "").trim().toUpperCase();
    if (!codigoNormalizado) throw new Error("Informe o código do cupom.");

    const consulta = query(
        collection(db, "cupons"),
        where("codigo", "==", codigoNormalizado),
        where("ativo", "==", true)
    );
    const resultado = await getDocs(consulta);
    if (resultado.empty) throw new Error("Cupom não encontrado. Confira o código informado.");

    const documento = resultado.docs[0];
    const dados = documento.data();
    if (dados.ativo === false) throw new Error("Este cupom não está ativo.");

    const validade = dados.validade?.toDate?.() ||
        (dados.validade ? new Date(`${dados.validade}T23:59:59`) : null);
    if (validade && (!Number.isFinite(validade.getTime()) || validade < new Date())) {
        throw new Error("Este cupom está vencido.");
    }

    const desconto = Number(dados.desconto);
    if (!Number.isFinite(desconto) || desconto <= 0 || desconto > 100) {
        throw new Error("O percentual deste cupom é inválido.");
    }

    return new Cupom(
        documento.id,
        dados.codigo,
        desconto,
        dados.validade,
        dados.ativo,
        dados.criadoEm
    );
}
