let etapaAtual = 1;
let tamanhoPizza = '';
let valorBase = 0;
let limiteSabores = 4;

function proximaEtapa(n) {
  if (n > etapaAtual + 1) return;

  // Atualiza valor ao entrar na etapa 3
  if (n === 3) {
    atualizarValorTotal();
  }

  document.getElementById("etapa" + etapaAtual).classList.remove("ativa");
  document.getElementById("etapa" + n).classList.add("ativa");
  etapaAtual = n;
}

function voltarEtapa(n) {
  proximaEtapa(n);
}

function toggleSelect(groupSelector, type, limit = null) {
  document.querySelectorAll(`${groupSelector} input`).forEach(el => {
    el.addEventListener("change", () => {
      const label = el.closest("label");
      if (type === "radio") {
        document.querySelectorAll(`${groupSelector} .btn-option`).forEach(l => l.classList.remove("selected"));
        label.classList.add("selected");
      } else if (type === "checkbox") {
        label.classList.toggle("selected", el.checked);
        const checked = document.querySelectorAll(`${groupSelector} input:checked`);
        if (limit && checked.length > limit) {
          el.checked = false;
          label.classList.remove("selected");
          exibirPopup(`Máximo de ${limit} opções.`);
        }
      }
    });
  });
}

function verificarTamanho() {
  const selecionado = document.querySelector('input[name="tamanho"]:checked');
  if (!selecionado) {
    exibirPopup("Escolha um tamanho de pizza antes de continuar.");
    return;
  }

  tamanhoPizza = selecionado.value;

  if (tamanhoPizza === "Pequena") {
    valorBase = 30;
    limiteSabores = 2;
  } else if (tamanhoPizza === "Média") {
    valorBase = 40;
    limiteSabores = 4;
  } else if (tamanhoPizza === "Grande") {
    valorBase = 50;
    limiteSabores = 4;
  }

  toggleSelect("#saboresGroup", "checkbox", limiteSabores);
  proximaEtapa(2);
}

function verificarSabores() {
  const saboresSelecionados = document.querySelectorAll('#saboresGroup input:checked');
  if (saboresSelecionados.length === 0) {
    exibirPopup("⚠️ Você precisa escolher pelo menos 1 sabor.");
    return;
  }

  if (saboresSelecionados.length > limiteSabores) {
    exibirPopup(`Máximo de ${limiteSabores} sabores para a pizza ${tamanhoPizza}.`);
    return;
  }

  atualizarValorTotal();
  proximaEtapa(3);
}

function atualizarValorTotal() {
  const saboresSelecionados = document.querySelectorAll('#saboresGroup input:checked');
  let precoFinal = valorBase;

  const bordaSelecionada = document.querySelector('input[name="borda"]:checked');
  if (bordaSelecionada && bordaSelecionada.value) {
    precoFinal += 10;
  }

  const adicionaisSelecionados = document.querySelectorAll('input[name="adicional"]:checked');
  precoFinal += adicionaisSelecionados.length * 1;

  // Quantidade, se existir
  const qtdEl = document.getElementById("qtdPizza");
  const qtd = qtdEl ? parseInt(qtdEl.innerText) : 1;
  precoFinal *= qtd;

  window.precoFinalPizza = precoFinal;
  const valorTotal = document.getElementById("valorTotal");
  if (valorTotal) {
    valorTotal.innerText = `Total: R$ ${precoFinal.toFixed(2)}`;
  }
}

function salvarPedido() {
  const form = document.getElementById("formPizza");
  const dados = new FormData(form);

  const sabores = dados.getAll("sabor");
  const borda = dados.get("borda") || "Sem borda";
  const adicionais = dados.getAll("adicional");
  const tamanho = tamanhoPizza || dados.get("tamanho");

  const qtdEl = document.getElementById("qtdPizza");
  const quantidade = qtdEl ? parseInt(qtdEl.innerText) : 1;

  const item = {
    produto: "Pizza",
    tamanho,
    sabores,
    borda,
    adicionais,
    quantidade,
    preco: window.precoFinalPizza || 0,
    data: new Date().toISOString()
  };

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  carrinho.push(item);
  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  exibirPopup("✅ Pedido adicionado ao carrinho!");
}

function clearCart() {
  const oldCart = localStorage.getItem('carrinho');
  if (oldCart) {
    exibirPopupConfirmacao("Deseja limpar todos os itens do carrinho?", () => {
      localStorage.setItem('historico', oldCart);
      localStorage.removeItem('carrinho');
      location.reload();
    });
  }
}

function exibirPopup(mensagem) {
  document.getElementById("popupMessage").innerText = mensagem;
  document.getElementById("customPopup").classList.remove("hidden");
}

function fecharPopup() {
  document.getElementById("customPopup").classList.add("hidden");
}

function exibirPopupConfirmacao(mensagem, callbackSim) {
  const popup = document.getElementById("customPopup");
  const mensagemEl = document.getElementById("popupMessage");
  const botoes = document.createElement("div");

  mensagemEl.innerText = mensagem;
  botoes.innerHTML = `
    <button onclick="fecharPopup();">Cancelar</button>
    <button onclick="fecharPopup(); (${callbackSim.toString()})();">OK</button>
  `;
  mensagemEl.appendChild(botoes);
  popup.classList.remove("hidden");
}

window.onload = () => {
  toggleSelect("#tamanhoGroup", "radio");
  toggleSelect("#saboresGroup", "checkbox", limiteSabores);
  toggleSelect("#bordaGroup", "radio");
  toggleSelect("#adicionaisGroup", "checkbox", 3);
};
