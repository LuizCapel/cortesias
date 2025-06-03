
const API = "https://exclusive-krista-luizcapel-78430027.koyeb.app/api";
//const API = "http://186.233.152.174:8080/api";

const urlParams = new URLSearchParams(window.location.search);
const eventoId = urlParams.get("evento");

window.onload = async () => {
  if (!eventoId) {
    document.getElementById("mensagem").innerText = "Evento não informado.";
    return;
  }

  const resp = await fetch(`${API}/cortesias/publico/disponiveis/${eventoId}`);
  const json = await resp.json();

  if (!json.disponivel) {
    document.getElementById("mensagem").innerText = "Todas as cortesias para esse evento já foram solicitadas.";
    return;
  }

  document.getElementById("formulario").classList.remove("hidden");
};

async function buscarPessoa() {
  const cpf = document.getElementById("cpf").value;
  const res = await fetch(`${API}/pessoas/cpf/${cpf}`);
  if (res.ok) {
    const p = await res.json();
    document.getElementById("nome").value = p.nome;
    document.getElementById("dataNascimento").value = p.dataNascimento;
    document.getElementById("cidade").value = p.cidade;
    document.getElementById("telefone").value = p.telefone;
    document.getElementById("email").value = p.email;
  }
  document.getElementById("dadosPessoa").classList.remove("hidden");
}

async function solicitarCortesia() {
  const payload = {
    cpf: document.getElementById("cpf").value,
    nome: document.getElementById("nome").value,
    dataNascimento: document.getElementById("dataNascimento").value,
    cidade: document.getElementById("cidade").value,
    telefone: document.getElementById("telefone").value,
    email: document.getElementById("email").value
  };

  const res = await fetch(`${API}/cortesias/publico/solicitar/${eventoId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const mensagem = await res.text();
  alert(mensagem);
}
