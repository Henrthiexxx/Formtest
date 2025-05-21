const container = document.getElementById('cartItems');
const totalSpan = document.getElementById('cartTotal');
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let total = 0;

function renderCarrinho() {
  container.innerHTML = '';
  total = 0;

  if (carrinho.length === 0) {
    container.innerHTML = '<p style="text-align:center">Seu carrinho está vazio.</p>';
    totalSpan.textContent = 'R$ 0,00';
    return;
  }

  carrinho.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    const preco = parseFloat(item.preco || 0);
    total += preco;

    div.innerHTML = `
      <img src="https://via.placeholder.com/60" alt="${item.produto || 'Pizza'}" />
      <div class="item-info">
        <p class="item-name">${item.produto || 'Pizza'}</p>
        <p class="item-qty">${item.tamanho || '1 unidade'}</p>
      </div>
      <p class="item-price">R$ ${preco.toFixed(2)}</p>
      <button class="remove-btn" onclick="removerItem(${index})">&times;</button>
    `;
    container.appendChild(div);
  });

  totalSpan.textContent = `R$ ${total.toFixed(2)}`;
}

function removerItem(index) {
  carrinho.splice(index, 1);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  renderCarrinho();
}

function limparCarrinho() {
  if (confirm("Deseja limpar o carrinho?")) {
    localStorage.removeItem('carrinho');
    renderCarrinho();
  }
}

function finalizarCompra() {
  alert("Compra finalizada! Total: " + totalSpan.textContent);
  localStorage.removeItem('carrinho');
  renderCarrinho();
}

function fechar() {
  window.location.href = 'index.html';
}

window.onload = renderCarrinho;
