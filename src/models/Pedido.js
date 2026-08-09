export default class Pedido {

    constructor(
        id,
        produtos,
        preco,
        desconto,
        endereco,
        formaEntrega,
        metodo,
        parcelas,
        status,
        usuarioId,
        criadoEm
    ) {
        this.id = id;
        this.produtos = produtos;
        this.preco = preco;
        this.desconto = desconto;
        this.endereco = endereco;
        this.formaEntrega = formaEntrega;
        this.metodo = metodo;
        this.parcelas = parcelas;
        this.status = status;
        this.usuarioId = usuarioId;
        this.criadoEm = criadoEm;
    }

    toFirestore() {
        return {
            produtos: this.produtos,
            preco: this.preco,
            desconto: this.desconto,
            endereco: this.endereco,
            formaEntrega: this.formaEntrega,
            metodo: this.metodo,
            parcelas: this.parcelas,
            status: this.status,
            usuarioId: this.usuarioId,
            criadoEm: this.criadoEm
        };
    }
}