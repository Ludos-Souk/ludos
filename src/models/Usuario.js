export default class Usuario {

    constructor(
        id,
        email,
        nome,
        role
    ) {
        this.id = id;
        this.email = email;
        this.nome = nome;
        this.role = role;
    }

    toFirestore() {
        return {
            email: this.email,
            nome: this.nome,
            role: this.role
        };
    }
}