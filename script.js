// --- VARIÁVEIS GLOBAIS ---
const API_KEY = "AIzaSyDBdfuNCfQcxINcNmAt70gWJAAVNXEBua4";
const SPREADSHEET_ID = "1mV3hHTS9U8Z9zXFJ9UK0cMJ3kpZPGHe4VIldDv6nOdA";
const ABA = "Products";
let produtos = [], carrinho = [];
let timerInatividadeBusca, timerInatividadeCodigo;
const TEMPO_INATIVIDADE = 5 * 60 * 1000; // 5 minutos

// --- CARREGAMENTO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
  aplicarConfigSalvas();
  carregarProdutos();
});

function carregarProdutos() {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ABA}!A2:C?key=${API_KEY}`)
      .then(r => r.json())
      .then(res => {
        produtos = (res.values || [])
          .filter(l => l[0] && l[0].trim())
          .map(l => ({
            nome: l[0].trim(),
            codigo: l[1],
            preco: parseFloat((l[2] || '').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
          }));
      })
      .catch(error => {
          console.error('Erro ao buscar dados da planilha:', error);
          alert("Erro ao carregar os produtos. Verifique a chave de API, ID da planilha e conexão.");
      });
}

// --- FUNÇÕES DE CONFIGURAÇÃO (TEMA E RESOLUÇÃO) ---
function aplicarConfigSalvas() {
    // Aplica o modo escuro salvo
    const darkModeSalvo = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', darkModeSalvo);
    
    // Aplica o zoom salvo
    const zoomSalvo = localStorage.getItem('zoomLevel') || '1';
    document.querySelector('.main-container').style.zoom = zoomSalvo;
    document.getElementById('resolucao').value = zoomSalvo;
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

function mudarResolucao(selectElement) {
    const zoomLevel = selectElement.value;
    document.querySelector('.main-container').style.zoom = zoomLevel;
    localStorage.setItem('zoomLevel', zoomLevel);
}

// --- FUNÇÕES DE BUSCA DE PRODUTOS ---
function mostrarSugestoes() {
  clearTimeout(timerInatividadeBusca);
  const termo = document.getElementById('busca').value.toLowerCase();
  const divSugestoes = document.getElementById('sugestoes');
  divSugestoes.innerHTML = '';
  document.getElementById('detalheProduto').innerHTML = '';

  if (!termo) return;

  const sugestoes = produtos.filter(p => p.nome.toLowerCase().includes(termo));
  sugestoes.forEach(p => {
    const el = document.createElement('div');
    el.className = 'sugestao';
    el.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)}`;
    el.onclick = () => selecionarProduto(p);
    divSugestoes.appendChild(el);
  });
  
  timerInatividadeBusca = setTimeout(limparBuscaNome, TEMPO_INATIVIDADE);
}

function selecionarProduto(produto) {
  document.getElementById('sugestoes').innerHTML = '';
  document.getElementById('busca').value = produto.nome;
  const divDetalhe = document.getElementById('detalheProduto');
  divDetalhe.innerHTML = `
    <p><strong>${produto.nome}</strong> - R$ ${produto.preco.toFixed(2)}</p>
    <div style="display: flex; align-items: center; gap: 10px;">
        <input type="number" id="quantidade" value="1" min="1" style="width: 80px;">
        <button onclick="adicionarCarrinho('${produto.nome}', ${produto.preco})">Adicionar</button>
    </div>
  `;
  document.getElementById('quantidade').focus();
}

let timeoutBuscaCodigo = null;
function iniciarBuscaCodigo() {
  clearTimeout(timeoutBuscaCodigo);
  clearTimeout(timerInatividadeCodigo);
  timeoutBuscaCodigo = setTimeout(buscarPorCodigo, 300);
}

function buscarPorCodigo() {
  const codigoInput = document.getElementById('buscaCodigo');
  const codigo = codigoInput.value.trim();
  const divResultado = document.getElementById('resultadoCodigo');

  if (!codigo) {
      divResultado.innerHTML = '';
      return;
  }

  const produto = produtos.find(p => String(p.codigo).trim() === codigo);
  if (produto) {
    adicionarCarrinho(produto.nome, produto.preco, 1);
    limparBuscaCodigo();
    codigoInput.focus();
  } else {
    divResultado.innerHTML = '<p style="color: red;">Código não encontrado.</p>';
  }
  
  timerInatividadeCodigo = setTimeout(limparBuscaCodigo, TEMPO_INATIVIDADE);
}

function limparBuscaNome() {
    document.getElementById('busca').value = '';
    document.getElementById('sugestoes').innerHTML = '';
    document.getElementById('detalheProduto').innerHTML = '';
}

function limparBuscaCodigo() {
  document.getElementById('buscaCodigo').value = '';
  document.getElementById('resultadoCodigo').innerHTML = '';
}

// --- FUNÇÕES DO CARRINHO ---
function adicionarCarrinho(nome, preco, qtde = null) {
  const quantidadeInput = document.getElementById('quantidade');
  const quantidade = qtde !== null ? qtde : parseInt(quantidadeInput?.value || 1);

  if (isNaN(quantidade) || quantidade < 1) {
      alert("Quantidade inválida.");
      return;
  }
  
  const itemExistente = carrinho.find(item => item.nome === nome);
  if (itemExistente) {
      itemExistente.quantidade += quantidade;
  } else {
      carrinho.push({ nome, preco, quantidade });
  }
  
  atualizarCarrinho();
  limparBuscaNome();
  document.getElementById('busca').focus();
}

function atualizarCarrinho() {
  const ul = document.getElementById('carrinho');
  ul.innerHTML = '';
  let total = 0;

  carrinho.forEach((item, index) => {
    const li = document.createElement('li');
    const subtotal = item.preco * item.quantidade;
    li.innerHTML = `
      <span>${item.quantidade}x ${item.nome} - <strong>R$ ${subtotal.toFixed(2)}</strong></span>
      <button onclick="removerItem(${index})">Remover</button>
    `;
    ul.appendChild(li);
    total += subtotal;
  });

  document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
}

function limparCarrinho() {
  if(carrinho.length > 0 && confirm("Tem certeza que deseja limpar o carrinho?")){
    carrinho = [];
    atualizarCarrinho();
  } else if (carrinho.length === 0) {
    carrinho = [];
    atualizarCarrinho();
  }
}

// --- FUNÇÕES DE VENDA E EXPORTAÇÃO ---
function enviarLista() {
  if (carrinho.length === 0) { alert("O carrinho está vazio!"); return; }
  let texto = "Olá! Segue minha lista de compras:\n\n";
  carrinho.forEach(item => {
    texto += `• ${item.quantidade}x ${item.nome} - R$ ${item.preco.toFixed(2)}\n`;
  });
  const total = carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0);
  texto += `\n*Total: R$ ${total.toFixed(2)}*`;
  
  const url = `https://wa.me/5566996455672?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

function salvarVenda() {
  if (carrinho.length === 0) {
    alert("O carrinho está vazio!");
    return;
  }
  document.getElementById('popupPagamento').style.display = 'flex';
}

function finalizarVenda(formaPagamento) {
  const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
  const novaVenda = {
    data: new Date().toLocaleString('pt-BR'),
    itens: carrinho.slice(),
    total: carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0),
    pagamento: formaPagamento
  };
  vendas.push(novaVenda);
  localStorage.setItem('vendas', JSON.stringify(vendas));

  alert(`Venda registrada com pagamento em ${formaPagamento}!`);
  fecharPopups();
  limparCarrinho();

  atualizarMarqueeInfo();
}

function atualizarMarqueeInfo() {
  const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
  if (vendas.length === 0) return;

  const ultimaVenda = vendas[vendas.length - 1];
  const hora = ultimaVenda.data;
  const totalDia = vendas.reduce((s, v) => s + v.total, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const contadorProdutos = {};
  vendas.forEach(venda => {
    venda.itens.forEach(item => {
      const nome = item.nome;
      contadorProdutos[nome] = (contadorProdutos[nome] || 0) + item.quantidade;
    });
  });

  const maisVendido = Object.entries(contadorProdutos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nenhum';
  const ultimoProduto = ultimaVenda.itens[ultimaVenda.itens.length - 1]?.nome || 'Nenhum';

  const marquee = document.getElementById("marquee-info");
  if (marquee) {
    marquee.textContent = `Última venda: ${hora} | Total de vendas: ${totalDia} | Mais vendido: ${maisVendido} | Último produto: ${ultimoProduto}`;
  }
}



// --- FUNÇÕES DOS POPUPS ---
function abrirConfig() { document.getElementById('popupConfig').style.display = 'flex'; }
function verVendas() {
  const popup = document.getElementById('popupVendas');
  const vendas = JSON.parse(localStorage.getItem('vendas') || '[]').reverse(); // Inverte para mostrar a mais recente primeiro
  const el = document.getElementById('vendasTexto');
  if (vendas.length === 0) {
    el.textContent = "Nenhuma venda registrada.";
  } else {
    let texto = "";
    vendas.forEach((v, i) => {
      texto += `--- Venda ${vendas.length - i} ---\nData: ${v.data}\nPagamento: ${v.pagamento}\n\n`;
      v.itens.forEach(it => texto += `• ${it.quantidade}x ${it.nome} - R$ ${it.preco.toFixed(2)}\n`);
      texto += `\nTotal: R$ ${v.total.toFixed(2)}\n\n`;
    });
    el.textContent = texto;
  }
  popup.style.display = 'flex';
}

function fecharPopups() {
    document.querySelectorAll('.popup').forEach(p => p.style.display = 'none');
}

function limparVendas() {
  if (confirm("Tem certeza que deseja apagar o histórico de TODAS as vendas?")) {
    localStorage.removeItem('vendas');
    document.getElementById('vendasTexto').textContent = "Nenhuma venda registrada.";
    alert("Histórico de vendas apagado.");
  }
}

function baixarVendas() {
  const texto = document.getElementById('vendasTexto').textContent;
  if (!texto || texto.includes("Nenhuma venda")) { alert("Não há vendas para salvar."); return; }
  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.download = `relatorio_vendas_${new Date().toISOString().split("T")[0]}.txt`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// --- ATALHOS DE TECLADO ---
document.addEventListener("keydown", function(e) {
  const isPopupOpen = Array.from(document.querySelectorAll('.popup')).some(p => p.style.display === 'flex');

  if (isPopupOpen) {
    if (e.key === 'Escape') fecharPopups();
    if (document.getElementById('popupPagamento').style.display === 'flex') {
        e.preventDefault();
        switch(e.key) {
          case "1": finalizarVenda("Dinheiro"); break;
          case "2": finalizarVenda("Pix"); break;
          case "3": finalizarVenda("Crédito"); break;
          case "4": finalizarVenda("Débito"); break;
        }
    }
    return;
  }
  
  if (e.key === "F2") {
    e.preventDefault();
    limparBuscaNome();
    document.getElementById("busca").focus();
  }
  
  if (e.key === "F3") {
    e.preventDefault();
    limparBuscaCodigo();
    document.getElementById("buscaCodigo").focus();
  }

  if (e.key === 'Enter' && document.activeElement.id === 'quantidade') {
      const addButton = document.querySelector('#detalheProduto button');
      if (addButton) addButton.click();
  }
});
document.addEventListener('DOMContentLoaded', () => {
  atualizarMarqueeInfo();
});
// --- VARIÁVEIS GLOBAIS ---
const API_KEY = "AIzaSyDBdfuNCfQcxINcNmAt70gWJAAVNXEBua4";
const SPREADSHEET_ID = "1mV3hHTS9U8Z9zXFJ9UK0cMJ3kpZPGHe4VIldDv6nOdA";
const ABA = "Products";
let produtos = [], carrinho = [];
let timerInatividadeBusca, timerInatividadeCodigo;
const TEMPO_INATIVIDADE = 5 * 60 * 1000; // 5 minutos

// --- CARREGAMENTO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
  aplicarConfigSalvas();
  carregarProdutos();
});

function carregarProdutos() {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ABA}!A2:C?key=${API_KEY}`)
      .then(r => r.json())
      .then(res => {
        produtos = (res.values || [])
          .filter(l => l[0] && l[0].trim())
          .map(l => ({
            nome: l[0].trim(),
            codigo: l[1],
            preco: parseFloat((l[2] || '').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
          }));
      })
      .catch(error => {
          console.error('Erro ao buscar dados da planilha:', error);
          alert("Erro ao carregar os produtos. Verifique a chave de API, ID da planilha e conexão.");
      });
}

// --- FUNÇÕES DE CONFIGURAÇÃO (TEMA E RESOLUÇÃO) ---
function aplicarConfigSalvas() {
    // Aplica o modo escuro salvo
    const darkModeSalvo = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', darkModeSalvo);
    
    // Aplica o zoom salvo
    const zoomSalvo = localStorage.getItem('zoomLevel') || '1';
    document.querySelector('.main-container').style.zoom = zoomSalvo;
    document.getElementById('resolucao').value = zoomSalvo;
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

function mudarResolucao(selectElement) {
    const zoomLevel = selectElement.value;
    document.querySelector('.main-container').style.zoom = zoomLevel;
    localStorage.setItem('zoomLevel', zoomLevel);
}

// --- FUNÇÕES DE BUSCA DE PRODUTOS ---
function mostrarSugestoes() {
  clearTimeout(timerInatividadeBusca);
  const termo = document.getElementById('busca').value.toLowerCase();
  const divSugestoes = document.getElementById('sugestoes');
  divSugestoes.innerHTML = '';
  document.getElementById('detalheProduto').innerHTML = '';

  if (!termo) return;

  const sugestoes = produtos.filter(p => p.nome.toLowerCase().includes(termo));
  sugestoes.forEach(p => {
    const el = document.createElement('div');
    el.className = 'sugestao';
    el.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)}`;
    el.onclick = () => selecionarProduto(p);
    divSugestoes.appendChild(el);
  });
  
  timerInatividadeBusca = setTimeout(limparBuscaNome, TEMPO_INATIVIDADE);
}

function selecionarProduto(produto) {
  document.getElementById('sugestoes').innerHTML = '';
  document.getElementById('busca').value = produto.nome;
  const divDetalhe = document.getElementById('detalheProduto');
  divDetalhe.innerHTML = `
    <p><strong>${produto.nome}</strong> - R$ ${produto.preco.toFixed(2)}</p>
    <div style="display: flex; align-items: center; gap: 10px;">
        <input type="number" id="quantidade" value="1" min="1" style="width: 80px;">
        <button onclick="adicionarCarrinho('${produto.nome}', ${produto.preco})">Adicionar</button>
    </div>
  `;
  document.getElementById('quantidade').focus();
}

let timeoutBuscaCodigo = null;
function iniciarBuscaCodigo() {
  clearTimeout(timeoutBuscaCodigo);
  clearTimeout(timerInatividadeCodigo);
  timeoutBuscaCodigo = setTimeout(buscarPorCodigo, 300);
}

function buscarPorCodigo() {
  const codigoInput = document.getElementById('buscaCodigo');
  const codigo = codigoInput.value.trim();
  const divResultado = document.getElementById('resultadoCodigo');

  if (!codigo) {
      divResultado.innerHTML = '';
      return;
  }

  const produto = produtos.find(p => String(p.codigo).trim() === codigo);
  if (produto) {
    adicionarCarrinho(produto.nome, produto.preco, 1);
    limparBuscaCodigo();
    codigoInput.focus();
  } else {
    divResultado.innerHTML = '<p style="color: red;">Código não encontrado.</p>';
  }
  
  timerInatividadeCodigo = setTimeout(limparBuscaCodigo, TEMPO_INATIVIDADE);
}

function limparBuscaNome() {
    document.getElementById('busca').value = '';
    document.getElementById('sugestoes').innerHTML = '';
    document.getElementById('detalheProduto').innerHTML = '';
}

function limparBuscaCodigo() {
  document.getElementById('buscaCodigo').value = '';
  document.getElementById('resultadoCodigo').innerHTML = '';
}

// --- FUNÇÕES DO CARRINHO ---
function adicionarCarrinho(nome, preco, qtde = null) {
  const quantidadeInput = document.getElementById('quantidade');
  const quantidade = qtde !== null ? qtde : parseInt(quantidadeInput?.value || 1);

  if (isNaN(quantidade) || quantidade < 1) {
      alert("Quantidade inválida.");
      return;
  }
  
  const itemExistente = carrinho.find(item => item.nome === nome);
  if (itemExistente) {
      itemExistente.quantidade += quantidade;
  } else {
      carrinho.push({ nome, preco, quantidade });
  }
  
  atualizarCarrinho();
  limparBuscaNome();
  document.getElementById('busca').focus();
}

function atualizarCarrinho() {
  const ul = document.getElementById('carrinho');
  ul.innerHTML = '';
  let total = 0;

  carrinho.forEach((item, index) => {
    const li = document.createElement('li');
    const subtotal = item.preco * item.quantidade;
    li.innerHTML = `
      <span>${item.quantidade}x ${item.nome} - <strong>R$ ${subtotal.toFixed(2)}</strong></span>
      <button onclick="removerItem(${index})">Remover</button>
    `;
    ul.appendChild(li);
    total += subtotal;
  });

  document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
}

function limparCarrinho() {
  if(carrinho.length > 0 && confirm("Tem certeza que deseja limpar o carrinho?")){
    carrinho = [];
    atualizarCarrinho();
  } else if (carrinho.length === 0) {
    carrinho = [];
    atualizarCarrinho();
  }
}

// --- FUNÇÕES DE VENDA E EXPORTAÇÃO ---
function enviarLista() {
  if (carrinho.length === 0) { alert("O carrinho está vazio!"); return; }
  let texto = "Olá! Segue minha lista de compras:\n\n";
  carrinho.forEach(item => {
    texto += `• ${item.quantidade}x ${item.nome} - R$ ${item.preco.toFixed(2)}\n`;
  });
  const total = carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0);
  texto += `\n*Total: R$ ${total.toFixed(2)}*`;
  
  const url = `https://wa.me/5566996455672?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

function salvarVenda() {
  if (carrinho.length === 0) {
    alert("O carrinho está vazio!");
    return;
  }
  document.getElementById('popupPagamento').style.display = 'flex';
}

function finalizarVenda(formaPagamento) {
  const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
  const novaVenda = {
    data: new Date().toLocaleString('pt-BR'),
    itens: carrinho.slice(),
    total: carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0),
    pagamento: formaPagamento
  };
  vendas.push(novaVenda);
  localStorage.setItem('vendas', JSON.stringify(vendas));

  alert(`Venda registrada com pagamento em ${formaPagamento}!`);
  fecharPopups();
  limparCarrinho();

  atualizarMarqueeInfo();
}

function atualizarMarqueeInfo() {
  const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
  if (vendas.length === 0) return;

  const ultimaVenda = vendas[vendas.length - 1];
  const hora = ultimaVenda.data;
  const totalDia = vendas.reduce((s, v) => s + v.total, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const contadorProdutos = {};
  vendas.forEach(venda => {
    venda.itens.forEach(item => {
      const nome = item.nome;
      contadorProdutos[nome] = (contadorProdutos[nome] || 0) + item.quantidade;
    });
  });

  const maisVendido = Object.entries(contadorProdutos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nenhum';
  const ultimoProduto = ultimaVenda.itens[ultimaVenda.itens.length - 1]?.nome || 'Nenhum';

  const marquee = document.getElementById("marquee-info");
  if (marquee) {
    marquee.textContent = `Última venda: ${hora} | Total de vendas: ${totalDia} | Mais vendido: ${maisVendido} | Último produto: ${ultimoProduto}`;
  }
}



// --- FUNÇÕES DOS POPUPS ---
function abrirConfig() { document.getElementById('popupConfig').style.display = 'flex'; }
function verVendas() {
  const popup = document.getElementById('popupVendas');
  const vendas = JSON.parse(localStorage.getItem('vendas') || '[]').reverse(); // Inverte para mostrar a mais recente primeiro
  const el = document.getElementById('vendasTexto');
  if (vendas.length === 0) {
    el.textContent = "Nenhuma venda registrada.";
  } else {
    let texto = "";
    vendas.forEach((v, i) => {
      texto += `--- Venda ${vendas.length - i} ---\nData: ${v.data}\nPagamento: ${v.pagamento}\n\n`;
      v.itens.forEach(it => texto += `• ${it.quantidade}x ${it.nome} - R$ ${it.preco.toFixed(2)}\n`);
      texto += `\nTotal: R$ ${v.total.toFixed(2)}\n\n`;
    });
    el.textContent = texto;
  }
  popup.style.display = 'flex';
}

function fecharPopups() {
    document.querySelectorAll('.popup').forEach(p => p.style.display = 'none');
}

function limparVendas() {
  if (confirm("Tem certeza que deseja apagar o histórico de TODAS as vendas?")) {
    localStorage.removeItem('vendas');
    document.getElementById('vendasTexto').textContent = "Nenhuma venda registrada.";
    alert("Histórico de vendas apagado.");
  }
}

function baixarVendas() {
  const texto = document.getElementById('vendasTexto').textContent;
  if (!texto || texto.includes("Nenhuma venda")) { alert("Não há vendas para salvar."); return; }
  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.download = `relatorio_vendas_${new Date().toISOString().split("T")[0]}.txt`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// --- ATALHOS DE TECLADO ---
document.addEventListener("keydown", function(e) {
  const isPopupOpen = Array.from(document.querySelectorAll('.popup')).some(p => p.style.display === 'flex');

  if (isPopupOpen) {
    if (e.key === 'Escape') fecharPopups();
    if (document.getElementById('popupPagamento').style.display === 'flex') {
        e.preventDefault();
        switch(e.key) {
          case "1": finalizarVenda("Dinheiro"); break;
          case "2": finalizarVenda("Pix"); break;
          case "3": finalizarVenda("Crédito"); break;
          case "4": finalizarVenda("Débito"); break;
        }
    }
    return;
  }
  
  if (e.key === "F2") {
    e.preventDefault();
    limparBuscaNome();
    document.getElementById("busca").focus();
  }
  
  if (e.key === "F3") {
    e.preventDefault();
    limparBuscaCodigo();
    document.getElementById("buscaCodigo").focus();
  }

  if (e.key === 'Enter' && document.activeElement.id === 'quantidade') {
      const addButton = document.querySelector('#detalheProduto button');
      if (addButton) addButton.click();
  }
});
document.addEventListener('DOMContentLoaded', () => {
  atualizarMarqueeInfo();
});
