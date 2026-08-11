export default class Avaliacao {

    constructor(
        id,
        comentario,
        criadoEm,
        nota,
        produtoId,
        usuarioId,
        nomeUsuario = null
    ) {
        this.id = id;
        this.comentario = comentario;
        this.criadoEm = criadoEm;
        this.nota = nota;
        this.produtoId = produtoId;
        this.usuarioId = usuarioId;
        this.nomeUsuario = nomeUsuario;
    }

    toFirestore() {
        const dados = {
            comentario: this.comentario,
            criadoEm: this.criadoEm,
            nota: this.nota,
            produtoId: this.produtoId,
            usuarioId: this.usuarioId
        };

        console.log(this.nomeUsuario)
        if (this.nomeUsuario) dados.nomeUsuario = this.nomeUsuario;
        return dados;
    }

    getNomeUsuario() {
        return this.nomeUsuario || "Cliente Ludos";
    }
}