const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;

    recognition.onstart = function() {
        btnMicrofone.style.color = 'blue';
    };

    recognition.onresult = function(event) {
        const textoFalado = event.results[0][0].transcript;
        inputBusca.value = textoFalado;
    };

    recognition.onend = function() {
        btnMicrofone.style.color = '#888';
    };

    recognition.onerror = function(event) {
        alert("Erro no reconhecimento:" + event.error);
    };

    btnMicrofone.addEventListener('click', function() {
        recognition.start();
    });

} else {
    alert("Seu navegador não tem suporte para pesquisa por voz.");
}

function fecharBanner() {
    const banner = document.getElementById('promo-banner');

    banner.style.opacity = "0";
    banner.style.pointerEvents = "none";
    banner.style.boxShadow = "none";
    banner.style.background = "transparent";
}