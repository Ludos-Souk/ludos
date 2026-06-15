export default class Produto {

    constructor(
        id,
        ativo,
        criadoEm,
        descricao,
        estoque,
        franquia,
        imagem,
        nome,
        preco,
    ) {
        this.id = id;
        this.ativo = ativo;
        this.criadoEm = criadoEm;
        this.descricao = descricao;
        this.estoque = estoque;
        this.franquia = franquia;
        this.imagem = imagem;
        this.nome = nome;
        this.preco = preco;
    }

    toFirestore() {
        return {
            ativo: this.ativo,
            criadoEm: this.criadoEm,
            descricao: this.descricao,
            estoque: this.estoque,
            franquia: this.franquia,
            imagem: this.imagem,
            nome: this.nome,
            preco: this.preco
        };
    }
}