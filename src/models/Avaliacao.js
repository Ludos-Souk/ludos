import { buscarUsuarioPorId } from "../services/usuarioService.js";

export default class Avaliacao {

    constructor(
        id,
        comentario,
        criadoEm,
        nota,
        produtoId,
        usuarioId
    ) {
        this.id = id;
        this.comentario = comentario;
        this.criadoEm = criadoEm;
        this.nota = nota;
        this.produtoId = produtoId;
        this.usuarioId = usuarioId;
    }

    toFirestore() {

        return {
            comentario: this.comentario,
            criadoEm: this.criadoEm,
            nota: this.nota,
            produtoId: this.produtoId,
            usuarioId: this.usuarioId
        };

    }

    getNomeUsuario() {
        return buscarUsuarioPorId(this.usuarioId).then(usuario => usuario?.nome ?? "Usuário");
    }
}