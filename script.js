// ====================================================================
// CONFIGURAÇÕES GLOBAIS - EDITE APENAS ESTAS TRÊS LINHAS ABAIXO!
// ====================================================================

// 1. COLE AQUI O LINK COMPLETO DE DADOS DOS PRODUTOS (URL CSV DO GOOGLE SHEETS)
// Exemplo: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6z.../pub?gid=0&single=true&output=csv'
const DATA_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSw4GUttxFKGSRUfj3DPthg2-zCRtLIMgBLaxC-i5KD_TJ6VgStqC_uus-fLBjft1hFE7m5k43Bbv11/pub?output=csv'; // <-- EDITE AQUI

// 2. COLE AQUI O SEU EMAIL DE RECEBIMENTO DE PEDIDOS (FormSubmit)
// IMPORTANTE: Você precisa confirmar este email no FormSubmit após o primeiro uso.
const FORM_SUBMIT_EMAIL = 'micaelcomdeus123@gmail.com'; // <-- EDITE AQUI

// 3. SEU USUÁRIO DA INFINITEPAY (para gerar o link de pagamento)
// O nome "audaces" foi solicitado, mas se for outro, altere aqui.
const INFINITEPAY_USER = 'audaces'; // <-- EDITE AQUI

// ====================================================================
// CÓDIGO DA LOJA (NÃO PRECISA ALTERAR DAQUI PARA BAIXO)
// ====================================================================

// Mapeamento de elementos HTML
const listaProdutos = document.getElementById('lista-produtos');
const modal = document.getElementById('modal-produto');
const detalhesProdutoDiv = document.getElementById('detalhes-produto');
const closeButton = document.querySelector('.close-button');
const checkoutForm = document.getElementById('checkout-form');
const variacoesSelect = document.getElementById('select-variacoes');

let produtosData = []; // Armazenará os produtos carregados

// Função para buscar e carregar os dados do CSV (Google Sheets)
async function carregarProdutos() {
    listaProdutos.innerHTML = '<p>Carregando produtos...</p>';
    try {
        const response = await fetch(DATA_SHEET_URL);
        const csvText = await response.text();
        produtosData = parseCSV(csvText); // Converte CSV para array de objetos
        renderizarProdutos(produtosData);
    } catch (error) {
        console.error('Erro ao buscar dados da planilha:', error);
        listaProdutos.innerHTML = '<p class="erro">❌ Erro ao carregar os produtos. Verifique se o link da planilha está correto e público.</p>';
    }
}

// Função para converter texto CSV em um Array de Objetos JavaScript
function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            let obj = {};
            for (let j = 0; j < headers.length; j++) {
                // Remove as aspas e limpa espaços
                obj[headers[j]] = values[j].replace(/"/g, '').trim();
            }
            data.push(obj);
        }
    }
    return data;
}

// Função para exibir os produtos na tela
function renderizarProdutos(produtos) {
    if (produtos.length === 0) {
        listaProdutos.innerHTML = '<p>Nenhum produto encontrado na planilha.</p>';
        return;
    }

    listaProdutos.innerHTML = '<h2>Nossos Produtos</h2>';
    produtos.forEach(produto => {
        // Formatação do preço (assumindo que o formato é XX,XX no Sheets)
        const precoFormatado = `R$ ${produto.PRECO}`; 

        const card = document.createElement('div');
        card.className = 'produto-card';
        card.setAttribute('data-id', produto.ID_PRODUTO);
        card.innerHTML = `
            <img src="${produto.IMAGEM_URL || 'placeholder.png'}" alt="${produto.NOME}">
            <div class="produto-info">
                <h3>${produto.NOME}</h3>
                <p>${produto.DESCRICAO.substring(0, 50)}...</p>
                <div class="preco">${precoFormatado}</div>
            </div>
        `;
        // Adiciona o evento de clique para abrir o modal
        card.addEventListener('click', () => abrirModalProduto(produto));
        listaProdutos.appendChild(card);
    });
}

// Função para abrir o modal de detalhes do produto
function abrirModalProduto(produto) {
    // 1. Preenche os detalhes do produto
    detalhesProdutoDiv.innerHTML = `
        <img src="${produto.IMAGEM_URL || 'placeholder.png'}" alt="${produto.NOME}">
        <h2 class="detalhe-nome">${produto.NOME}</h2>
        <p class="detalhe-descricao">${produto.DESCRICAO}</p>
        <div class="detalhe-preco">Preço: R$ ${produto.PRECO}</div>
    `;

    // 2. Preenche o campo oculto de preço e nome no formulário
    document.getElementById('input-produto-nome').value = `${produto.ID_PRODUTO} - ${produto.NOME}`;
    document.getElementById('input-preco-final').value = `R$ ${produto.PRECO}`; 
    
    // 3. Configura o formulário com o email do FormSubmit
    checkoutForm.setAttribute('action', `https://formsubmit.co/${FORM_SUBMIT_EMAIL}`);
    
    // 4. Cria o seletor de variações, se houver
    const variacoesHTML = document.createElement('div');
    const variacoesString = produto.VARIACOES;

    if (variacoesString) {
        const opcoes = variacoesString.split(',').map(v => v.trim()).filter(v => v.length > 0);
        
        const select = document.createElement('select');
        select.id = 'select-variacoes';
        select.name = 'Variacao_Escolhida';
        select.required = true;
        
        let selectHTML = '<option value="">Selecione uma opção...</option>';
        opcoes.forEach(opcao => {
            selectHTML += `<option value="${opcao}">${opcao}</option>`;
        });
        select.innerHTML = selectHTML;

        variacoesHTML.innerHTML = '<label for="select-variacoes">Variação:</label>';
        variacoesHTML.appendChild(select);

        // Atualiza o input hidden da variação ao selecionar
        select.addEventListener('change', (e) => {
            document.getElementById('input-variacao').value = e.target.value;
        });
        
        // Coloca a primeira variação selecionável como valor inicial
        if (opcoes.length > 0) {
             document.getElementById('input-variacao').value = opcoes[0];
        }

    } else {
        // Se não houver variações, garante que o campo hidden seja limpo
        document.getElementById('input-variacao').value = 'N/A (Sem Variação)';
    }

    // Remove variações antigas e insere as novas
    const oldVariations = detalhesProdutoDiv.querySelector('#variacao-container');
    if (oldVariations) oldVariations.remove();
    
    variacoesHTML.id = 'variacao-container';
    detalhesProdutoDiv.appendChild(variacoesHTML);

    // 5. Gera o link base da InfinitePay
    // Formato sugerido da InfinitePay para link de pagamento: 
    // https://www.infinitepay.io/checkout/[USER]/[VALOR_EM_CENTAVOS]
    const precoCentavos = parseInt(produto.PRECO.replace(',', '').replace('.', ''));
    
    const infinitePayLink = `https://www.infinitepay.io/checkout/${INFINITEPAY_USER}/${precoCentavos}`;

    // 6. Preenche o campo de redirecionamento do FormSubmit
    document.getElementById('infinitepay-redirect').value = infinitePayLink;

    // 7. Exibe o modal
    modal.style.display = 'block';
}


// Função para fechar o modal
function fecharModal() {
    modal.style.display = 'none';
    // Limpa os campos do formulário ao fechar
    checkoutForm.reset(); 
}

// Event Listeners (Ouvintes de Evento)
closeButton.addEventListener('click', fecharModal);

// Fecha o modal se o usuário clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});

// Inicializa a loja
carregarProdutos();
