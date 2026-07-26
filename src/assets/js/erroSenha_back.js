const formulario = document.getElementById("erroSenha-form");
const botao = formulario.querySelector('button[type="submit"]');

formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    window.location.href = "esqueciSenha.html";
})