// ====================================================================
// CONFIGURAÇÕES GLOBAIS
// ====================================================================

// 1. COLE AQUI A URL DO SEU WEB APP (APPS SCRIPT) - TERMINA EM /exec
const API_URL = 'COLE_SEU_LINK_DO_APPS_SCRIPT_AQUI'; // <-- EDITE AQUI

// 2. SEU EMAIL DO FORMSUBMIT
const FORM_SUBMIT_EMAIL = 'seu.email.de.notificacao@exemplo.com'; // <-- EDITE AQUI

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
    
    // 1. Configuração do FormSubmit (Garantindo POST)
    checkoutForm.action = `https://formsubmit.co/${FORM_SUBMIT_EMAIL}`;
    checkoutForm.method = 'POST'; // Necessário para o FormSubmit

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

    // 2. CORREÇÃO CRÍTICA: Geração do Link InfinitePay com estrutura JSON de Itens
    const nomeProduto = produto.NOME; 
    // Limpa o preço para obter um número inteiro em centavos (ex: 79,90 -> 7990)
    const precoLimpoParaCentavos = precoLimpo.replace(',', '').replace('.', ''); 
    
    // Monta o Array de Itens
    const itemsArray = [{
        "name": nomeProduto,
        "price": parseInt(precoLimpoParaCentavos), // Deve ser um número inteiro em centavos
        "quantity": 1 // Assumindo 1 por padrão
    }];
    
    // Converte o array em string JSON e URI-encode
    const itemsJsonString = encodeURIComponent(JSON.stringify(itemsArray));

    // Monta o link final com os parâmetros 'items' e 'redirect_url'
    const infinitePayLink = `https://checkout.infinitepay.io/${INFINITEPAY_USER}?items=${itemsJsonString}&redirect_url=https://micaelnascimento2468.github.io/minha-loja-infinite/tela-de-agradecimento`;
    
    // Atribui ao input oculto
    document.getElementById('infinitepay-redirect').value = infinitePayLink;

    modal.style.display = 'block';
}

function fecharModal() {
    modal.style.display = 'none';
    checkoutForm.reset(); 
}

closeButton.addEventListener('click', fecharModal);

// CORREÇÃO DE SINTAXE: Garantindo a estrutura correta para o listener de janela
window.addEventListener('click', (e) => { 
    if (e.target === modal) {
        fecharModal(); 
    }
});

// Inicia
carregarProdutos();
