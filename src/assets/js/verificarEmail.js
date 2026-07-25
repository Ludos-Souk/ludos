const formulario = document.getElementById("verificarEmail-form")
const botao = formulario.querySelector('button[type="submit"]');

formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    window.location.href = "mailto:";
})