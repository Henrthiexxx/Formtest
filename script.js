let etapaAtual = 2;

function proximaEtapa(n) {
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

function verificarSabores() {
  const saboresSelecionados = document.querySelectorAll('#saboresGroup input:checked');
  if (saboresSelecionados.length === 0) {
    exibirPopup("⚠️ Você precisa escolher pelo menos 1 sabor antes de continuar.");
    return;
  }
  proximaEtapa(3);
}

function salvarPedido() {
  const form = document.getElementById("formPizza");
  const dados = new FormData(form);

  const sabores = dados.getAll("sabor").join(", ");
  const borda = dados.get("borda") || "Sem borda";
  const adicionais = dados.getAll("adicional").join(", ") || "Sem adicionais";

  const resumo = `Pedido:\n- Sabores: ${sabores}\n- Borda: ${borda}\n- Adicionais: ${adicionais}`;
  exibirPopup(resumo);
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
  toggleSelect("#saboresGroup", "checkbox", 4);
  toggleSelect("#bordaGroup", "radio");
  toggleSelect("#adicionaisGroup", "checkbox", 3);
};
let tamanhoPizza = '';
let valorBase = 0;

let tamanhoPizza = '';
let valorBase = 0;
let limiteSabores = 4;

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

  toggleSelect("#saboresGroup", "checkbox", limiteSabores); // atualiza limite dinâmico
  proximaEtapa(2);
}


function verificarSabores() {
  const saboresSelecionados = document.querySelectorAll('#saboresGroup input:checked');
  if (saboresSelecionados.length === 0) {
    exibirPopup("⚠️ Você precisa escolher pelo menos 1 sabor.");
    return;
  }

  let precoFinal = valorBase;
  if ((tamanhoPizza === "Média" || tamanhoPizza === "Grande") && saboresSelecionados.length === 2) {
    precoFinal += 5;
  }

  window.precoFinalPizza = precoFinal;
  proximaEtapa(3);
}

function salvarPedido() {
  const form = document.getElementById("formPizza");
  const dados = new FormData(form);

  const sabores = dados.getAll("sabor").join(", ");
  const borda = dados.get("borda") || "Sem borda";
  const adicionais = dados.getAll("adicional").join(", ") || "Sem adicionais";

  const resumo = `Pedido:\n- Tamanho: ${tamanhoPizza}\n- Sabores: ${sabores}\n- Borda: ${borda}\n- Adicionais: ${adicionais}\n- Total: R$ ${window.precoFinalPizza.toFixed(2)}`;
  exibirPopup(resumo);
}
