let itensEstoque = [];

const listaItens = document.getElementById("lista-itens");

const buscaProduto = document.getElementById("busca-produto");

const totalTipos = document.getElementById("total-tipos");

const totalUnidades = document.getElementById("total-unidades");

const valorTotalEstoque = document.getElementById("valor-total-estoque");

const contadorItens = document.getElementById("contador-itens");

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) {
    return "—";
  }

  const valor = String(data).replace(" ", "T");

  const objeto = new Date(valor);

  if (Number.isNaN(objeto.getTime())) {
    return data;
  }

  return objeto.toLocaleDateString("pt-BR");
}

function criarCelula(texto, classe = "") {
  const td = document.createElement("td");

  if (classe) {
    td.className = classe;
  }

  td.textContent = texto;

  return td;
}

function calcularValorTotal(itens) {
  return itens.reduce((total, item) => {
    return total + Number(item.vlr_total || 0);
  }, 0);
}

function renderizarItens(itens) {
  listaItens.innerHTML = "";

  const tiposUnicos = new Set(itens.map((item) => String(item.pn || "")));

  totalTipos.textContent = formatarNumero(tiposUnicos.size);

  const unidades = itens.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0,
  );

  totalUnidades.textContent = formatarNumero(unidades);

  valorTotalEstoque.textContent = formatarMoeda(calcularValorTotal(itens));

  contadorItens.textContent =
    itens.length === 1
      ? "1 item encontrado"
      : `${itens.length} itens encontrados`;

  if (itens.length === 0) {
    const tr = document.createElement("tr");

    const td = document.createElement("td");

    td.colSpan = 13;
    td.className = "empty-state";

    const icone = document.createElement("div");

    icone.className = "empty-state-icon";

    icone.textContent = "⌕";

    const titulo = document.createElement("strong");

    titulo.textContent = "Nenhum item encontrado";

    const descricao = document.createElement("p");

    descricao.textContent =
      "Adicione uma entrada ou altere os termos da busca.";

    td.appendChild(icone);

    td.appendChild(titulo);

    td.appendChild(descricao);

    tr.appendChild(td);

    listaItens.appendChild(tr);

    return;
  }

  itens.forEach((item) => {
    const tr = document.createElement("tr");

    tr.appendChild(criarCelula(item.nf || "—"));

    tr.appendChild(criarCelula(formatarData(item.data)));

    tr.appendChild(criarCelula(item.nome || "—"));

    tr.appendChild(criarCelula(item.pn || "—"));

    tr.appendChild(criarCelula(item.tipo || "—"));

    tr.appendChild(criarCelula(formatarNumero(item.quantidade), "text-right"));

    tr.appendChild(criarCelula(item.uf || "—"));

    tr.appendChild(criarCelula(formatarMoeda(item.vlr_unit), "text-right"));

    tr.appendChild(criarCelula(formatarMoeda(item.vlr_total), "text-right"));

    tr.appendChild(criarCelula(item.prat || "—"));

    tr.appendChild(criarCelula(item.base || "—"));

    tr.appendChild(
      criarCelula(
        item.max !== null && item.max !== undefined
          ? formatarNumero(item.max)
          : "—",
        "text-right",
      ),
    );

    tr.appendChild(
      criarCelula(
        item.min !== null && item.min !== undefined
          ? formatarNumero(item.min)
          : "—",
        "text-right",
      ),
    );

    listaItens.appendChild(tr);
  });
}

function filtrarItens() {
  const busca = buscaProduto.value.trim().toLowerCase();

  const filtrados = itensEstoque.filter((item) => {
    const pn = String(item.pn || "").toLowerCase();

    const nome = String(item.nome || "").toLowerCase();

    const nf = String(item.nf || "").toLowerCase();

    const tipo = String(item.tipo || "").toLowerCase();

    const base = String(item.base || "").toLowerCase();

    return (
      pn.includes(busca) ||
      nome.includes(busca) ||
      nf.includes(busca) ||
      tipo.includes(busca) ||
      base.includes(busca)
    );
  });

  renderizarItens(filtrados);
}

async function carregarEstoque() {
  try {
    const resposta = await fetch("../api/config/itens.php");

    const resultado = await resposta.json();

    if (!resultado.sucesso) {
      throw new Error(resultado.mensagem || "Erro ao carregar estoque.");
    }

    itensEstoque = Array.isArray(resultado.dados) ? resultado.dados : [];

    renderizarItens(itensEstoque);
  } catch (erro) {
    listaItens.innerHTML = "";

    const tr = document.createElement("tr");

    const td = document.createElement("td");

    td.colSpan = 13;
    td.className = "empty-state";

    const icone = document.createElement("div");

    icone.className = "empty-state-icon";

    icone.textContent = "⚠";

    const titulo = document.createElement("strong");

    titulo.textContent = "Não foi possível carregar o estoque";

    const descricao = document.createElement("p");

    descricao.textContent =
      "Verifique se a API está funcionando e tente novamente.";

    td.appendChild(icone);

    td.appendChild(titulo);

    td.appendChild(descricao);

    tr.appendChild(td);

    listaItens.appendChild(tr);

    totalTipos.textContent = "—";

    totalUnidades.textContent = "—";

    valorTotalEstoque.textContent = "—";

    contadorItens.textContent = "Erro ao carregar os dados";
  }
}

buscaProduto.addEventListener("input", filtrarItens);

carregarEstoque();
