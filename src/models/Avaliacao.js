import { buscarUsuarioPorId } from "../services/usuarioService.js";
import { auth } from "../config/firebase.js";

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
        // O documento de usuário também contém e-mail e endereços. Para não
        // expor esses dados, as regras permitem somente a leitura do próprio
        // perfil; avaliações de terceiros usam um nome público neutro.
        if (auth.currentUser?.uid !== this.usuarioId) {
            return Promise.resolve("Cliente Ludos");
        }
        return buscarUsuarioPorId(this.usuarioId).then(usuario => usuario?.nome ?? "Usuário");
    }
}