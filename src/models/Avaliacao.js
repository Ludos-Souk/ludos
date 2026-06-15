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

}