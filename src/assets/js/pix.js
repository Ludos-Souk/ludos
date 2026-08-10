import { ROTAS } from "../../config/rotas.js";
import Pedido from "../../models/Pedido.js";
import { criarPedido } from "../../services/pedidoService.js";
import { aguardarUsuario } from "../../services/authService.js";
import { removerProduto } from "../../services/carrinhoService.js";
import { reduzirEstoqueProduto } from "../../services/produtoService.js";

function formatarMoeda(valor) {
    const numero = Number(valor);
    const valorSeguro = Number.isFinite(numero) ? numero : 0;
    return valorSeguro.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function calcularTotalPedido(payload) {
    const preco = Number(payload?.preco);
    const desconto = Number(payload?.desconto);
    const precoSeguro = Number.isFinite(preco) ? Math.max(0, preco) : 0;
    const descontoSeguro = Number.isFinite(desconto) ? Math.max(0, desconto) : 0;
    return Math.max(0, precoSeguro - descontoSeguro);
}

function copiarPix() {
    const codigo = document.getElementById('pix-code')?.textContent || '';
    if (!codigo) return;

    navigator.clipboard.writeText(codigo).catch(() => {});
}

async function processarPedidoPix(payload) {
    const usuario = await aguardarUsuario();
    if (!usuario?.uid) {
        window.location.href = ROTAS.ERRO_PEDIDO;
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
        window.location.href = ROTAS.SUCESSO_PEDIDO;
    } catch (erro) {
        console.error('Erro ao criar pedido Pix:', erro);
        window.location.href = ROTAS.ERRO_PEDIDO;
    }
}

function iniciarSimulacaoPix(payload) {
    const alertTexto = document.querySelector('.pix-alert__text');
    const statusNota = document.querySelector('.pix-card__note');
    const pixCodeElement = document.getElementById('pix-code');
    const valorExibido = formatarMoeda(calcularTotalPedido(payload));

    if (alertTexto) {
        alertTexto.replaceChildren();
        alertTexto.appendChild(document.createTextNode('Falta pouco! Pague '));
        const destaque = document.createElement('strong');
        destaque.textContent = valorExibido;
        alertTexto.appendChild(destaque);
        alertTexto.appendChild(document.createTextNode(' via Pix para concluir sua compra.'));
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
        window.location.href = ROTAS.ERRO_PEDIDO;
        return;
    }

    const btnPedidos = document.querySelector('.btn-pix-pedidos');
    if (btnPedidos) {
        btnPedidos.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = ROTAS.CARRINHO;
        });
    }

    iniciarSimulacaoPix(payload);
});
