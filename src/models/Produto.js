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

}