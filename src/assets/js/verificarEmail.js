const formulario = document.getElementById("verificarEmail-form");
const botao = formulario.querySelector('button[type="submit"]');

formulario.addEventListener("submit", function (event) {
    event.preventDefault();
    window.location.href = "mailto:";
});
