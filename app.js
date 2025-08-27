const API_URL = 'https://backend-estoques-sabor-do-reino.onrender.com';

const productList = document.getElementById('product-list');
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const addProductButton = document.getElementById('add-product-button');
const cancelButton = document.getElementById('cancel-button');
const saveButton = document.getElementById('save-button');
const productNameInput = document.getElementById('product-name');
const productQuantityInput = document.getElementById('product-quantity');

let produtosCache = []; // Vamos guardar os produtos aqui para facilitar a edição
let editandoId = null; // Variável para saber se estamos editando ou não

// --- LÓGICA PRINCIPAL ---

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        produtosCache = await response.json(); // Salva os produtos no cache
        
        productList.innerHTML = '';
        if (produtosCache.length === 0) {
            productList.innerHTML = "<p>Nenhum produto cadastrado. Clique no '+' para começar!</p>";
            return;
        }

        produtosCache.forEach(produto => {
            const item = document.createElement('div');
            item.className = 'product-item';
            if (produto.quantidade <= 5) item.classList.add('low-stock');

            item.innerHTML = `
                <div class="product-info">
                    <span class="product-name">${produto.nome}</span>
                </div>
                <div class="product-actions">
                    <div class="stock-controls">
                        <button class="control-button btn-minus" data-id="${produto._id}">-</button>
                        <span class="stock-quantity">${produto.quantidade}</span>
                        <button class="control-button btn-plus" data-id="${produto._id}">+</button>
                    </div>
                    <button class="action-button btn-edit" data-id="${produto._id}">✏️</button>
                    <button class="action-button btn-delete" data-id="${produto._id}">🗑️</button>
                </div>
            `;
            productList.appendChild(item);
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productList.innerHTML = "<p style='color: red;'>Não foi possível conectar ao servidor.</p>";
    }
}

// Listener de cliques na lista de produtos
productList.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;

    // Lógica para +/-
    if (button.classList.contains('control-button')) {
        const incremento = button.classList.contains('btn-plus') ? 1 : -1;
        try {
            await fetch(`${API_URL}/produtos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ incremento })
            });
            carregarProdutos();
        } catch (error) {
            console.error("Erro ao atualizar quantidade:", error);
        }
    }

    // Lógica para Editar
    if (button.classList.contains('btn-edit')) {
        abrirModalParaEditar(id);
    }

    // Lógica para Excluir
    if (button.classList.contains('btn-delete')) {
        const querExcluir = confirm("Tem certeza que deseja excluir este produto?");
        if (querExcluir) {
            try {
                await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
                carregarProdutos();
            } catch (error) {
                console.error("Erro ao excluir produto:", error);
            }
        }
    }
});


// --- LÓGICA DO MODAL ---

function abrirModalParaAdicionar() {
    editandoId = null; // Garante que não estamos em modo de edição
    modalTitle.innerText = "Novo Produto";
    productNameInput.value = "";
    productQuantityInput.value = "";
    modalContainer.style.display = 'flex';
}

function abrirModalParaEditar(id) {
    editandoId = id;
    const produto = produtosCache.find(p => p._id === id); // Busca o produto no nosso cache
    if (!produto) return;

    modalTitle.innerText = "Editar Produto";
    productNameInput.value = produto.nome;
    productQuantityInput.value = produto.quantidade;
    modalContainer.style.display = 'flex';
}

function fecharModal() {
    modalContainer.style.display = 'none';
}

addProductButton.addEventListener('click', abrirModalParaAdicionar);
cancelButton.addEventListener('click', fecharModal);

saveButton.addEventListener('click', async () => {
    const nome = productNameInput.value;
    const quantidade = parseInt(productQuantityInput.value);

    if (!nome || isNaN(quantidade)) {
        alert("Por favor, preencha o nome e a quantidade corretamente.");
        return;
    }

    const dados = { nome, quantidade };
    
    try {
        if (editandoId) {
            // Se estamos editando, usamos o método PUT
            await fetch(`${API_URL}/produtos/${editandoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        } else {
            // Se não, estamos criando, usamos o método POST
            await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        }
        fecharModal();
        carregarProdutos();
    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        alert("Ocorreu um erro ao salvar.");
    }
});

// --- INICIALIZAÇÃO ---

carregarProdutos();
