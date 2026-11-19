let movimentacoes = [];
let itensEstoque = [];

const listaEntradas = document.getElementById("lista-entradas");
const listaSaidas = document.getElementById("lista-saidas");
const buscaEntradas = document.getElementById("busca-entradas");
const buscaSaidas = document.getElementById("busca-saidas");
const dataInicialEntradas = document.getElementById("data-inicial-entradas");
const dataFinalEntradas = document.getElementById("data-final-entradas");
const dataInicialSaidas = document.getElementById("data-inicial-saidas");
const dataFinalSaidas = document.getElementById("data-final-saidas");
const contadorEntradas = document.getElementById("contador-entradas");
const contadorSaidas = document.getElementById("contador-saidas");
const exportarTipo = document.getElementById("exportar-tipo");
const exportarFormato = document.getElementById("exportar-formato");
const btnExportar = document.getElementById("btn-exportar");

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarData(data) {
  if (!data) return "—";

  const valor = String(data).replace(" ", "T");
  const objeto = new Date(valor);

  if (Number.isNaN(objeto.getTime())) {
    return data;
  }

  return objeto.toLocaleString("pt-BR");
}

function formatarDataArquivo(data) {
  if (!data) return "";

  const objeto = new Date(String(data).replace(" ", "T"));

  if (Number.isNaN(objeto.getTime())) {
    return "";
  }

  const dia = String(objeto.getDate()).padStart(2, "0");
  const mes = String(objeto.getMonth() + 1).padStart(2, "0");
  const ano = objeto.getFullYear();

  return `${ano}-${mes}-${dia}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function criarCelula(texto, classe = "") {
  const td = document.createElement("td");

  if (classe) {
    td.className = classe;
  }

  td.textContent = texto;

  return td;
}

function mostrarEstadoVazio(lista, colunas, titulo, descricao) {
  lista.innerHTML = "";

  const tr = document.createElement("tr");
  const td = document.createElement("td");

  td.colSpan = colunas;
  td.className = "empty-state";

  const icone = document.createElement("div");
  icone.className = "empty-state-icon";
  icone.textContent = "↻";

  const tituloElemento = document.createElement("strong");
  tituloElemento.textContent = titulo;

  const descricaoElemento = document.createElement("p");
  descricaoElemento.textContent = descricao;

  td.appendChild(icone);
  td.appendChild(tituloElemento);
  td.appendChild(descricaoElemento);

  tr.appendChild(td);
  lista.appendChild(tr);
}

function dentroDoPeriodo(movimentacao, dataInicial, dataFinal) {
  const data = formatarDataArquivo(movimentacao.data_hora);

  if (!data) {
    return false;
  }

  if (dataInicial && data < dataInicial) {
    return false;
  }

  if (dataFinal && data > dataFinal) {
    return false;
  }

  return true;
}

function obterDadosEstoque(movimentacao) {
  const pnMovimentacao = normalizarTexto(movimentacao.pn);

  const baseIdMovimentacao = String(movimentacao.base_id || "");

  const item = itensEstoque.find((estoque) => {
    const mesmoPn = normalizarTexto(estoque.pn) === pnMovimentacao;

    const mesmaBase = String(estoque.base_id || "") === baseIdMovimentacao;

    return mesmoPn && mesmaBase;
  });

  if (!item) {
    return {
      vlr_unit: Number(movimentacao.custo || 0),
      prat: movimentacao.prat || "—",
    };
  }

  return {
    vlr_unit: Number(item.vlr_unit || 0),

    prat: item.prat || "—",
  };
}

function enriquecerMovimentacoes() {
  movimentacoes = movimentacoes.map((movimentacao) => {
    const estoque = obterDadosEstoque(movimentacao);

    return {
      ...movimentacao,
      vlr_unit_saida: estoque.vlr_unit,
      prat_saida: estoque.prat,
    };
  });
}

function renderizarEntradas(lista) {
  listaEntradas.innerHTML = "";

  contadorEntradas.textContent =
    lista.length === 1
      ? "1 entrada encontrada"
      : `${lista.length} entradas encontradas`;

  if (lista.length === 0) {
    mostrarEstadoVazio(
      listaEntradas,
      9,
      "Nenhuma entrada encontrada",
      "As entradas registradas aparecerão aqui.",
    );

    return;
  }

  lista.forEach((movimentacao) => {
    const tr = document.createElement("tr");

    const quantidade = Number(movimentacao.quantidade || 0);

    const custo = Number(movimentacao.custo || 0);

    const valorTotal = quantidade * custo;

    tr.appendChild(criarCelula(formatarData(movimentacao.data_hora)));

    tr.appendChild(criarCelula(movimentacao.nf || "—"));

    tr.appendChild(criarCelula(movimentacao.nome || "—"));

    tr.appendChild(criarCelula(movimentacao.pn || "—"));

    tr.appendChild(criarCelula(movimentacao.tipo_motor || "—"));

    tr.appendChild(
      criarCelula(quantidade.toLocaleString("pt-BR"), "text-right"),
    );

    tr.appendChild(criarCelula(formatarMoeda(custo), "text-right"));

    tr.appendChild(criarCelula(formatarMoeda(valorTotal), "text-right"));

    tr.appendChild(criarCelula(movimentacao.base || "—"));

    listaEntradas.appendChild(tr);
  });
}

function renderizarSaidas(lista) {
  listaSaidas.innerHTML = "";

  contadorSaidas.textContent =
    lista.length === 1
      ? "1 saída encontrada"
      : `${lista.length} saídas encontradas`;

  if (lista.length === 0) {
    mostrarEstadoVazio(
      listaSaidas,
      10,
      "Nenhuma saída encontrada",
      "As saídas registradas aparecerão aqui.",
    );

    return;
  }

  lista.forEach((movimentacao) => {
    const tr = document.createElement("tr");

    const quantidade = Number(movimentacao.quantidade || 0);

    const valorUnitario = Number(movimentacao.vlr_unit_saida || 0);

    const valorTotal = quantidade * valorUnitario;

    tr.appendChild(criarCelula(formatarData(movimentacao.data_hora)));

    tr.appendChild(criarCelula(movimentacao.nome || "—"));

    tr.appendChild(criarCelula(movimentacao.pn || "—"));

    tr.appendChild(criarCelula(movimentacao.tipo_motor || "—"));

    tr.appendChild(
      criarCelula(quantidade.toLocaleString("pt-BR"), "text-right"),
    );

    tr.appendChild(criarCelula(formatarMoeda(valorUnitario), "text-right"));

    tr.appendChild(criarCelula(formatarMoeda(valorTotal), "text-right"));

    tr.appendChild(criarCelula(movimentacao.prat_saida || "—"));

    tr.appendChild(criarCelula(movimentacao.centro_consumo || "—"));

    tr.appendChild(criarCelula(movimentacao.base || "—"));

    listaSaidas.appendChild(tr);
  });
}

function obterEntradasFiltradas() {
  const busca = normalizarTexto(buscaEntradas.value);

  return movimentacoes.filter((item) => {
    if (item.tipo !== "entrada") {
      return false;
    }

    const pn = normalizarTexto(item.pn);

    const nome = normalizarTexto(item.nome);

    const nf = normalizarTexto(item.nf);

    const tipoMotor = normalizarTexto(item.tipo_motor);

    const correspondeBusca =
      !busca ||
      pn.includes(busca) ||
      nome.includes(busca) ||
      nf.includes(busca) ||
      tipoMotor.includes(busca);

    return (
      correspondeBusca &&
      dentroDoPeriodo(item, dataInicialEntradas.value, dataFinalEntradas.value)
    );
  });
}

function obterSaidasFiltradas() {
  const busca = normalizarTexto(buscaSaidas.value);

  return movimentacoes.filter((item) => {
    if (item.tipo !== "saida") {
      return false;
    }

    const pn = normalizarTexto(item.pn);

    const nome = normalizarTexto(item.nome);

    const tipoMotor = normalizarTexto(item.tipo_motor);

    const centro = normalizarTexto(item.centro_consumo);

    const base = normalizarTexto(item.base);

    const correspondeBusca =
      !busca ||
      pn.includes(busca) ||
      nome.includes(busca) ||
      tipoMotor.includes(busca) ||
      centro.includes(busca) ||
      base.includes(busca);

    return (
      correspondeBusca &&
      dentroDoPeriodo(item, dataInicialSaidas.value, dataFinalSaidas.value)
    );
  });
}

function filtrarEntradas() {
  renderizarEntradas(obterEntradasFiltradas());
}

function filtrarSaidas() {
  renderizarSaidas(obterSaidasFiltradas());
}

function obterNomeArquivo(tipo, formato) {
  const data = new Date();

  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `historico-${tipo}-${ano}-${mes}-${dia}.${formato}`;
}

function gerarExcel(tipo, lista) {
  if (typeof XLSX === "undefined") {
    alert(
      "A biblioteca de Excel não foi carregada. Verifique sua conexão com a internet.",
    );

    return;
  }

  let dados = [];

  if (tipo === "entrada") {
    dados = lista.map((item) => ({
      "DATA E HORA": formatarData(item.data_hora),

      NF: item.nf || "",

      ITEM: item.nome || "",

      PN: item.pn || "",

      TIPO: item.tipo_motor || "",

      QTD: Number(item.quantidade || 0),

      "VLR UNIT": Number(item.custo || 0),

      "VLR TOTAL": Number(item.quantidade || 0) * Number(item.custo || 0),

      BASE: item.base || "",
    }));
  } else {
    dados = lista.map((item) => {
      const valorUnitario = Number(item.vlr_unit_saida || 0);

      const quantidade = Number(item.quantidade || 0);

      return {
        "DATA E HORA": formatarData(item.data_hora),

        ITEM: item.nome || "",

        PN: item.pn || "",

        TIPO: item.tipo_motor || "",

        QTD: quantidade,

        "VLR UNIT": valorUnitario,

        "VLR TOTAL": quantidade * valorUnitario,

        PRAT: item.prat_saida || "",

        "CENTRO DE CONSUMO": item.centro_consumo || "",

        BASE: item.base || "",
      };
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(dados);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    tipo === "entrada" ? "Entradas" : "Saidas",
  );

  XLSX.writeFile(workbook, obterNomeArquivo(tipo, "xlsx"));
}

function removerAcentos(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function gerarPDF(tipo, lista) {
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF !== "function"
  ) {
    alert(
      "A biblioteca jsPDF não foi carregada. Verifique os arquivos da pasta vendor.",
    );

    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "landscape",

    unit: "mm",

    format: "a4",
  });

  if (typeof doc.autoTable !== "function") {
    alert("O módulo de tabelas do PDF não foi carregado corretamente.");

    return;
  }

  const titulo =
    tipo === "entrada" ? "Histórico de Entradas" : "Histórico de Saídas";

  doc.setFontSize(16);

  doc.text(removerAcentos(titulo), 14, 15);

  doc.setFontSize(9);

  doc.text(
    removerAcentos(`Gerado em ${new Date().toLocaleString("pt-BR")}`),
    14,
    21,
  );

  let head;
  let body;

  if (tipo === "entrada") {
    head = [
      [
        "DATA E HORA",
        "NF",
        "ITEM",
        "PN",
        "TIPO",
        "QTD",
        "VLR UNIT",
        "VLR TOTAL",
        "BASE",
      ],
    ];

    body = lista.map((item) => [
      removerAcentos(formatarData(item.data_hora)),

      removerAcentos(item.nf || "—"),

      removerAcentos(item.nome || "—"),

      removerAcentos(item.pn || "—"),

      removerAcentos(item.tipo_motor || "—"),

      Number(item.quantidade || 0).toLocaleString("pt-BR"),

      formatarMoeda(item.custo),

      formatarMoeda(Number(item.quantidade || 0) * Number(item.custo || 0)),

      removerAcentos(item.base || "—"),
    ]);
  } else {
    head = [
      [
        "DATA E HORA",
        "ITEM",
        "PN",
        "TIPO",
        "QTD",
        "VLR UNIT",
        "VLR TOTAL",
        "PRAT",
        "CENTRO DE CONSUMO",
        "BASE",
      ],
    ];

    body = lista.map((item) => {
      const valorUnitario = Number(item.vlr_unit_saida || 0);

      const quantidade = Number(item.quantidade || 0);

      return [
        removerAcentos(formatarData(item.data_hora)),

        removerAcentos(item.nome || "—"),

        removerAcentos(item.pn || "—"),

        removerAcentos(item.tipo_motor || "—"),

        quantidade.toLocaleString("pt-BR"),

        formatarMoeda(valorUnitario),

        formatarMoeda(quantidade * valorUnitario),

        removerAcentos(item.prat_saida || "—"),

        removerAcentos(item.centro_consumo || "—"),

        removerAcentos(item.base || "—"),
      ];
    });
  }

  doc.autoTable({
    head,
    body,

    startY: 27,

    styles: {
      fontSize: 6.5,
      cellPadding: 1.8,
    },

    headStyles: {
      fontSize: 6.5,
    },

    margin: {
      left: 8,
      right: 8,
    },

    horizontalPageBreak: true,

    horizontalPageBreakRepeat: 1,
  });

  doc.save(obterNomeArquivo(tipo, "pdf"));
}

function desenharCabecalhoNota(doc, numeroDocumento, data) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  doc.rect(10, 10, 190, 24);

  doc.setFontSize(20);
  doc.setFont(undefined, "bold");

  doc.text("ALMOX", 14, 20);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  doc.text("CONTROLE DE ALMOXARIFADO", 14, 27);

  doc.setFontSize(7);

  doc.text("DOCUMENTO DE SAÍDA", 145, 17);

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");

  doc.text(`Nº ${numeroDocumento}`, 145, 24);

  doc.setFontSize(7);
  doc.setFont(undefined, "normal");

  doc.text(`DATA: ${formatarData(data)}`, 145, 30);

  doc.setFillColor(230, 230, 230);

  doc.rect(10, 37, 190, 8, "F");

  doc.setFontSize(9);
  doc.setFont(undefined, "bold");

  doc.text("SEM VALIDADE FISCAL", 105, 42.5, {
    align: "center",
  });

  doc.setFont(undefined, "normal");
}

function gerarNotaFiscal(lista) {
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF !== "function"
  ) {
    alert("A biblioteca jsPDF não foi carregada.");

    return;
  }

  if (!lista.length) {
    alert("Não existem saídas para gerar a nota.");

    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",

    unit: "mm",

    format: "a4",
  });

  const primeiraMovimentacao = lista[0];

  const numeroDocumento = String(primeiraMovimentacao.id || 1).padStart(6, "0");

  desenharCabecalhoNota(doc, numeroDocumento, primeiraMovimentacao.data_hora);

  doc.setFontSize(8);
  doc.setFont(undefined, "bold");

  doc.text("ORIGEM / DESTINO", 12, 54);

  doc.setFont(undefined, "normal");

  const bases = [...new Set(lista.map((item) => item.base).filter(Boolean))];

  const centros = [
    ...new Set(lista.map((item) => item.centro_consumo).filter(Boolean)),
  ];

  doc.text(`Base(s): ${bases.length ? bases.join(", ") : "—"}`, 12, 60);

  doc.text(
    `Centro(s) de consumo: ${centros.length ? centros.join(", ") : "—"}`,
    105,
    60,
  );

  doc.setDrawColor(0);
  doc.line(10, 64, 200, 64);

  doc.setFont(undefined, "bold");

  doc.setFontSize(8);

  doc.text("MATERIAIS DA SAÍDA", 12, 71);

  doc.setFont(undefined, "normal");

  const corpo = [];

  let valorTotalOperacao = 0;

  lista.forEach((movimentacao) => {
    const quantidade = Number(movimentacao.quantidade || 0);

    const valorUnitario = Number(movimentacao.vlr_unit_saida || 0);

    const valorTotal = quantidade * valorUnitario;

    valorTotalOperacao += valorTotal;

    corpo.push([
      formatarData(movimentacao.data_hora),

      movimentacao.nome || "—",

      movimentacao.pn || "—",

      movimentacao.tipo_motor || "—",

      quantidade.toLocaleString("pt-BR"),

      formatarMoeda(valorUnitario),

      formatarMoeda(valorTotal),

      movimentacao.prat_saida || "—",

      movimentacao.centro_consumo || "—",

      movimentacao.base || "—",
    ]);
  });

  doc.autoTable({
    startY: 75,

    head: [
      [
        "DATA",
        "ITEM",
        "PN",
        "TIPO",
        "QTD",
        "VLR UNIT",
        "VLR TOTAL",
        "PRAT",
        "CENTRO",
        "BASE",
      ],
    ],

    body: corpo,

    styles: {
      fontSize: 6,
      cellPadding: 1.5,
    },

    headStyles: {
      fontSize: 6,
    },

    margin: {
      left: 8,
      right: 8,
    },

    columnStyles: {
      0: {
        cellWidth: 23,
      },

      1: {
        cellWidth: 30,
      },

      2: {
        cellWidth: 18,
      },

      3: {
        cellWidth: 19,
      },

      4: {
        cellWidth: 10,
      },

      5: {
        cellWidth: 20,
      },

      6: {
        cellWidth: 20,
      },

      7: {
        cellWidth: 14,
      },

      8: {
        cellWidth: 24,
      },

      9: {
        cellWidth: 18,
      },
    },
  });

  let y = doc.lastAutoTable.finalY + 10;

  doc.setFont(undefined, "bold");

  doc.setFontSize(9);

  doc.text("VALOR TOTAL DA OPERAÇÃO", 115, y);

  doc.setFontSize(12);

  doc.text(formatarMoeda(valorTotalOperacao), 190, y, {
    align: "right",
  });

  y += 15;

  doc.setFont(undefined, "normal");

  doc.setFontSize(8);

  doc.text(`Quantidade de movimentações: ${lista.length}`, 12, y);

  y += 6;

  doc.text(
    `Base(s) de origem: ${bases.length ? bases.join(", ") : "—"}`,
    12,
    y,
  );

  y += 6;

  doc.text(
    `Centro(s) de consumo: ${centros.length ? centros.join(", ") : "—"}`,
    12,
    y,
  );

  y += 15;

  doc.setDrawColor(100);

  doc.line(20, y, 85, y);

  doc.line(115, y, 180, y);

  doc.setFontSize(7);

  doc.text("Responsável pela saída", 52.5, y + 5, {
    align: "center",
  });

  doc.text("Recebedor", 147.5, y + 5, {
    align: "center",
  });

  doc.setFontSize(6);

  doc.text(
    "Documento gerado pelo sistema ALMOX — sem validade fiscal.",
    105,
    285,
    {
      align: "center",
    },
  );

  doc.save(`nota-saida-${numeroDocumento}.pdf`);
}

function exportarHistorico() {
  const tipo = exportarTipo.value;

  const formato = exportarFormato.value;

  const lista =
    tipo === "entrada" ? obterEntradasFiltradas() : obterSaidasFiltradas();

  if (lista.length === 0) {
    alert("Não existem registros para exportar com os filtros atuais.");

    return;
  }

  if (formato === "excel") {
    gerarExcel(tipo, lista);

    return;
  }

  if (formato === "nota") {
    if (tipo !== "saida") {
      alert("A opção Nota fiscal está disponível somente para saídas.");

      return;
    }

    gerarNotaFiscal(lista);

    return;
  }

  gerarPDF(tipo, lista);
}

async function carregarHistorico() {
  try {
    const [respostaMovimentacoes, respostaEstoque] = await Promise.all([
      fetch("../api/config/movimentacoes.php"),

      fetch("../api/config/itens.php"),
    ]);

    const resultadoMovimentacoes = await respostaMovimentacoes.json();

    const resultadoEstoque = await respostaEstoque.json();

    if (!resultadoMovimentacoes.sucesso) {
      throw new Error(
        resultadoMovimentacoes.mensagem || "Erro ao carregar histórico.",
      );
    }

    if (!resultadoEstoque.sucesso) {
      throw new Error(resultadoEstoque.mensagem || "Erro ao carregar estoque.");
    }

    movimentacoes = Array.isArray(resultadoMovimentacoes.dados)
      ? resultadoMovimentacoes.dados
      : [];

    itensEstoque = Array.isArray(resultadoEstoque.dados)
      ? resultadoEstoque.dados
      : [];

    enriquecerMovimentacoes();

    filtrarEntradas();
    filtrarSaidas();
  } catch (erro) {
    mostrarEstadoVazio(
      listaEntradas,
      9,
      "Não foi possível carregar as entradas",
      "Verifique se a API está funcionando e tente novamente.",
    );

    mostrarEstadoVazio(
      listaSaidas,
      10,
      "Não foi possível carregar as saídas",
      "Verifique se a API está funcionando e tente novamente.",
    );

    contadorEntradas.textContent = "Erro ao carregar os dados";

    contadorSaidas.textContent = "Erro ao carregar os dados";

    console.error("Erro ao carregar histórico:", erro);
  }
}

buscaEntradas.addEventListener("input", filtrarEntradas);

buscaSaidas.addEventListener("input", filtrarSaidas);

dataInicialEntradas.addEventListener("change", filtrarEntradas);

dataFinalEntradas.addEventListener("change", filtrarEntradas);

dataInicialSaidas.addEventListener("change", filtrarSaidas);

dataFinalSaidas.addEventListener("change", filtrarSaidas);

btnExportar.addEventListener("click", exportarHistorico);

carregarHistorico();