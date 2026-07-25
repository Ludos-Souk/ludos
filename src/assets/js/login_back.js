import { login } from "../../services/authService.js";

const formulario = document.getElementById("login-form")
const botao = formulario.querySelector('button[type="submit"]')
var erros = 0

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();
    limparTodosErros();
    botao.disabled = true;
    botao.textContent = "Entrando...";

    var email = document.getElementById("email").value.trim();
    var senha = document.getElementById("senha").value.trim();

    if (email === "") {
        mostrarErro("erro-email", "Preencha o campo de email.", "email")
    }
    if (senha === "") {
        mostrarErro("erro-senha", "Preencha o campo de senha.", "senha")
    }

    if (erros > 0) {
        botao.disabled = false;
        botao.textContent = "Entrar";
        return;
    }

    try {
        await login(email, senha)

        alert("Ir para tela principal - home")
        // Implementar depois essa parte
    } catch (erro) {
        switch (erro.code) {
            case "auth/invalid-credential":
                mostrarErro(
                    "erro-email",
                    "Email ou senha incorretos.",
                    "email"
                );
                break;
            case "auth/invalid-email":
                mostrarErro(
                    "erro-email",
                    "Digite um email válido.",
                    "email"
                );
                break;
            case "auth/user-disabled":
            mostrarErro(
                "erro-email",
                "Esta conta foi desativada.",
                "email"
            );
            break;
            case "auth/too-many-requests":
                mostrarErro(
                    "erro-email",
                    "Muitas tentativas. Aguarde alguns minutos.",
                    "email"
                );
                break;
            default:
                mostrarErro(
                    "erro-email",
                    "Não foi possível realizar o login.",
                    "email"
                );
            }
        botao.disabled = false;
        botao.textContent = "Entrar"
    }
})

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
    limparErro("erro-email", "email")
    limparErro("erro-senha", "senha")
}