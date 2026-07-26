/**
 * Gerencia a exibição de erros de um formulário.
 * @param {Array<[string, string]>} campos - pares [idDoErro, idDoInput] que serão limpos por limparTodosErros()
 */
export function criarGerenciadorErros(campos) {
    let erros = 0;

    function mostrarErro(id, mensagem, idInput) {
        const erro = document.getElementById(id);
        erro.textContent = mensagem;
        erro.classList.add("show");
        document.getElementById(idInput).parentElement.classList.add("input-group--error");
        erros += 1;
    }

    function limparErro(id, idInput) {
        const erro = document.getElementById(id);
        erro.textContent = "";
        erro.classList.remove("show");
        document.getElementById(idInput).parentElement.classList.remove("input-group--error");
    }

    function limparTodosErros() {
        erros = 0;
        campos.forEach(([idErro, idInput]) => limparErro(idErro, idInput));
    }

    function temErros() {
        return erros > 0;
    }

    return { mostrarErro, limparErro, limparTodosErros, temErros };
}

/**
 * Controla o texto e o estado disabled do botão de submit durante o envio.
 * @param {HTMLButtonElement} botao
 * @param {string} textoPadrao - texto do botão em repouso (ex: "Entrar")
 */
export function criarControleBotao(botao, textoPadrao) {
    function definirCarregando(textoCarregando) {
        botao.disabled = true;
        botao.textContent = textoCarregando;
    }

    function restaurar() {
        botao.disabled = false;
        botao.textContent = textoPadrao;
    }

    return { definirCarregando, restaurar };
}