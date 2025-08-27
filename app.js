// O endereço do seu backend. Quando for publicar, terá que mudar isso.
const API_URL = 'http://localhost:3000';

// Elementos da página
const productList = document.getElementById('product-list');

// Elementos do Modal
const modalContainer = document.getElementById('modal-container');
const addProductButton = document.getElementById('add-product-button');
const cancelButton = document.getElementById('cancel-button');
const saveButton = document.getElementById('save-button');
const productNameInput = document.getElementById('product-name');
const productQuantityInput = document.getElementById('product-quantity');


// --- LÓGICA DO ESTOQUE ---

// Função para carregar os produtos do nosso backend
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const produtos = await response.json();
        
        productList.innerHTML = ''; // Limpa a lista
        if (produtos.length === 0) {
            productList.innerHTML = "<p>Nenhum produto cadastrado. Clique no '+' para começar!</p>";
            return;
        }

        produtos.forEach(produto => {
            const item = document.createElement('div');
            item.className = 'product-item';
            if (produto.quantidade <= 5) {
                item.classList.add('low-stock');
            }

            // Usamos produto._id que é o ID que vem do MongoDB
            item.innerHTML = `
                <span class="product-name">${produto.nome}</span>
                <div class="stock-controls">
                    <button class="control-button btn-minus" data-id="${produto._id}">-</button>
                    <span class="stock-quantity">${produto.quantidade}</span>
                    <button class="control-button btn-plus" data-id="${produto._id}">+</button>
                </div>
            `;
            productList.appendChild(item);
        });

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productList.innerHTML = "<p style='color: red;'>Não foi possível conectar ao servidor.</p>";
    }
}

// Event listener para os botões de + e -
productList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('control-button')) {
        const id = e.target.dataset.id;
        const incremento = e.target.classList.contains('btn-plus') ? 1 : -1;

        try {
            await fetch(`${API_URL}/produtos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ incremento: incremento })
            });
            // Recarrega a lista para mostrar a atualização
            carregarProdutos();
        } catch (error) {
            console.error("Erro ao atualizar quantidade:", error);
        }
    }
});


// --- LÓGICA DO MODAL (ADICIONAR PRODUTO) ---

addProductButton.addEventListener('click', () => {
    modalContainer.style.display = 'flex';
});

cancelButton.addEventListener('click', () => {
    modalContainer.style.display = 'none';
    productNameInput.value = '';
    productQuantityInput.value = '';
});

saveButton.addEventListener('click', async () => {
    const nome = productNameInput.value;
    const quantidade = parseInt(productQuantityInput.value);

    if (nome && !isNaN(quantidade)) {
        try {
            await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome, quantidade: quantidade })
            });

            modalContainer.style.display = 'none';
            productNameInput.value = '';
            productQuantityInput.value = '';
            carregarProdutos(); // Recarrega para mostrar o novo produto
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            alert("Ocorreu um erro ao salvar.");
        }
    } else {
        alert("Por favor, preencha o nome e a quantidade.");
    }
});

// --- CARREGA OS PRODUTOS QUANDO A PÁGINA ABRE ---
carregarProdutos();