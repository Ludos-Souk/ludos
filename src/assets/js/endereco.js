if (window.lucide) {
    window.lucide.createIcons();
}

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

const btnVoltar = document.querySelector('.btn-back');

if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
        history.back();
    });
}

const inputs = document.querySelectorAll('.input-wrapper input');

inputs.forEach(input => {
    const btnClear = input.parentElement.querySelector('.btn-clear-input');
    
    if (btnClear) {
        input.addEventListener('input', () => {
            if (input.value.length > 0) {
                btnClear.classList.add('visible'); 
            } else {
                btnClear.classList.remove('visible'); 
            }
        });

        
        btnClear.addEventListener('click', () => {
            input.value = ''; 
            btnClear.classList.remove('visible'); 
            input.focus(); 
        });
    }
});

async function carregarEstados() {
    const selectUf = document.getElementById('uf-select');
    
    if (!selectUf) return;

    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const estados = await response.json();

        estados.sort((a, b) => a.sigla.localeCompare(b.sigla));

        const fragment = document.createDocumentFragment();

        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.sigla;
            fragment.appendChild(option);
        });

        selectUf.appendChild(fragment);

    } catch (erro) {
        console.error("Erro ao buscar os estados no IBGE:", erro);
        selectUf.innerHTML += '<option value="SP">SP</option><option value="RJ">RJ</option>';
    }
}

carregarEstados();