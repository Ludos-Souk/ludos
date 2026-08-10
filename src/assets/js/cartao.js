import { identificarBandeira, obterImagemBandeira } from "../../services/bandeiraCartaoService.js";

document.addEventListener('DOMContentLoaded', function () {
    const inputNumero = document.getElementById('numero-cartao');
    const inputCvv = document.getElementById('cvv');
    const brandImg = document.getElementById('card-brand-img');
    const displayNumero = document.getElementById('card-display-number');
    const displayCvv = document.getElementById('card-display-cvv');
    let consultaBandeiraAtual = 0;

    if (!inputNumero) return;

    if (brandImg) {
        brandImg.hidden = true;
        brandImg.removeAttribute('src');
    }

    // Função para formatar o número do cartão
    function formatarNumeroCartao(value) {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.match(/.{1,4}/g)?.join(' ') || '';
    }

    // Função para atualizar a exibição do número no cartão visual
    function atualizarDisplayNumero(digits) {
        if (!displayNumero) return;

        if (digits.length === 0) {
            displayNumero.textContent = '•••• •••• •••• ••••';
            return;
        }

        const padded = digits.padEnd(16, '•');
        const g1 = padded.slice(0, 4);
        const g2 = padded.slice(4, 8);
        const g3 = padded.slice(8, 12);
        const g4 = padded.slice(12, 16);

        displayNumero.textContent = `${g1} ${g2} ${g3} ${g4}`;
    }

    // Evento de input no número do cartão
    inputNumero.addEventListener('input', async function () {
        const rawValue = inputNumero.value;
        const formatted = formatarNumeroCartao(rawValue);
        inputNumero.value = formatted;

        const digits = formatted.replace(/\D/g, '');
        const idConsulta = ++consultaBandeiraAtual;
        atualizarDisplayNumero(digits);

        // Limpa bandeira se número for curto
        if (digits.length < 6) {
            if (brandImg) {
                brandImg.removeAttribute('src');
                brandImg.alt = '';
                brandImg.hidden = true;
                brandImg.classList.remove('visible');
            }
            return;
        }

        try {
            const url = await obterImagemBandeira(digits);
            const bandeira = await identificarBandeira(digits);

            if (idConsulta !== consultaBandeiraAtual) return;

            if (url && brandImg) {
                brandImg.src = url;
                brandImg.alt = bandeira ? `Bandeira ${bandeira}` : 'Bandeira do cartão';
                brandImg.hidden = false;
                brandImg.classList.add('visible');
            } else if (brandImg) {
                brandImg.removeAttribute('src');
                brandImg.alt = '';
                brandImg.hidden = true;
                brandImg.classList.remove('visible');
            }
        } catch (err) {
            if (idConsulta !== consultaBandeiraAtual) return;
            console.error('Erro ao obter bandeira:', err);
            if (brandImg) {
                brandImg.removeAttribute('src');
                brandImg.alt = '';
                brandImg.hidden = true;
                brandImg.classList.remove('visible');
            }
        }
    });

    // Evento no CVV
    if (inputCvv && displayCvv) {
        inputCvv.addEventListener('input', function () {
            const val = inputCvv.value.trim();
            displayCvv.textContent = val ? val : '***';
        });
    }
});
