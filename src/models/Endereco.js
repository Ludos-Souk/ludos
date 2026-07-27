export default class Endereco {

    constructor(
        etiqueta,
        cep,
        uf,
        cidade,
        bairro,
        numero,
        complemento,
        informacoesAdicionais,
        nome,
        email,
        id = crypto.randomUUID()
    ) {
        this.id = id;
        this.etiqueta = etiqueta;
        this.cep = cep;
        this.uf = uf;
        this.cidade = cidade;
        this.bairro = bairro;
        this.numero = numero;
        this.complemento = complemento;
        this.informacoesAdicionais = informacoesAdicionais;
        this.nome = nome;
        this.email = email;
    }

    toFirestore() {
        return {
            id: this.id,
            etiqueta: this.etiqueta,
            cep: this.cep,
            uf: this.uf,
            cidade: this.cidade,
            bairro: this.bairro,
            numero: this.numero,
            complemento: this.complemento,
            informacoesAdicionais: this.informacoesAdicionais,
            nome: this.nome,
            email: this.email
        };
    }
}