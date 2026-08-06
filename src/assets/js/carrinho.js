// Inicializa ícones do Lucide
if (window.lucide) {
    window.lucide.createIcons();
}

const header = document.querySelector('.header');

window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
        header?.classList.add("scrolled");
    } else {
        header?.classList.remove("scrolled");
    }
});

// Mock inicial de dados
let cartData = [
    {
        id: "p1",
        marca: "Disney/Pixar",
        nome: "Boneco Funko Pop João Maldonado Vergonha",
        preco: 129.99,
        imagem: "../assets/images/seu-boneco.png",
        estoque: 4,
        quantidade: 1,
        selecionado: true,
        favorito: false
    },
    {
        id: "p2",
        marca: "Disney/Pixar",
        nome: "Boneco Funko Pop João Maldonado Vergonha",
        preco: 129.99,
        imagem: "../assets/images/seu-boneco.png",
        estoque: 4,
        quantidade: 1,
        selecionado: true,
        favorito: false
    }
];

const cartContainer = document.getElementById('cart-items-container');
const selectAllCheckbox = document.getElementById('checkbox-select-all');

const summaryCount = document.getElementById('summary-count');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryDiscount = document.getElementById('summary-discount');
const summaryTotal = document.getElementById('summary-total');

const VALOR_DESCONTO = 0; 

function renderCart() {
    cartContainer.innerHTML = '';
    
    let todosSelecionados = true;
    if(cartData.length === 0) todosSelecionados = false;

    cartData.forEach((item, index) => {
        if(!item.selecionado) todosSelecionados = false;

        const article = document.createElement('article');
        
        // Acessibilidade e Estilo Base
        article.className = `cart-product-card ${item.selecionado ? 'selecionado' : ''}`;
        article.setAttribute('data-index', index);
        article.setAttribute('tabindex', '0'); // Permite foco via teclado
        article.setAttribute('role', 'checkbox');
        article.setAttribute('aria-checked', item.selecionado);
        article.setAttribute('aria-label', `Selecionar ${item.nome} por ${formatarMoeda(item.preco)}`);
        
        article.innerHTML = `
            <header class="cart-card-header">
                <menu class="cart-actions-left">
                    <li>
                        <button type="button" class="btn-icon action-btn ${item.favorito ? 'is-favorite' : ''}" aria-label="${item.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                            <i data-lucide="heart"></i>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="btn-icon is-cart action-btn" aria-label="Remover do carrinho">
                            <i data-lucide="shopping-cart"></i>
                        </button>
                    </li>
                </menu>
                <label class="custom-checkbox-label" style="width: auto;" onclick="event.stopPropagation()">
                    <input type="checkbox" class="sr-only item-checkbox" data-index="${index}" ${item.selecionado ? 'checked' : ''} tabindex="-1">
                    <span class="custom-checkbox" aria-hidden="true">
                        <i data-lucide="check"></i>
                    </span>
                </label>
            </header>
            
            <img src="${item.imagem}" alt="" class="product-image" aria-hidden="true">
            
            <section class="cart-product-info">
                <span class="brand">${item.marca}</span>
                <h4 class="title">${item.nome}</h4>
                <p class="price" aria-label="Preço unitário ${formatarMoeda(item.preco)}">${formatarMoeda(item.preco)}</p>
                
                <div class="quantity-control" onclick="event.stopPropagation()">
                    <button type="button" class="btn-minus action-btn" data-index="${index}" aria-label="Diminuir quantidade"><i data-lucide="minus"></i></button>
                    <span aria-label="Quantidade ${item.quantidade}">${item.quantidade}</span>
                    <button type="button" class="btn-plus action-btn" data-index="${index}" aria-label="Aumentar quantidade"><i data-lucide="plus"></i></button>
                </div>
                
                <span class="stock-info">Disponível: ${item.estoque}</span>
            </section>
        `;
        
        // --- EVENTOS DO CARD ---

        // 1. Clique do mouse
        article.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn') || e.target.closest('.custom-checkbox-label')) {
                return;
            }
            alternarSelecao(index);
        });

        // 2. Acessibilidade por Teclado (Enter ou Espaço)
        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Evita scroll ao apertar espaço
                if (e.target.closest('.action-btn')) {
                    return; // Se o foco estiver em um botão interno, deixa o botão agir
                }
                alternarSelecao(index);
            }
        });

        cartContainer.appendChild(article);
    });

    selectAllCheckbox.checked = todosSelecionados;
    
    const selectAllWrapper = document.querySelector('.select-all-wrapper');
    if (todosSelecionados) {
        selectAllWrapper.classList.add('selecionado');
    } else {
        selectAllWrapper.classList.remove('selecionado');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    adicionarEventosBotoesInternos();
    calcularTotal();
}

function alternarSelecao(index) {
    cartData[index].selecionado = !cartData[index].selecionado;
    renderCart();
}

function adicionarEventosBotoesInternos() {
    // Checkbox nativo do card
    document.querySelectorAll('.item-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const index = e.target.getAttribute('data-index');
            cartData[index].selecionado = e.target.checked;
            renderCart();
        });
    });

    // Diminuir Quantidade
    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            if(cartData[index].quantidade > 1) {
                cartData[index].quantidade--;
                renderCart();
            }
        });
    });

    // Aumentar Quantidade
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            if(cartData[index].quantidade < cartData[index].estoque) {
                cartData[index].quantidade++;
                renderCart();
            }
        });
    });
}

// Selecionar ou desmarcar todos
selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    cartData = cartData.map(item => ({ ...item, selecionado: isChecked }));
    renderCart();
});

function calcularTotal() {
    const itensSelecionados = cartData.filter(item => item.selecionado);
    
    const quantidadeTotal = itensSelecionados.reduce((acc, item) => acc + item.quantidade, 0);
    const subtotal = itensSelecionados.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const total = subtotal - VALOR_DESCONTO;

    summaryCount.innerText = quantidadeTotal;
    summarySubtotal.innerText = formatarMoeda(subtotal);
    summaryDiscount.innerText = formatarMoeda(VALOR_DESCONTO);
    summaryTotal.innerText = formatarMoeda(total > 0 ? total : 0);
}

const btnHeaderCarrinho = document.querySelector('button[aria-label="Ver meu carrinho"]');
if (btnHeaderCarrinho) {
    btnHeaderCarrinho.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Renderiza a lista assim que o script carregar
renderCart();