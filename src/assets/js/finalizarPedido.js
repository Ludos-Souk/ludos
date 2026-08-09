document.addEventListener('DOMContentLoaded', () => {

    if (window.lucide) {
        lucide.createIcons();
    }

    const deliveryBtns = document.querySelectorAll('.delivery-toggle button');
    
    deliveryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            deliveryBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false'); 
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        });
    });

    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentContainer = document.querySelector('.payment-options');
    const resumoPagamento = document.getElementById('resumo-pagamento');

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

        if(method === 'pix') {
            resumoPagamento.innerHTML = `
                <span>Pix</span>
            `;
        } else if (method === 'credit') {
            const activeInstallment = document.querySelector('.installment-btn.active');
            const installmentText = activeInstallment ? activeInstallment.textContent : '1x de R$ 104';
            
            resumoPagamento.innerHTML = `
                <span>Cartão **** 1234</span>
                <small>${installmentText}</small>
            `;
        }
    }

    const initialActive = document.querySelector('.payment-option.active');
    if (initialActive) {
        paymentContainer.dataset.activeMethod = initialActive.dataset.method;
    }

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
                resumoPagamento.innerHTML = `
                    <span>Cartão **** 1234</span>
                    <small>${btn.textContent}</small>
                `;
            }
        });
    });
});