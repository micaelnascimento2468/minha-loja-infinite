// ====================================================================
// CONFIGURAÇÕES GLOBAIS
// ====================================================================

// 1. COLE AQUI A URL DO SEU WEB APP (APPS SCRIPT) - TERMINA EM /exec
const API_URL = 'https://script.google.com/macros/s/AKfycbyYqFl-fYUf04plIYnbLrU-aPqYpDR0zNPy0P-fMb6EqxJFTb7zmY9td-Kej-VinM5K/exec'; 

// 2. SEU EMAIL DO FORMSUBMIT
const FORM_SUBMIT_EMAIL = 'micaelcomdeus123@gmail.com'; 

// 3. SEU USUÁRIO DA INFINITEPAY
const INFINITEPAY_USER = 'audaces'; 

// ====================================================================
// LÓGICA DA LOJA
// ====================================================================

const listaProdutos = document.getElementById('lista-produtos');
const modal = document.getElementById('modal-produto');
const detalhesProdutoDiv = document.getElementById('detalhes-produto');
const closeButton = document.querySelector('.close-button');
const checkoutForm = document.getElementById('checkout-form');

// Função Principal para Carregar Produtos via JSON
async function carregarProdutos() {
    listaProdutos.innerHTML = '<p>Carregando catálogo...</p>';
    try {
        const response = await fetch(API_URL);
        const produtos = await response.json(); // Agora lemos JSON direto!
        renderizarProdutos(produtos);
    } catch (error) {
        console.error('Erro:', error);
        listaProdutos.innerHTML = '<p class="erro">❌ Erro ao carregar. Verifique a implantação do Apps Script.</p>';
    }
}

function renderizarProdutos(produtos) {
    if (!produtos || produtos.length === 0) {
        listaProdutos.innerHTML = '<p>Nenhum produto encontrado.</p>';
        return;
    }

    listaProdutos.innerHTML = '<h2>Nossos Produtos</h2>';
    produtos.forEach(produto => {
        // Garante que o preço seja tratado como texto ou número
        let precoTexto = String(produto.PRECO).replace('R$', '').trim();
        
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
            <img src="${produto.IMAGEM_URL}" alt="${produto.NOME}" onerror="this.src='https://placehold.co/300x200?text=Sem+Imagem'">
            <div class="produto-info">
                <h3>${produto.NOME}</h3>
                <p>${String(produto.DESCRICAO).substring(0, 50)}...</p>
                <div class="preco">R$ ${precoTexto}</div>
            </div>
        `;
        card.addEventListener('click', () => abrirModalProduto(produto));
        listaProdutos.appendChild(card);
    });
}

function abrirModalProduto(produto) {
    let precoLimpo = String(produto.PRECO).replace('R$', '').trim();
    
    // Preenche visualmente
    detalhesProdutoDiv.innerHTML = `
        <img src="${produto.IMAGEM_URL}" alt="${produto.NOME}" onerror="this.src='https://placehold.co/300x200?text=Imagem'">
        <h2 class="detalhe-nome">${produto.NOME}</h2>
        <p class="detalhe-descricao">${produto.DESCRICAO}</p>
        <div class="detalhe-preco">R$ ${precoLimpo}</div>
    `;

    // Configura inputs ocultos do formulário
    document.getElementById('input-produto-nome').value = `${produto.ID_PRODUTO} - ${produto.NOME}`;
    document.getElementById('input-preco-final').value = `R$ ${precoLimpo}`; 

    // ATRIBUIÇÃO MAIS SEGURA PARA EVITAR ERROS DE SINTAXE
    checkoutForm.action = `https://formsubmit.co/${FORM_SUBMIT_EMAIL}`;
    checkoutForm.method = 'POST';
    
    // Tratamento de Variações
    const variacoesHTML = document.createElement('div');
    variacoesHTML.id = 'variacao-container';
    
    // Verifica se existe variação e se não é apenas um traço ou vazio
    if (produto.VARIACOES && String(produto.VARIACOES).length > 1) {
        const opcoes = String(produto.VARIACOES).split(',').map(v => v.trim());
        
        const select = document.createElement('select');
        select.name = 'Variacao_Escolhida';
        select.required = true;
        select.innerHTML = '<option value="">Selecione uma opção...</option>' + 
                           opcoes.map(op => `<option value="${op}">${op}</option>`).join('');

        variacoesHTML.innerHTML = '<label>Variação:</label>';
        variacoesHTML.appendChild(select);
        
        select.addEventListener('change', (e) => {
            document.getElementById('input-variacao').value = e.target.value;
        });
    } else {
        document.getElementById('input-variacao').value = 'Padrão';
    }

    const oldVariations = detalhesProdutoDiv.querySelector('#variacao-container');
    if (oldVariations) oldVariations.remove();
    detalhesProdutoDiv.appendChild(variacoesHTML);

    // Gera Link InfinitePay (Remove pontos e vírgulas para centavos)
    // Ex: 79,90 -> 7990
    const precoCentavos = precoLimpo.replace(/[.,]/g, '');
    const infinitePayLink = `https://www.infinitepay.io/checkout/${INFINITEPAY_USER}/${precoCentavos}`;
    document.getElementById('infinitepay-redirect').value = infinitePayLink;

    modal.style.display = 'block';
}

function fecharModal() {
    modal.style.display = 'none';
    checkoutForm.reset(); 
}

closeButton.addEventListener('click', fecharModal);

// CORREÇÃO DO ERRO DE SINTAXE: Parênteses e chaves corrigidos
window.addEventListener('click', (e) => { 
    if (e.target === modal) {
        fecharModal(); 
    }
});

// Inicia
carregarProdutos();
