import Pedido from "../../models/Pedido.js";
import { criarPedido } from "../../services/pedidoService.js";
import { aguardarUsuario } from "../../services/authService.js";
import { removerProduto } from "../../services/carrinhoService.js";
import { reduzirEstoqueProduto } from "../../services/produtoService.js";

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function copiarPix() {
    const codigo = document.getElementById('pix-code')?.textContent || '';
    if (!codigo) return;

    navigator.clipboard.writeText(codigo).catch(() => {});
}

async function processarPedidoPix(payload) {
    const usuario = await aguardarUsuario();
    if (!usuario?.uid) {
        window.location.href = 'erroPedido.html';
        return;
    }

    try {
        const pedido = new Pedido(
            null,
            payload.produtos,
            payload.preco,
            payload.desconto,
            payload.endereco,
            payload.formaEntrega,
            payload.metodo,
            payload.parcelas,
            'Pendente',
            usuario.uid,
            new Date().toISOString()
        );

        await criarPedido(pedido);

        await Promise.all(payload.produtos.map(item => {
            if (item?.produtoId && item.quantidade > 0) {
                return reduzirEstoqueProduto(item.produtoId, item.quantidade);
            }
            return Promise.resolve();
        }));

        payload.produtos.forEach(item => {
            if (item?.produtoId) {
                removerProduto(item.produtoId);
            }
        });

        sessionStorage.removeItem('produtosSelecionados');
        window.location.href = 'sucessoPedido.html';
    } catch (erro) {
        console.error('Erro ao criar pedido Pix:', erro);
        window.location.href = 'erroPedido.html';
    }
}

function iniciarSimulacaoPix(payload) {
    const alertTexto = document.querySelector('.pix-alert__text');
    const statusNota = document.querySelector('.pix-card__note');
    const pixCodeElement = document.getElementById('pix-code');
    const valorExibido = formatarMoeda(payload.preco || 0);

    if (alertTexto) {
        alertTexto.innerHTML = `Falta pouco! Pague <strong>${valorExibido}</strong> via Pix para concluir sua compra.`;
    }

    if (pixCodeElement) {
        pixCodeElement.textContent = payload.pixCode || '00020126330014BR.GOV.BCB.PIX0114...';
    }

    let contador = 20;
    if (statusNota) {
        statusNota.textContent = `Aguardando confirmação do Pix... ${contador}s`;
    }

    const intervalo = setInterval(() => {
        contador -= 1;
        if (statusNota) {
            statusNota.textContent = contador > 0
                ? `Aguardando confirmação do Pix... ${contador}s`
                : 'Finalizando pedido...';
        }

        if (contador <= 0) {
            clearInterval(intervalo);
            processarPedidoPix(payload);
        }
    }, 1000);
}

window.copiarPix = copiarPix;

window.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const payloadJson = sessionStorage.getItem('pedidoFinalizacao');
    const payload = payloadJson ? JSON.parse(payloadJson) : null;
    if (!payload) {
        window.location.href = 'erroPedido.html';
        return;
    }

    const btnPedidos = document.querySelector('.btn-pix-pedidos');
    if (btnPedidos) {
        btnPedidos.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'carrinho.html';
        });
    }

    iniciarSimulacaoPix(payload);
});