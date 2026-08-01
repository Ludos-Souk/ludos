export async function buscarCep(cep) {

    const cepLimpo =
        cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        throw new Error("CEP inválido.");
    }

    const resposta =
        await fetch(
            `https://viacep.com.br/ws/${cepLimpo}/json/`
        );

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível consultar o CEP."
        );
    }

    const dados =
        await resposta.json();

    if (dados.erro) {
        throw new Error("CEP não encontrado.");
    }

    return dados;
}