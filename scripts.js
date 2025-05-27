
  const API = "https://exclusive-krista-luizcapel-78430027.koyeb.app/api";
//  const API = "http://186.233.152.174:8080/api";


  function toggleSubmenu(id) {
    // Oculta todos os submenus
    document.querySelectorAll(".submenu").forEach(menu => {
      menu.style.display = menu.id === id ? "block" : "none";
    });

    // Oculta todas as sections
    document.querySelectorAll("section").forEach(sec => {
      sec.style.display = "none";
    });
  }

function mostrar(id) {
  document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
  document.querySelectorAll(".resultado").forEach(div => div.innerHTML = "");

  if (id == "cadastroEvento") {
    limparFormularioEvento();
  }
  if (id === "consultaCortesiasEvento") {
    carregarEventosSelect("eventosSelectCortesia");
  }
  if (id === "solicitarCortesia") {
    carregarEventosSelect("eventoIdSolicitar");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const cpfInput = document.getElementById("cpfPessoa");
  const telefoneInput = document.getElementById("telefonePessoa");
  const dataNascInput = document.getElementById("dataNascimentoPessoa");

  cpfInput.addEventListener("input", () => {
    let value = cpfInput.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    cpfInput.value = value;
  });

  cpfInput.addEventListener("blur", () => {
    const rawCpf = cpfInput.value.replace(/\D/g, "");
    if (!validarCPF(rawCpf)) {
      alert("CPF inválido.");
    }
  });

  telefoneInput.addEventListener("input", () => {
    let value = telefoneInput.value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "($1)$2");
    value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");
    telefoneInput.value = value;
  });

  dataNascInput.addEventListener("blur", () => {
    const data = new Date(dataNascInput.value);
    const hoje = new Date();
    const anos = hoje.getFullYear() - data.getFullYear();

    if (data > hoje || anos > 120) {
      alert("Data de nascimento inválida.");
      dataNascInput.focus();
    }
  });
});

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;

  for (let i = 1; i <= 9; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

function formatarDataIso(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function carregarEventosSelect(id) {
  const res = await fetch(`${API}/eventos`);
  const select = document.getElementById(id);
  select.innerHTML = ""; // limpa opções anteriores

  if (!res.ok) {
    select.innerHTML = "<option>Erro ao carregar eventos</option>";
    return;
  }

  const eventos = await res.json();
  eventos.forEach(e => {
    const dataFormatada = formatarDataIso(e.data);
    const texto = `${e.nome} - ${e.local} - ${e.responsavel} - ${dataFormatada}`;
    const option = document.createElement("option");
    option.value = e.id;
    option.textContent = texto;
    select.appendChild(option);
  });
}


async function cadastrarEvento() {
  const nome = document.getElementById("nomeEvento").value.trim();
  const data = document.getElementById("dataEvento").value;
  const local = document.getElementById("localEvento").value.trim();
  const responsavel = document.getElementById("responsavelEvento").value.trim();
  const quantidadeCortesias = parseInt(document.getElementById("quantidadeCortesias").value);

  // Validações no frontend
  if (!nome || !data || !local || !responsavel || isNaN(quantidadeCortesias)) {
    document.getElementById("resCadastroEvento").innerText = "Preencha todos os campos corretamente.";
    return;
  }

  if (quantidadeCortesias < 0) {
    document.getElementById("resCadastroEvento").innerText = "Quantidade de cortesias não pode ser negativa.";
    return;
  }

  const dataEvento = {
    nome, data, local, responsavel, quantidadeCortesias
  };

  const res = await fetch(`${API}/eventos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataEvento)
  });

  const msg = await res.text();
  const div = document.getElementById("resCadastroEvento");

  if (res.ok) {
    div.innerText = "Evento cadastrado com sucesso!";
    limparFormularioEvento();
  } else {
    div.innerText = msg;
  }
}

// Limpa os campos após sucesso
function limparFormularioEvento() {
  document.getElementById("nomeEvento").value = "";
  document.getElementById("dataEvento").value = "";
  document.getElementById("localEvento").value = "";
  document.getElementById("responsavelEvento").value = "";
  document.getElementById("quantidadeCortesias").value = "";
}


async function cadastrarPessoa() {
  const nome = document.getElementById("nomePessoa").value.trim();
  const cpf = document.getElementById("cpfPessoa").value.replace(/\D/g, "");
  const dataNascimento = document.getElementById("dataNascimentoPessoa").value;
  const cidade = document.getElementById("cidadePessoa").value.trim();
  const telefone = document.getElementById("telefonePessoa").value.replace(/\D/g, ""); // remove máscara
  const email = document.getElementById("emailPessoa").value.trim();

  const div = document.getElementById("resCadastroPessoa");

  if (!nome || !cpf || !dataNascimento || !cidade || !telefone || !email) {
    div.innerText = "Preencha todos os campos corretamente.";
    return;
  }

  if (!validarCPF(cpf)) {
    alert("CPF inválido.");
    return;
  }

  if (telefone.length < 10) {
    alert("Telefone inválido. Deve conter no mínimo 10 dígitos (incluindo o DDD).");
    return;
  }

  if (!validarEmail(email)) {
    alert("Email inválido.");
    return;
  }

  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  const idade = hoje.getFullYear() - nascimento.getFullYear();

  if (nascimento > hoje || idade > 120) {
    alert("Data de nascimento inválida.");
    return;
  }

  const data = { nome, cpf, dataNascimento, cidade, telefone, email };

  const res = await fetch(`${API}/pessoas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const msg = await res.text();

  if (res.ok) {
    div.innerText = "Pessoa cadastrada com sucesso!";
    limparFormularioPessoa();
  } else {
    div.innerText = msg;
  }
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function limparFormularioPessoa() {
  document.getElementById("nomePessoa").value = "";
  document.getElementById("cpfPessoa").value = "";
  document.getElementById("dataNascimentoPessoa").value = "";
  document.getElementById("cidadePessoa").value = "";
  document.getElementById("telefonePessoa").value = "";
  document.getElementById("emailPessoa").value = "";
}

  async function solicitarCortesia() {
    const data = {
      eventoId: parseInt(document.getElementById("eventoIdSolicitar").value),
      cpf: document.getElementById("cpfSolicitar").value
    };

    const res = await fetch(`${API}/cortesias/solicitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const msg = await res.text();
    document.getElementById("resSolicitarCortesia").innerText = msg;
  }

  async function validarCortesia() {
    const eventoId = document.getElementById("eventoIdValidar").value;
    const codigo = document.getElementById("codigoCortesia").value;

    const res = await fetch(`${API}/cortesias/evento/${eventoId}/validar?codigo=${codigo}`, {
      method: "POST"
    });

    const msg = await res.text();
    document.getElementById("resValidarCortesia").innerText = msg;
  }

async function buscarEventos() {
  const nome = document.getElementById("filtroNomeEvento").value;
  const data = document.getElementById("filtroDataEvento").value;
  const local = document.getElementById("filtroLocalEvento").value;
  const responsavel = document.getElementById("filtroResponsavelEvento").value;

  const params = new URLSearchParams();
  if (nome) params.append("nome", nome);
  if (data) params.append("data", data);
  if (local) params.append("local", local);
  if (responsavel) params.append("responsavel", responsavel);

  const res = await fetch(`${API}/eventos/buscar?` + params.toString());
  const eventos = await res.json();
  const div = document.getElementById("tabelaEventos");

  if (!eventos.length) {
    div.innerText = "Nenhum evento encontrado.";
    return;
  }

  let tabela = `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Nome</th><th>Data</th><th>Local</th><th>Responsável</th><th>Cortesias</th><th>Ação</th>
        </tr>
      </thead><tbody>
  `;

  eventos.forEach(e => {
    const dataFormatada = formatarDataIso(e.data);
    tabela += `
      <tr>
        <td>${e.nome}</td>
        <td>${dataFormatada}</td>
        <td>${e.local}</td>
        <td>${e.responsavel}</td>
        <td>${e.quantidadeCortesias}</td>
        <td>
          <button onclick='editarEvento(${JSON.stringify(e)})'>Editar</button>
          <button onclick='excluirEvento(${e.id})'>Excluir</button>
        </td>
      </tr>
    `;
  });

  tabela += `</tbody></table>`;
  div.innerHTML = tabela;
}

function editarEvento(e) {
  mostrar("editarEvento");
  document.getElementById("editEventoId").value = e.id;
  document.getElementById("editNomeEvento").value = e.nome;
  document.getElementById("editDataEvento").value = e.data;
  document.getElementById("editLocalEvento").value = e.local;
  document.getElementById("editResponsavelEvento").value = e.responsavel;
  document.getElementById("editQtdCortesiasEvento").value = e.quantidadeCortesias;
}

async function salvarEdicaoEvento() {
  const id = document.getElementById("editEventoId").value;

  const data = {
    nome: document.getElementById("editNomeEvento").value,
    data: document.getElementById("editDataEvento").value,
    local: document.getElementById("editLocalEvento").value,
    responsavel: document.getElementById("editResponsavelEvento").value,
    quantidadeCortesias: document.getElementById("editQtdCortesiasEvento").value
  };

  const res = await fetch(`${API}/eventos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  document.getElementById("resEditarEvento").innerText = res.ok
    ? "Evento atualizado com sucesso!"
    : await res.text();
}

async function excluirEvento(id) {
  if (!confirm("Deseja excluir este evento?")) return;

  const res = await fetch(`${API}/eventos/${id}`, { method: "DELETE" });

  if (res.ok) {
    alert("Evento excluído.");
    buscarEventos();
  } else {
    alert("Erro ao excluir evento.");
  }
}

async function buscarEventoSelecionado() {
  const id = document.getElementById("eventosSelect").value;
  const res = await fetch(`${API}/eventos/${id}`);
  const container = document.getElementById("resConsultaEvento");

  if (!res.ok) {
    container.innerText = "Evento não encontrado.";
    return;
  }

  const evento = await res.json();
  const dataFormatada = formatarDataIso(evento.data);
  container.innerText = `ID ${evento.id} - ${evento.nome} (${dataFormatada}) em ${evento.local}`;
}

async function buscarPessoas() {
  const nome = document.getElementById("filtroNome").value;
  const cidade = document.getElementById("filtroCidade").value;
  const cpf = document.getElementById("filtroCPF").value;

  const params = new URLSearchParams();
  if (nome) params.append("nome", nome);
  if (cidade) params.append("cidade", cidade);
  if (cpf) params.append("cpf", cpf);

  const res = await fetch(`${API}/pessoas/buscar?` + params.toString());
  const pessoas = await res.json();
  const div = document.getElementById("tabelaPessoas");

  if (!pessoas.length) {
    div.innerText = "Nenhuma pessoa encontrada.";
    return;
  }

  let tabela = `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Nome</th>
          <th>CPF</th>
          <th>Cidade</th>
          <th>Nascimento</th>
          <th>Telefone</th>
          <th>Email</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
  `;

  pessoas.forEach(p => {
    const dataFormatada = formatarDataIso(p.dataNascimento);
    tabela += `
      <tr>
        <td>${p.nome}</td>
        <td>${p.cpf}</td>
        <td>${p.cidade}</td>
        <td>${dataFormatada}</td>
        <td>${p.telefone}</td>
        <td>${p.email}</td>
        <td>
	  <button onclick='editarPessoa(${JSON.stringify(p)})'>Editar</button>
	  <button onclick='excluirPessoa(${p.id})'>Excluir</button>
	</td>
      </tr>
    `;
  });

  tabela += `</tbody></table>`;
  div.innerHTML = tabela;
}

function editarPessoa(pessoa) {
  mostrar("editarPessoa");

  document.getElementById("editId").value = pessoa.id;
  document.getElementById("editNome").value = pessoa.nome;
  document.getElementById("editCpf").value = aplicarMascaraCpf(pessoa.cpf);
  document.getElementById("editDataNascimento").value = pessoa.dataNascimento;
  document.getElementById("editCidade").value = pessoa.cidade;
  document.getElementById("editTelefone").value = aplicarMascaraTelefone(pessoa.telefone);
  document.getElementById("editEmail").value = pessoa.email;

  aplicarMascarasEdicaoPessoa(); // ainda necessário para continuar aplicando conforme digita
}

function aplicarMascaraCpf(cpf) {
  cpf = cpf.replace(/\D/g, "");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return cpf;
}

function aplicarMascaraTelefone(tel) {
  tel = tel.replace(/\D/g, "");
  tel = tel.replace(/^(\d{2})(\d)/, "($1)$2");
  tel = tel.replace(/(\d{5})(\d{4})$/, "$1-$2");
  return tel;
}

function aplicarMascarasEdicaoPessoa() {
  const cpfInput = document.getElementById("editCpf");
  const telefoneInput = document.getElementById("editTelefone");
  const dataNascInput = document.getElementById("editDataNascimento");

  cpfInput.addEventListener("input", () => {
    let value = cpfInput.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    cpfInput.value = value;
  });

  cpfInput.addEventListener("blur", () => {
    const rawCpf = cpfInput.value.replace(/\D/g, "");
    if (!validarCPF(rawCpf)) alert("CPF inválido.");
  });

  telefoneInput.addEventListener("input", () => {
    let value = telefoneInput.value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "($1)$2");
    value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");
    telefoneInput.value = value;
  });

  dataNascInput.addEventListener("blur", () => {
    const data = new Date(dataNascInput.value);
    const hoje = new Date();
    const anos = hoje.getFullYear() - data.getFullYear();
    if (data > hoje || anos > 120) {
      alert("Data de nascimento inválida.");
      dataNascInput.focus();
    }
  });
}

async function salvarEdicaoPessoa() {
  const id = document.getElementById("editId").value;
  const nome = document.getElementById("editNome").value.trim();
  const cpf = document.getElementById("editCpf").value.replace(/\D/g, "");
  const dataNascimento = document.getElementById("editDataNascimento").value;
  const cidade = document.getElementById("editCidade").value.trim();
  const telefone = document.getElementById("editTelefone").value.replace(/\D/g, "");
  const email = document.getElementById("editEmail").value.trim();

  const div = document.getElementById("resEditarPessoa");

  if (!nome || !cpf || !dataNascimento || !cidade || !telefone || !email) {
    div.innerText = "Preencha todos os campos corretamente.";
    return;
  }

  if (!validarCPF(cpf)) {
    alert("CPF inválido.");
    return;
  }

  if (telefone.length < 10) {
    alert("Telefone inválido. Deve conter no mínimo 10 dígitos (incluindo o DDD).");
    return;
  }

  if (!validarEmail(email)) {
    alert("Email inválido.");
    return;
  }

  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  const idade = hoje.getFullYear() - nascimento.getFullYear();

  if (nascimento > hoje || idade > 120) {
    alert("Data de nascimento inválida.");
    return;
  }

  const data = { nome, cpf, dataNascimento, cidade, telefone, email };

  const res = await fetch(`${API}/pessoas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const msg = await res.text();
  div.innerText = res.ok ? "Pessoa atualizada com sucesso!" : msg;
}

async function excluirPessoa(id) {
  if (!confirm("Tem certeza que deseja excluir esta pessoa?")) return;

  const res = await fetch(`${API}/pessoas/${id}`, { method: "DELETE" });

  if (res.ok) {
    alert("Pessoa excluída com sucesso.");
    buscarPessoas(); // Recarrega a lista
  } else {
    alert("Erro ao excluir pessoa.");
  }
}

async function marcarResgatada(codigo) {
  const confirmacao = confirm("Deseja marcar esta cortesia como resgatada?");
  if (!confirmacao) return;

  const res = await fetch(`${API}/cortesias/resgatar?codigo=${codigo}`, {
    method: "POST"
  });

  alert(await res.text());
  listarCortesiasEvento(); // recarrega tabela
}

function exportarCSV() {
  if (!cortesiasAtual.length) {
    alert("Nenhuma cortesia para exportar.");
    return;
  }

  const linhas = [
    ["Código", "Nome", "CPF", "Resgatada"],
    ...cortesiasAtual.map(c => [
      c.codigo,
      c.pessoaNome,
      c.pessoaCpf,
      c.resgatada ? "Sim" : "Não"
    ])
  ];

  const csv = linhas.map(l => l.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cortesias.csv";
  a.click();
  URL.revokeObjectURL(url);
}

let cortesiasAtual = [];

async function listarCortesiasEvento() {
  const eventoId = document.getElementById("eventosSelectCortesia").value;
  const filtro = document.getElementById("filtroResgate").value;
  const url = `${API}/cortesias/evento/${eventoId}` + (filtro ? `?resgatada=${filtro}` : "");

  const res = await fetch(url);
  const container = document.getElementById("resConsultaCortesias");

  if (!res.ok) {
    container.innerText = "Erro ao buscar cortesias.";
    return;
  }

  const cortesias = await res.json();
  cortesiasAtual = cortesias;

  if (!cortesias.length) {
    container.innerText = "Nenhuma cortesia solicitada.";
    return;
  }

  let tabela = `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
	<tr>
	  <th>Código</th>
	  <th>Nome</th>
	  <th>CPF</th>
	  <th>Resgatada?</th>
	  <th>Ação</th>
	</tr>
      </thead>
      <tbody>
  `;

  cortesias.forEach(c => {
    tabela += `
      <tr>
	<td>${c.codigo}</td>
	<td>${c.pessoaNome}</td>
	<td>${c.pessoaCpf}</td>
	<td>${c.resgatada ? "Sim" : "Não"}</td>
	<td>${!c.resgatada ? `<button onclick="marcarResgatada('${c.codigo}')">Marcar como resgatada</button>` : ""}</td>
      </tr>
    `;
  });

  tabela += `</tbody></table>`;
  container.innerHTML = tabela;
}

//  mostrar('cadastroEvento'); // inicia na primeira aba
