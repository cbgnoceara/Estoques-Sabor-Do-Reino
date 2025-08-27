// A URL do backend não muda
const API_URL = 'https://backend-estoques-sabor-do-reino.onrender.com';

// Elementos da UI
const productList = document.getElementById('product-list');
const addProductButton = document.getElementById('add-product-button');

// Elementos do Modal
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const cancelButton = document.getElementById('cancel-button');
const saveButton = document.getElementById('save-button');
const productNameInput = document.getElementById('product-name');
const productQuantityInput = document.getElementById('product-quantity');
const quantityLabel = document.getElementById('quantity-label');

// Novos elementos do Modal
const unitSelection = document.getElementById('unit-selection');
const mainFields = document.getElementById('main-fields');
const kgTypeSelection = document.getElementById('kg-type-selection');
const kgTypeGroup = document.getElementById('kg-type');
const variationsContainer = document.getElementById('variations-container');
const variationsList = document.getElementById('variations-list');
const addVariationButton = document.getElementById('add-variation-button');

let produtosCache = [];
let editandoId = null;

// --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        produtosCache = await response.json();
        productList.innerHTML = '';

        if (produtosCache.length === 0) {
            productList.innerHTML = "<p style='text-align: center; color: #6c757d;'>Nenhum produto cadastrado.<br>Clique no '+' para começar!</p>";
            return;
        }

        produtosCache.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'product-card';
            if (produto.quantidade <= 5) card.classList.add('low-stock');

            // Lógica para renderizar o card correto baseado na unidade de medida
            if (produto.unidadeDeMedida === 'UN') {
                renderCardUnidade(card, produto);
            } else if (produto.unidadeDeMedida === 'KG') {
                if (produto.variacoes && produto.variacoes.length > 0) {
                    renderCardVariacoes(card, produto); // Açaí
                } else {
                    renderCardGranel(card, produto); // Queijo
                }
            }
            productList.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productList.innerHTML = "<p style='text-align: center; color: red;'>Não foi possível conectar ao servidor.</p>";
    }
}

// --- FUNÇÕES DE RENDERIZAÇÃO DOS CARDS ---

function renderCardUnidade(cardElement, produto) {
    cardElement.innerHTML = `
        <h3 class="card-title">${produto.nome}</h3>
        <div class="product-actions">
            <div class="stock-controls">
                <button class="control-button btn-minus" data-id="${produto._id}">-</button>
                <span class="stock-quantity">${produto.quantidade}</span>
                <button class="control-button btn-plus" data-id="${produto._id}">+</button>
            </div>
            <div class="card-options">
                <button class="options-button" data-id="${produto._id}">⋮</button>
                <div class="options-menu"><button class="btn-edit" data-id="${produto._id}">✏️ Editar</button><button class="btn-delete" data-id="${produto._id}">🗑️ Excluir</button></div>
            </div>
        </div>
    `;
}

function renderCardGranel(cardElement, produto) {
    cardElement.innerHTML = `
        <h3 class="card-title">${produto.nome}</h3>
        <div class="product-actions">
            <div class="stock-controls" style="width: 100%; justify-content: center; cursor: pointer;" data-id="${produto._id}" data-action="sell-kg">
                <span class="stock-quantity">${produto.quantidade.toFixed(3)} KG</span>
            </div>
            <div class="card-options">
                <button class="options-button" data-id="${produto._id}">⋮</button>
                <div class="options-menu"><button class="btn-edit" data-id="${produto._id}">✏️ Editar</button><button class="btn-delete" data-id="${produto._id}">🗑️ Excluir</button></div>
            </div>
        </div>
    `;
}

function renderCardVariacoes(cardElement, produto) {
    const variacoesHTML = produto.variacoes.map(v => 
        `<button class="variation-button" data-id="${produto._id}" data-variacao-nome="${v.nome}">Vender ${v.nome}</button>`
    ).join('');
    
    cardElement.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="card-title">${produto.nome} - Total: ${produto.quantidade.toFixed(3)} KG</h3>
            <div class="card-options">
                <button class="options-button" data-id="${produto._id}">⋮</button>
                <div class="options-menu"><button class="btn-edit" data-id="${produto._id}">✏️ Editar</button><button class="btn-delete" data-id="${produto._id}">🗑️ Excluir</button></div>
            </div>
        </div>
        <div class="card-variations">${variacoesHTML}</div>
    `;
}

// --- LÓGICA DE INTERAÇÃO COM OS CARDS ---

productList.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    // Ações comuns (menu de opções, editar, excluir)
    if (target.classList.contains('options-button')) {
        const menu = target.nextElementSibling;
        document.querySelectorAll('.options-menu.show').forEach(m => {
            if (m !== menu) m.classList.remove('show');
        });
        menu.classList.toggle('show');
    }
    if (target.classList.contains('btn-edit')) {
        abrirModalParaEditar(id);
    }
    if (target.classList.contains('btn-delete')) {
        const produto = produtosCache.find(p => p._id === id);
        if (confirm(`Tem certeza que deseja excluir "${produto.nome}"?`)) {
            await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
            carregarProdutos();
        }
    }

    // Ações específicas de venda
    if (target.classList.contains('control-button')) { // Venda de UNIDADE
        const incremento = target.classList.contains('btn-plus') ? 1 : -1;
        await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'UN', valor: incremento })
        });
        carregarProdutos();
    }

    if (target.closest('[data-action="sell-kg"]')) { // Venda a GRANEL
        const pesoVendidoStr = prompt("Qual o peso vendido em KG? (Use ponto para decimais, ex: 0.250)");
        const pesoVendido = parseFloat(pesoVendidoStr);
        if (pesoVendido > 0) {
            await fetch(`${API_URL}/produtos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: 'KG', valor: -pesoVendido })
            });
            carregarProdutos();
        }
    }

    if (target.classList.contains('variation-button')) { // Venda de VARIAÇÃO
        const variacaoNome = target.dataset.variacaoNome;
        await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'VARIACAO', valor: { nome: variacaoNome, quantidade: 1 } })
        });
        carregarProdutos();
    }
});

// Fecha menu de opções ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-options')) {
        document.querySelectorAll('.options-menu.show').forEach(menu => menu.classList.remove('show'));
    }
});

// --- LÓGICA DO NOVO MODAL INTELIGENTE ---

function resetModal() {
    // Esconde todos os passos opcionais
    [mainFields, kgTypeSelection, variationsContainer].forEach(el => el.classList.add('hidden'));
    // Limpa seleções e campos
    unitSelection.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    kgTypeGroup.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    variationsList.innerHTML = '';
    productNameInput.value = '';
    productQuantityInput.value = '';
    editandoId = null;
}

function abrirModalParaAdicionar() {
    resetModal();
    modalTitle.innerText = "Novo Produto";
    modalContainer.style.display = 'flex';
}

function fecharModal() {
    modalContainer.style.display = 'none';
}

addProductButton.addEventListener('click', abrirModalParaAdicionar);
cancelButton.addEventListener('click', fecharModal);

// Lógica de seleção no modal
unitSelection.addEventListener('click', e => {
    const target = e.target.closest('button');
    if (!target) return;
    
    unitSelection.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    target.classList.add('selected');

    mainFields.classList.remove('hidden');
    if (target.dataset.value === 'UN') {
        kgTypeSelection.classList.add('hidden');
        variationsContainer.classList.add('hidden');
        quantityLabel.innerText = "Quantidade Inicial";
        productQuantityInput.placeholder = "Ex: 50";
    } else { // KG
        kgTypeSelection.classList.remove('hidden');
        quantityLabel.innerText = "Peso Total em Estoque (KG)";
        productQuantityInput.placeholder = "Ex: 7.5";
    }
});

kgTypeGroup.addEventListener('click', e => {
    const target = e.target.closest('button');
    if (!target) return;

    kgTypeGroup.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    target.classList.add('selected');

    if (target.dataset.value === 'PORTIONS') {
        variationsContainer.classList.remove('hidden');
    } else {
        variationsContainer.classList.add('hidden');
    }
});

// Lógica para adicionar/remover variações
function criarLinhaDeVariacao(nome = '', peso = '') {
    const div = document.createElement('div');
    div.className = 'variation-item';
    div.innerHTML = `
        <input type="text" class="variation-name" placeholder="Nome (Ex: Pote P)" value="${nome}">
        <input type="number" class="variation-weight" placeholder="Peso em Gramas" value="${peso}">
        <button class="btn-remove-variation">-</button>
    `;
    variationsList.appendChild(div);
}

addVariationButton.addEventListener('click', () => criarLinhaDeVariacao());

variationsList.addEventListener('click', e => {
    if (e.target.classList.contains('btn-remove-variation')) {
        e.target.parentElement.remove();
    }
});


// Lógica para SALVAR (agora bem mais complexa)
saveButton.addEventListener('click', async () => {
    const unidadeSelecionada = unitSelection.querySelector('.selected')?.dataset.value;
    if (!unidadeSelecionada) {
        alert("Por favor, selecione como o produto é vendido.");
        return;
    }

    const nome = productNameInput.value;
    const quantidade = parseFloat(productQuantityInput.value);

    if (!nome || isNaN(quantidade)) {
        alert("Por favor, preencha o nome e a quantidade/peso corretamente.");
        return;
    }

    const dados = { nome, quantidade, unidadeDeMedida: unidadeSelecionada };

    if (unidadeSelecionada === 'KG') {
        const tipoKgSelecionado = kgTypeGroup.querySelector('.selected')?.dataset.value;
        if (!tipoKgSelecionado) {
            alert("Por favor, selecione o tipo de venda por peso.");
            return;
        }

        if (tipoKgSelecionado === 'PORTIONS') {
            dados.variacoes = [];
            const linhas = variationsList.querySelectorAll('.variation-item');
            for (const linha of linhas) {
                const nomeVar = linha.querySelector('.variation-name').value;
                const pesoG = parseFloat(linha.querySelector('.variation-weight').value);
                if (nomeVar && !isNaN(pesoG)) {
                    dados.variacoes.push({ nome: nomeVar, pesoKg: pesoG / 1000 }); // Converte de gramas para KG
                }
            }
            if(dados.variacoes.length === 0){
                alert("Adicione pelo menos uma porção válida.");
                return;
            }
        }
    }
    
    try {
        const url = editandoId ? `${API_URL}/produtos/${editandoId}` : `${API_URL}/produtos`;
        const method = editandoId ? 'PUT' : 'POST';
        
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        fecharModal();
        carregarProdutos();
    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        alert("Ocorreu um erro ao salvar.");
    }
});

// --- NOVA FUNÇÃO DE EDITAR ---
function abrirModalParaEditar(id) {
    const produto = produtosCache.find(p => p._id === id);
    if (!produto) return;

    resetModal();
    editandoId = id;
    modalTitle.innerText = "Editar Produto";

    // Preenche os campos principais
    productNameInput.value = produto.nome;
    productQuantityInput.value = produto.quantidade;

    // Seleciona a unidade de medida
    const unitButton = unitSelection.querySelector(`[data-value="${produto.unidadeDeMedida}"]`);
    if (unitButton) {
        unitButton.classList.add('selected');
    }

    // Mostra o bloco principal de campos
    mainFields.classList.remove('hidden');

    if (produto.unidadeDeMedida === 'UN') {
        quantityLabel.innerText = "Quantidade";
    } else if (produto.unidadeDeMedida === 'KG') {
        quantityLabel.innerText = "Peso Total em Estoque (KG)";
        kgTypeSelection.classList.remove('hidden');

        const hasVariations = produto.variacoes && produto.variacoes.length > 0;
        const kgType = hasVariations ? 'PORTIONS' : 'GRANEL';

        const kgTypeButton = kgTypeGroup.querySelector(`[data-value="${kgType}"]`);
        if (kgTypeButton) {
            kgTypeButton.classList.add('selected');
        }

        if (hasVariations) {
            variationsContainer.classList.remove('hidden');
            // Limpa a lista antes de adicionar (resetModal já faz isso, mas é uma garantia)
            variationsList.innerHTML = ''; 
            produto.variacoes.forEach(v => {
                // Converte o peso de KG para gramas ao preencher o campo
                criarLinhaDeVariacao(v.nome, v.pesoKg * 1000);
            });
        }
    }

    // Abre o modal
    modalContainer.style.display = 'flex';
}


// --- INICIALIZAÇÃO ---
carregarProdutos();