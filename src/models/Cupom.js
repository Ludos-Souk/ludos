export default class Cupom {
    constructor(
        id,
        codigo,
        desconto,
        validade,
        ativo = true,
        criadoEm = new Date().toISOString()
    ) {
        this.id = id;
        this.codigo = codigo;
        this.desconto = desconto;
        this.validade = validade;
        this.ativo = ativo;
        this.criadoEm = criadoEm;
    }

    toFirestore() {
        return {
            codigo: this.codigo,
            desconto: this.desconto,
            validade: this.validade,
            ativo: this.ativo,
            criadoEm: this.criadoEm
        };
    }
}
