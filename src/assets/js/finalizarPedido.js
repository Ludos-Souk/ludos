import { ROTAS } from "../../config/rotas.js";
import { buscarProdutoPorId, reduzirEstoqueProduto } from "../../services/produtoService.js";
import Pedido from "../../models/Pedido.js";
import { criarPedido, usuarioJaFezPedido } from "../../services/pedidoService.js";
import { aguardarUsuario, obterUid } from "../../services/authService.js";
import { listarEnderecos, buscarEnderecoPorId } from "../../services/usuarioService.js";
import {
    existeConfiguracao,
    obterConfiguracao,
    salvarConfiguracao
} from "../../services/configuracoesService.js";
import { removerProduto } from "../../services/carrinhoService.js";
import { buscarCupomValidoPorCodigo } from "../../services/cupomService.js";
import { mostrarFeedbackGlobal, salvarFeedbackNavegacao } from "./utils/asyncFeedback.js";
import { configurarPesquisaCabecalho } from "./utils/ui.js";

let produtosDoResumo = [];
let primeiraCompraDoResumo = false;
let cupomAplicado = null;

document.addEventListener('DOMContentLoaded', async () => {

    if (window.lucide) {
        lucide.createIcons();
    }

    try {
        await configurarEndereco();
    } catch (erro) {
        console.error("Não foi possível configurar o endereço:", erro);
        mostrarFeedbackGlobal("Não foi possível carregar o endereço padrão.", "error");
    }

    // Inicializa busca do cabeçalho (submit -> redireciona para home com termo)
    const inputBusca = document.getElementById('search-input');
    configurarPesquisaCabecalho({
        input: inputBusca,
        aoPesquisar: (busca) => {
            if (!busca) return;
            sessionStorage.setItem('href-pesquisa', busca);
            window.location.href = ROTAS.HOME;
        }
    });

    let ehPrimeiraCompra = false;
    try {
        ehPrimeiraCompra = await verificarPrimeiraCompra();
    } catch (erro) {
        console.error("Não foi possível verificar a promoção:", erro);
        mostrarFeedbackGlobal("Não foi possível validar o desconto de primeira compra.", "error");
    }
    await carregarProdutosSelecionados(ehPrimeiraCompra);
    configurarCupomCheckout();

    const deliveryBtns = document.querySelectorAll('.delivery-toggle button');

    deliveryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            deliveryBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            atualizarResumoEntrega(btn.dataset.type);
        });
    });

    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentContainer = document.querySelector('.payment-options');
    const btnAddCard = document.querySelector('.btn-add-card');
    const resumoPagamento = document.getElementById('resumo-pagamento');

    if (btnAddCard) {
        btnAddCard.addEventListener('click', () => {
            window.location.href = ROTAS.CARTAO;
        });
    }
    const btnChangeAddress = document.querySelector('.btn-change-address');
    const modalEndereco = document.getElementById('modal-endereco');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const modalBody = document.querySelector('.modal-body');
    const btnConfirmar = document.querySelector('.btn-confirmar');
    const btnIrParaCadastro = document.querySelector('.btn-adicionar');

    paymentOptions.forEach(option => {
        option.addEventListener('click', () => selecionarMetodoPagamento(option));
    });

    function selecionarMetodoPagamento(optionSelecionada) {
        paymentOptions.forEach(opt => {
            opt.classList.remove('active');
            opt.setAttribute('aria-pressed', 'false');
        });

        optionSelecionada.classList.add('active');
        optionSelecionada.setAttribute('aria-pressed', 'true');

        const method = optionSelecionada.dataset.method;
        paymentContainer.dataset.activeMethod = method;

        if (method === 'pix') {
            renderizarResumoPagamento('pix');
        } else if (method === 'credit') {
            const activeInstallment = document.querySelector('.installment-btn.active');
            const installmentText = activeInstallment ? activeInstallment.textContent : '1x de R$ 104';
            renderizarResumoPagamento('credit', installmentText);
        }
    }

    const initialActive = document.querySelector('.payment-option.active');
    if (initialActive) {
        selecionarMetodoPagamento(initialActive);
    }

    const initialDelivery = document.querySelector('.delivery-toggle button.active');
    if (initialDelivery) {
        atualizarResumoEntrega(initialDelivery.dataset.type);
    }

    if (btnChangeAddress) {
        btnChangeAddress.addEventListener('click', () => {
            if (modalEndereco) {
                abrirModalEndereco();
                carregarEnderecos();
            }
        });
    }

    if (modalEndereco) {
        inicializarModalEndereco(modalEndereco, btnFecharModal, modalBody, btnConfirmar, btnIrParaCadastro);
    }

    const enderecoWrapper = document.getElementById('checkout-address-wrapper');
    if (enderecoWrapper) {
        enderecoWrapper.addEventListener('click', (event) => {
            const btnEdit = event.target.closest('.btn-edit, .btn-change-address');
            if (!btnEdit) {
                return;
            }

            if (modalEndereco) {
                abrirModalEndereco();
                carregarEnderecos();
            }
        });
    }

    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            document.body.classList.remove('modal-open');
            modalEndereco?.close();
        });
    }

    inicializarModalBodyListeners(modalBody);

    (function() {
        const btnCart = document.querySelector('button[aria-label="Ver meu carrinho"]');
        if (btnCart) btnCart.addEventListener('click', () => { window.location.href = ROTAS.CARRINHO; });

        const btnFiltro = document.getElementById('btn-filter');
        if (btnFiltro) {
            btnFiltro.addEventListener('click', (e) => {
                if (!window.location.pathname.endsWith(ROTAS.HOME)) {
                    sessionStorage.setItem('open-filter', 'true');
                    window.location.href = ROTAS.HOME;
                }
            });
        }
    })();

    const installmentBtns = document.querySelectorAll('.installment-btn');

    installmentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            installmentBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            if(paymentContainer.dataset.activeMethod === 'credit') {
                renderizarResumoPagamento('credit', btn.textContent);
            }
        });
    });

    const btnFinalizarPedido = document.querySelector('.btn-buy.btn-continue');
    if (btnFinalizarPedido) {
        btnFinalizarPedido.addEventListener('click', async () => {
            const textoOriginal = btnFinalizarPedido.textContent;
            btnFinalizarPedido.disabled = true;
            btnFinalizarPedido.textContent = 'Finalizando pedido...';
            const payload = montarPayloadPedido();
            sessionStorage.setItem('pedidoFinalizacao', JSON.stringify(payload));

            if (payload.metodo === 'Pix') {
                btnFinalizarPedido.textContent = 'Abrindo pagamento Pix...';
                window.location.href = ROTAS.PIX;
                return;
            }

            try {
                const usuario = await aguardarUsuario();
                if (!usuario?.uid) {
                    throw new Error('Sua sessão expirou. Entre novamente para concluir o pedido.');
                }

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
                console.error('Erro ao criar pedido:', erro);
                salvarFeedbackNavegacao(
                    erro.message || 'Não foi possível finalizar o pedido. Tente novamente.',
                    'error'
                );
                btnFinalizarPedido.disabled = false;
                btnFinalizarPedido.textContent = textoOriginal;
                window.location.href = ROTAS.ERRO_PEDIDO;
            }
        });
    }
});

function renderizarResumoPagamento(method, installmentText = '') {
    const resumoPagamento = document.getElementById('resumo-pagamento');
    if (!resumoPagamento) {
        return;
    }

    resumoPagamento.replaceChildren();

    const label = document.createElement('span');
    label.textContent = method === 'pix' ? 'Pix' : 'Cartão **** 1234';
    resumoPagamento.appendChild(label);

    if (method === 'credit' && installmentText) {
        const small = document.createElement('small');
        small.textContent = installmentText;
        resumoPagamento.appendChild(small);
    }
}

function criarMensagemEstado(texto, classe = 'sem-produtos') {
    const mensagem = document.createElement('p');
    mensagem.className = classe;
    mensagem.textContent = texto;
    return mensagem;
}

function montarPayloadPedido() {
    const produtosSelecionados = JSON.parse(sessionStorage.getItem('produtosSelecionados') || '[]');
    const metodoSelecionado = document.querySelector('.payment-option.active')?.dataset.method || 'credit';
    const metodo = metodoSelecionado === 'pix' ? 'Pix' : 'Cartao';
    const parcelaAtiva = document.querySelector('.installment-btn.active')?.textContent || '';
    const parcelas = metodoSelecionado === 'pix' ? 1 : extrairParcelas(parcelaAtiva);
    const tipoEntregaSelecionado = document.querySelector('.delivery-toggle button.active')?.dataset.type;
    const formaEntregaSelecionada = tipoEntregaSelecionado === 'retirar' ? 'Retirar na Loja' : 'Receber';
    const enderecoPadrao = obterConfiguracao('enderecoPadrao');
    const endereco = tipoEntregaSelecionado === 'retirar' ? '' : (enderecoPadrao?.id || '');

    const preco = parsearMoeda(document.getElementById('resumo-produto')?.textContent || '0');
    const desconto = parsearMoeda(document.getElementById('resumo-desconto')?.textContent || '0');

    return {
        produtos: produtosSelecionados
            .filter(item => item?.id)
            .map(item => ({
                produtoId: item.id,
                quantidade: item.quantidade ?? 1
            })),
        preco,
        desconto,
        metodo,
        parcelas,
        formaEntrega: formaEntregaSelecionada,
        endereco
    };
}

function extrairParcelas(texto) {
    const match = String(texto).match(/(\d+)/);
    return match ? Number(match[1]) : 1;
}

function parsearMoeda(valor) {
    if (!valor) return 0;
    const texto = String(valor).replace(/[R$\s.]/g, '').replace(',', '.');
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
}

async function carregarProdutosSelecionados(ehPrimeiraCompra) {
    const listaContainer = document.querySelector('.checkout-products-list');
    if (!listaContainer) {
        return;
    }

    const produtosSelecionados = JSON.parse(sessionStorage.getItem('produtosSelecionados') || '[]');

    if (!produtosSelecionados.length) {
        listaContainer.replaceChildren(criarMensagemEstado('Nenhum produto selecionado.'));
        atualizarResumoCompra([], ehPrimeiraCompra);
        return;
    }

    listaContainer.setAttribute("aria-busy", "true");
    listaContainer.replaceChildren(criarMensagemEstado("Carregando produtos selecionados..."));
    try {
        const itensValidos = produtosSelecionados.filter(item => item?.id);
        const produtos = await Promise.all(
            itensValidos.map(item => buscarProdutoPorId(item.id))
        );
        const produtosCarregados = produtos
            .map((produto, indice) => produto
                ? { produto, quantidade: itensValidos[indice].quantidade ?? 1 }
                : null)
            .filter(Boolean);
        const fragment = document.createDocumentFragment();
        produtosCarregados.forEach(({ produto, quantidade }) => {
            fragment.appendChild(criarCheckoutProductStrip(produto, quantidade));
        });

        listaContainer.replaceChildren(fragment);
        atualizarResumoCompra(produtosCarregados, ehPrimeiraCompra);
    } catch (erro) {
        console.error("Não foi possível carregar os produtos selecionados:", erro);
        listaContainer.replaceChildren(criarMensagemEstado("Não foi possível carregar os produtos selecionados."));
        atualizarResumoCompra([], ehPrimeiraCompra);
        mostrarFeedbackGlobal("Não foi possível preparar os produtos do pedido.", "error");
    } finally {
        listaContainer.setAttribute("aria-busy", "false");
    }
}

async function verificarPrimeiraCompra() {
    const usuario = await aguardarUsuario();
    if (!usuario) {
        return false;
    }
    return !(await usuarioJaFezPedido(usuario.uid));
}

function atualizarResumoCompra(produtos, ehPrimeiraCompra) {
    produtosDoResumo = produtos;
    primeiraCompraDoResumo = ehPrimeiraCompra;
    const resumoProduto = document.getElementById('resumo-produto');
    const resumoDesconto = document.getElementById('resumo-desconto');
    const resumoDescontoText = document.getElementById('resumo-desconto-text');
    const resumoCupomText = document.getElementById('resumo-cupom-text');
    const resumoTotal = document.getElementById('resumo-total');

    const precoBruto = produtos.reduce((total, item) => {
        return total + item.produto.preco * item.quantidade;
    }, 0);

    const descontoProduto = produtos.reduce((total, item) => {
        return total + item.produto.preco * item.quantidade * (Number(item.produto.desconto || 0) / 100);
    }, 0);

    const precoComDescontoProduto = precoBruto - descontoProduto;
    const descontoPrimeiraCompra = ehPrimeiraCompra ? precoComDescontoProduto * 0.1 : 0;
    const precoAposDescontosAutomaticos = precoComDescontoProduto - descontoPrimeiraCompra;
    const descontoCupom = cupomAplicado
        ? precoAposDescontosAutomaticos * (cupomAplicado.desconto / 100)
        : 0;
    const descontoTotal = descontoProduto + descontoPrimeiraCompra + descontoCupom;
    const total = Math.max(0, precoAposDescontosAutomaticos - descontoCupom);

    if (resumoProduto) {
        resumoProduto.textContent = formatarMoeda(precoBruto);
    }
    if (resumoDesconto) {
        resumoDesconto.textContent = formatarMoeda(descontoTotal);
    }
    if (resumoDescontoText) {
        const detalhes = [];
        if (descontoProduto > 0) detalhes.push('Ofertas dos produtos');
        if (ehPrimeiraCompra) detalhes.push('10% na 1ª compra');
        resumoDescontoText.textContent = detalhes.length
            ? `${detalhes.join(' + ')} · ${formatarMoeda(descontoProduto + descontoPrimeiraCompra)}`
            : 'Sem desconto automático';
    }
    if (resumoCupomText) {
        resumoCupomText.textContent = cupomAplicado
            ? `${cupomAplicado.codigo} · ${cupomAplicado.desconto}% · ${formatarMoeda(descontoCupom)}`
            : '';
    }
    document.getElementById('btn-adicionar-cupom')?.toggleAttribute('hidden', Boolean(cupomAplicado));
    document.getElementById('resumo-cupom-aplicado')?.toggleAttribute('hidden', !cupomAplicado);
    if (resumoTotal) {
        resumoTotal.textContent = formatarMoeda(total);
    }
    atualizarValoresParcelas(total);
}

function atualizarValoresParcelas(total) {
    const botoes = [...document.querySelectorAll('.installment-btn')];
    botoes.forEach((botao, indice) => {
        const parcelas = indice + 1;
        botao.textContent = `${parcelas}x de ${formatarMoeda(total / parcelas)}`;
    });

    const parcelaAtiva = botoes.find(botao => botao.classList.contains('active'));
    const metodoAtivo = document.querySelector('.payment-options')?.dataset.activeMethod;
    if (parcelaAtiva && metodoAtivo === 'credit') {
        renderizarResumoPagamento('credit', parcelaAtiva.textContent);
    }
}

function configurarCupomCheckout() {
    const dialogo = document.getElementById('modal-cupom');
    const formulario = document.getElementById('form-aplicar-cupom');
    const campoCodigo = document.getElementById('codigo-cupom');
    const feedback = document.getElementById('coupon-checkout-feedback');
    const botaoAbrir = document.getElementById('btn-adicionar-cupom');
    const botaoAlterar = document.getElementById('btn-alterar-cupom');
    const botaoRemover = document.getElementById('btn-remover-cupom');
    if (!dialogo || !formulario || !campoCodigo || !feedback) return;

    const fechar = () => dialogo.open && dialogo.close();
    const abrir = () => {
        campoCodigo.value = cupomAplicado?.codigo || '';
        feedback.textContent = '';
        feedback.className = 'coupon-checkout-feedback';
        botaoRemover.hidden = !cupomAplicado;
        dialogo.showModal();
        requestAnimationFrame(() => campoCodigo.focus());
    };

    botaoAbrir?.addEventListener('click', abrir);
    botaoAlterar?.addEventListener('click', abrir);
    dialogo.querySelector('[data-close-coupon]')?.addEventListener('click', fechar);
    dialogo.addEventListener('click', evento => {
        if (evento.target === dialogo) fechar();
    });
    campoCodigo.addEventListener('input', () => {
        campoCodigo.value = campoCodigo.value.toUpperCase().replace(/\s+/g, '');
        feedback.textContent = '';
        feedback.className = 'coupon-checkout-feedback';
    });

    formulario.addEventListener('submit', async evento => {
        evento.preventDefault();
        const botao = formulario.querySelector('[type="submit"]');
        const textoOriginal = botao.textContent;
        botao.disabled = true;
        campoCodigo.disabled = true;
        botao.textContent = 'Validando...';
        formulario.setAttribute('aria-busy', 'true');
        feedback.textContent = 'Verificando cupom...';
        feedback.className = 'coupon-checkout-feedback';

        try {
            cupomAplicado = await buscarCupomValidoPorCodigo(campoCodigo.value);
            atualizarResumoCompra(produtosDoResumo, primeiraCompraDoResumo);
            feedback.textContent = `Cupom ${cupomAplicado.codigo} aplicado com sucesso.`;
            feedback.classList.add('success');
            mostrarFeedbackGlobal(`Cupom ${cupomAplicado.codigo} aplicado com sucesso.`);
            setTimeout(fechar, 450);
        } catch (erro) {
            feedback.textContent = erro.message || 'Não foi possível aplicar este cupom.';
            feedback.classList.add('error');
            campoCodigo.focus();
        } finally {
            formulario.setAttribute('aria-busy', 'false');
            botao.disabled = false;
            campoCodigo.disabled = false;
            botao.textContent = textoOriginal;
        }
    });

    botaoRemover?.addEventListener('click', () => {
        cupomAplicado = null;
        atualizarResumoCompra(produtosDoResumo, primeiraCompraDoResumo);
        fechar();
        mostrarFeedbackGlobal('Cupom removido do pedido.');
    });
}

function atualizarResumoEntrega(tipo) {
    const resumoFrete = document.getElementById('resumo-frete');
    const resumoChegara = document.getElementById('resumo-chegara');
    const deliveryEstimate = document.getElementById('delivery-estimate-text');
    const deliveryFrete = document.getElementById('delivery-frete-text');
    const deliveryFreteWrapper = deliveryFrete?.parentElement;

    if (!resumoFrete || !resumoChegara) {
        return;
    }

    const addressWrapper = document.getElementById('checkout-address-wrapper');

    if (tipo === 'retirar') {
        resumoFrete.textContent = 'Retirada na loja';
        resumoChegara.textContent = 'Disponível para retirada';
        if (deliveryEstimate) {
            deliveryEstimate.textContent = 'Disponível para retirada';
        }
        if (deliveryFreteWrapper) {
            deliveryFreteWrapper.style.display = 'none';
        }
        if (addressWrapper) {
            addressWrapper.style.display = 'none';
        }
    } else {
        resumoFrete.textContent = 'Grátis';
        resumoChegara.textContent = '5 dias úteis';
        if (deliveryEstimate) {
            deliveryEstimate.textContent = 'Chegará em 5 dias úteis';
        }
        if (deliveryFrete) {
            deliveryFrete.textContent = 'grátis';
        }
        if (deliveryFreteWrapper) {
            deliveryFreteWrapper.style.display = '';
        }
        if (addressWrapper) {
            addressWrapper.style.display = '';
        }
    }
}

async function configurarEndereco() {
    const enderecoWrapper = document.getElementById('checkout-address-wrapper');
    const usuario = await aguardarUsuario();
    const uid = usuario?.uid;

    if (!enderecoWrapper) {
        return;
    }

    if (!existeConfiguracao('enderecoPadrao')) {
        enderecoWrapper.replaceChildren(criarEnderecoVazioElemento());
        atualizarIconesLucide();
        return;
    }

    const enderecoPadrao = obterConfiguracao('enderecoPadrao');
    const endereco = uid ? await buscarEnderecoPorId(uid, enderecoPadrao.id) : null;

    if (endereco) {
        enderecoWrapper.replaceChildren(criarEnderecoBoxElemento(endereco));
    } else {
        enderecoWrapper.replaceChildren(criarEnderecoVazioElemento());
    }

    atualizarIconesLucide();
}

function atualizarIconesLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function criarEnderecoVazioElemento() {
    const address = document.createElement('address');
    address.className = 'address-box address-box--empty';

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'map-pin');
    icon.setAttribute('aria-hidden', 'true');

    const details = document.createElement('section');
    details.className = 'address-details';

    const title = document.createElement('h4');
    title.textContent = 'Endereço';

    const text = document.createElement('p');
    text.textContent = 'Ainda não há nenhum endereço selecionado';

    details.append(title, text);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-edit action-btn btn-change-address';
    button.setAttribute('aria-label', 'Cadastrar endereço');

    const buttonIcon = document.createElement('i');
    buttonIcon.setAttribute('data-lucide', 'plus');
    buttonIcon.setAttribute('aria-hidden', 'true');
    button.appendChild(buttonIcon);

    address.append(icon, details, button);
    return address;
}

function abrirModalEndereco() {
    const modalEndereco = document.getElementById('modal-endereco');
    if (!modalEndereco) {
        return;
    }

    modalEndereco.showModal();

    requestAnimationFrame(() => {
        const modalBody = modalEndereco.querySelector('.modal-body');
        document.body.classList.add('modal-open');
        if (modalBody) modalBody.scrollTop = 0;
        document.getElementById('btn-fechar-modal')?.focus();
    });
}

async function carregarEnderecos() {
    const uid = obterUid();
    if (!uid) {
        return;
    }

    const enderecos = await listarEnderecos(uid);
    if (enderecos.length) {
        carregarListaEnderecos(enderecos);
    }
}

function inicializarModalEndereco(modalEndereco, btnFecharModal, modalBody, btnConfirmar, btnIrParaCadastro) {
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', () => {
            document.body.classList.remove('modal-open');
            modalEndereco.close();
        });
    }

    if (modalEndereco) {
        modalEndereco.addEventListener('click', (event) => {
            if (event.target === modalEndereco) {
                document.body.classList.remove('modal-open');
                modalEndereco.close();
            }
        });
    }

    if (btnIrParaCadastro) {
        btnIrParaCadastro.addEventListener('click', () => {
            window.location.href = ROTAS.ENDERECO;
        });
    }
}

function carregarListaEnderecos(enderecos) {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;

    modalBody.classList.remove('modal-body-empty');
    modalBody.replaceChildren();

    const lista = document.createElement('ul');
    lista.className = 'address-list';
    lista.role = 'listbox';
    lista.ariaLabel = 'Selecione um endereço de entrega';

    const fragment = document.createDocumentFragment();

    enderecos.forEach(endereco => {
        const item = document.createElement('li');
        item.role = 'option';
        item.dataset.id = endereco.id;

        const card = document.createElement('article');
        card.className = 'address-option-card';
        card.dataset.id = endereco.id;
        card.dataset.etiqueta = endereco.etiqueta;

        if (obterConfiguracao('enderecoPadrao')?.id === endereco.id) {
            card.classList.add('selecionado');
        }

        card.tabIndex = 0;
        card.setAttribute('role', 'button');

        const header = document.createElement('header');
        const tag = document.createElement('h4');
        tag.className = 'address-tag';
        tag.textContent = endereco.etiqueta;
        header.append(tag);

        const content = document.createElement('section');
        content.className = 'address-option-content';

        const icone = document.createElement('i');
        icone.setAttribute('data-lucide', 'map-pin');
        icone.setAttribute('aria-hidden', 'true');

        const address = document.createElement('address');
        address.className = 'address-text';

        const nome = document.createElement('span');
        nome.className = 'address-name';
        nome.textContent = endereco.nome;

        const rua = document.createElement('span');
        rua.className = 'address-street';
        rua.textContent = `${endereco.rua} Nº ${endereco.numero}`;

        const cep = document.createElement('span');
        cep.className = 'address-cep';
        cep.textContent = `CEP: ${endereco.cep} - ${endereco.cidade}, ${endereco.uf}`;

        address.append(nome, rua, cep);

        const botaoEditar = document.createElement('button');
        botaoEditar.type = 'button';
        botaoEditar.className = 'btn-edit-address';
        botaoEditar.setAttribute('aria-label', `Editar endereço ${endereco.etiqueta}`);
        botaoEditar.dataset.id = endereco.id;
        botaoEditar.textContent = 'Editar';

        content.append(icone, address, botaoEditar);
        card.append(header, content);
        item.append(card);
        fragment.append(item);
    });

    lista.append(fragment);
    modalBody.append(lista);

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function inicializarModalBodyListeners(modalBody) {
    if (!modalBody) return;

    modalBody.addEventListener('click', (event) => {
        if (event.target.closest('.btn-edit-address')) {
            return;
        }

        const card = event.target.closest('.address-option-card');
        if (!card) {
            return;
        }

        document.querySelectorAll('.address-option-card').forEach(card => {
            card.classList.remove('selecionado');
        });

        card.classList.add('selecionado');

        const id = card.dataset.id;
        const etiqueta = card.dataset.etiqueta;

        salvarConfiguracao('enderecoPadrao', { id, etiqueta });
        criarCardEndereco(etiqueta);
    });

    modalBody.addEventListener('click', (evento) => {
        const botao = evento.target.closest('.btn-edit-address');
        if (!botao) {
            return;
        }

        const id = botao.dataset.id;
        sessionStorage.setItem('edit-address', id);
        window.location.href = ROTAS.ENDERECO;
    });
}

function criarCardEndereco(etiqueta) {
    const enderecoWrapper = document.getElementById('checkout-address-wrapper');
    if (!enderecoWrapper) {
        return;
    }

    const enderecoPadrao = obterConfiguracao('enderecoPadrao');
    const uid = obterUid();

    if (!enderecoPadrao || !uid) {
        enderecoWrapper.replaceChildren(criarEnderecoVazioElemento());
        return;
    }

    buscarEnderecoPorId(uid, enderecoPadrao.id)
        .then(endereco => {
            if (endereco) {
                enderecoWrapper.replaceChildren(criarEnderecoBoxElemento(endereco));
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
        });
}

function criarEnderecoBoxElemento(endereco) {
    const address = document.createElement('address');
    address.className = 'address-box';

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'map-pin');
    icon.setAttribute('aria-hidden', 'true');

    const details = document.createElement('section');
    details.className = 'address-details';

    const title = document.createElement('h4');
    title.textContent = endereco.etiqueta;

    const text = document.createElement('p');
    text.appendChild(document.createTextNode(endereco.nome));
    text.appendChild(document.createElement('br'));
    text.appendChild(document.createTextNode(`${endereco.rua} Nº ${endereco.numero}`));
    text.appendChild(document.createElement('br'));
    text.appendChild(document.createTextNode(`CEP: ${endereco.cep} - ${endereco.cidade}, ${endereco.uf}`));

    details.append(title, text);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-edit action-btn';
    button.setAttribute('aria-label', 'Editar endereço de entrega');

    const buttonIcon = document.createElement('i');
    buttonIcon.setAttribute('data-lucide', 'pencil');
    buttonIcon.setAttribute('aria-hidden', 'true');
    button.appendChild(buttonIcon);

    address.append(icon, details, button);
    return address;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function criarCheckoutProductStrip(produto, quantidade) {
    const section = document.createElement('section');
    section.className = 'checkout-product-strip';
    section.setAttribute('aria-label', 'Produto selecionado');
    section.dataset.id = produto.id;
    section.dataset.desconto = produto.desconto ?? 0;

    const figure = document.createElement('figure');
    figure.className = 'product-images';

    const imagem = document.createElement('img');
    imagem.className = 'checkout-product-image';
    imagem.src = produto.imagem;
    imagem.alt = `Foto de ${produto.nome}`;

    figure.appendChild(imagem);

    const quantidadeSpan = document.createElement('span');
    quantidadeSpan.className = 'checkout-product-quantity';
    quantidadeSpan.textContent = quantidade;
    figure.appendChild(quantidadeSpan);

    const nome = document.createElement('h3');
    nome.className = 'checkout-product-name';
    nome.textContent = produto.nome;

    section.appendChild(figure);
    section.appendChild(nome);

    return section;
}
