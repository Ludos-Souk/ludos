import { cadastro } from "../../services/authService.js";
import { auth } from "../../config/firebase.js";

const formulario = document.getElementById("cadastro-form");
const botao = formulario.querySelector('button[type="submit"]');
var erros = 0

formulario.addEventListener("submit", async function(event) {
    event.preventDefault()
    limparTodosErros()
    botao.disabled = true
    botao.textContent = "Cadastrando..."

    var nome = document.getElementById("nome").value.trim();
    var email = document.getElementById("email").value.trim();
    var senha = document.getElementById("senha").value.trim();

    if (nome === "") {
        mostrarErro("erro-nome", "Preencha o campo de nome.", "nome")
    }
    if (email === "") {
        mostrarErro("erro-email", "Preencha o campo de email.", "email")
    }
    if (senha === "") {
        mostrarErro("erro-senha", "Preencha o campo de senha.", "senha")
    }
    if (senha?.length < 6) {
        mostrarErro("erro-senha", "A senha deve conter mais que 6 caracteres.", "senha")
    }

    if (erros > 0) {
        botao.disabled = false;
        botao.textContent = "Criar conta";
        return;
    }

    try {
        await cadastro(nome, email, senha)

        alert("Ir para tela principal - home")
        // Implementar depois essa parte
    } catch (erro) {
        console.log(erro.message);
        botao.disabled = false;
        botao.textContent = "Criar conta"
    }
});


function mostrarErro(id, mensagem, idInput){
    const erro = document.getElementById(id);
    erro.textContent = mensagem;
    erro.classList.add("show");
    document.getElementById(idInput).parentElement.classList.add("input-group--error");
    erros += 1
}

function limparErro(id, idInput){
    const erro = document.getElementById(id);
    erro.textContent = "";
    erro.classList.remove("show")
    document.getElementById(idInput).parentElement.classList.remove("input-group--error")
}

function limparTodosErros(){
    erros = 0
    limparErro("erro-nome", "nome")
    limparErro("erro-email", "email")
    limparErro("erro-senha", "senha")
}