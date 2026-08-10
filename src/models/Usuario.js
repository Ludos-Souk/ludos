export default class Usuario {

    constructor(
        id,
        email,
        nome,
        role,
        imagemUrl = null
    ) {
        this.id = id;
        this.email = email;
        this.nome = nome;
        this.role = role;
        this.imagemUrl = imagemUrl;
    }

    toFirestore() {
        const dados = {
            email: this.email,
            nome: this.nome,
            role: this.role
        };

        if (this.imagemUrl) {
            dados.imagemUrl = this.imagemUrl;
        }

        return dados;
    }
}
