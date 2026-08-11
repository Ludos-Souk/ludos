import { identificarBandeira, obterImagemBandeira } from "../../services/bandeiraCartaoService.js";
import { configurarPesquisaCabecalho, debounce } from "./utils/ui.js";

document.addEventListener('DOMContentLoaded', function () {
    configurarPesquisaCabecalho({
        aoPesquisar: (busca) => {
            if (!busca) return;
            sessionStorage.setItem("href-pesquisa", busca);
            window.location.href = "home.html";
        }
    });

    const inputNumero = document.getElementById('numero-cartao');
    const inputCvv = document.getElementById('cvv');
    const inputVencimento = document.getElementById('vencimento');
    const brandImg = document.getElementById('card-brand-img');
    const displayNumero = document.getElementById('card-display-number');
    const displayCvv = document.getElementById('card-display-cvv');
    const feedbackBandeira = document.getElementById('card-brand-feedback');
    let consultaBandeiraAtual = 0;

    if (!inputNumero) return;

    if (inputVencimento) {
        const hoje = new Date();
        const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
        inputVencimento.min = `${hoje.getFullYear()}-${mesAtual}`;
    }

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

    // Consulta de bandeira com debounce
    const consultarBandeira = debounce(async (digits, idConsulta) => {
        try {
            if (feedbackBandeira) {
                feedbackBandeira.textContent = 'Identificando bandeira...';
                feedbackBandeira.classList.remove('error');
            }
            const [url, bandeira] = await Promise.all([
                obterImagemBandeira(digits),
                identificarBandeira(digits)
            ]);

            if (idConsulta !== consultaBandeiraAtual) return;

            if (url && brandImg) {
                brandImg.src = url;
                brandImg.alt = bandeira ? `Bandeira ${bandeira}` : 'Bandeira do cartão';
                brandImg.hidden = false;
                brandImg.classList.add('visible');
                if (feedbackBandeira) feedbackBandeira.textContent = `Bandeira ${bandeira} identificada.`;
            } else if (brandImg) {
                brandImg.removeAttribute('src');
                brandImg.alt = '';
                brandImg.hidden = true;
                brandImg.classList.remove('visible');
                if (feedbackBandeira) feedbackBandeira.textContent = 'Bandeira ainda não identificada.';
            }
        } catch (err) {
            if (idConsulta !== consultaBandeiraAtual) return;
            console.error('Erro ao obter bandeira:', err);
            if (feedbackBandeira) {
                feedbackBandeira.textContent = 'Não foi possível identificar a bandeira agora.';
                feedbackBandeira.classList.add('error');
            }
            if (brandImg) {
                brandImg.removeAttribute('src');
                brandImg.alt = '';
                brandImg.hidden = true;
                brandImg.classList.remove('visible');
            }
        }
    }, 300);

    // Evento de input no número do cartão
    inputNumero.addEventListener('input', function () {
        const rawValue = inputNumero.value;
        const formatted = formatarNumeroCartao(rawValue);
        inputNumero.value = formatted;

        const digits = formatted.replace(/\D/g, '');
        const idConsulta = ++consultaBandeiraAtual;
        atualizarDisplayNumero(digits);

        // Limpa bandeira se número for curto
        if (digits.length < 6) {
            if (feedbackBandeira) {
                feedbackBandeira.textContent = '';
                feedbackBandeira.classList.remove('error');
            }
            if (brandImg) {
                brandImg.removeAttribute('src');
                brandImg.alt = '';
                brandImg.hidden = true;
                brandImg.classList.remove('visible');
            }
            return;
        }

        consultarBandeira(digits, idConsulta);
    });

    // Evento no CVV
    if (inputCvv && displayCvv) {
        inputCvv.addEventListener('input', function () {
            const val = inputCvv.value.trim();
            displayCvv.textContent = val ? val : '***';
        });
    }
});
