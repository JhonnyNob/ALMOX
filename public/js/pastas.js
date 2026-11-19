async function carregarPastas() {
  const listaPastas = document.getElementById("lista-pastas");

  if (!listaPastas) {
    return;
  }

  try {
    const resposta = await fetch("../api/config/pastas.php");
    const resultado = await resposta.json();

    listaPastas.innerHTML = "";

    if (!resultado.sucesso || resultado.dados.length === 0) {
      return;
    }

    resultado.dados.forEach((pasta) => {
      const link = document.createElement("a");

      link.href = `index.html?pasta=${encodeURIComponent(
        pasta.id,
      )}&busca=${encodeURIComponent(pasta.nome)}`;

      link.className = "folder-link";
      link.textContent = pasta.nome;

      listaPastas.appendChild(link);
    });
  } catch (erro) {
    listaPastas.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarPastas();
});