export default class Pedido {

    constructor(
        id,
        produtos,
        status,
        usuarioId,
        criadoEm
    ) {
        this.id = id;
        this.produtos = produtos;
        this.status = status;
        this.usuarioId = usuarioId;
        this.criadoEm = criadoEm;
    }

}