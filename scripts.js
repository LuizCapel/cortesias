
  const API = "exclusive-krista-luizcapel-78430027.koyeb.app/api";
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

//  function mostrar(id) {
//    document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
//    document.getElementById(id).style.display = "block";
//    document.querySelectorAll(".resultado").forEach(div => div.innerHTML = "");
//  }

function mostrar(id) {
  document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
  document.querySelectorAll(".resultado").forEach(div => div.innerHTML = "");

  if (id === "consultaEvento") {
    carregarEventosSelect("eventosSelect");
  }
  if (id === "consultaCortesiasEvento") {
    carregarEventosSelect("eventosSelectCortesia");
  }
  if (id === "solicitarCortesia") {
    carregarEventosSelect("eventoIdSolicitar");
  }
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
    const dataFormatada = new Date(e.data).toLocaleDateString("pt-BR");
    const texto = `${e.nome} - ${e.local} - ${e.responsavel} - ${dataFormatada}`;
    const option = document.createElement("option");
    option.value = e.id;
    option.textContent = texto;
    select.appendChild(option);
  });
}

  async function cadastrarEvento() {
    const data = {
      nome: document.getElementById("nomeEvento").value,
      data: document.getElementById("dataEvento").value,
      local: document.getElementById("localEvento").value,
      responsavel: document.getElementById("responsavelEvento").value,
      quantidadeCortesias: parseInt(document.getElementById("quantidadeCortesias").value)
    };

    const res = await fetch(`${API}/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const msg = res.ok ? "Evento cadastrado com sucesso!" : await res.text();
    document.getElementById("resCadastroEvento").innerText = msg;
  }

  async function cadastrarPessoa() {
    const data = {
      nome: document.getElementById("nomePessoa").value,
      cpf: document.getElementById("cpfPessoa").value,
      dataNascimento: document.getElementById("dataNascimentoPessoa").value,
      cidade: document.getElementById("cidadePessoa").value,
      telefone: document.getElementById("telefonePessoa").value,
      email: document.getElementById("emailPessoa").value
    };

    const res = await fetch(`${API}/pessoas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const msg = await res.text();
    document.getElementById("resCadastroPessoa").innerText = msg;
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


//	async function listarEventos() {
//	  const res = await fetch(`${API}/eventos`);
//	  if (!res.ok) {
//	    document.getElementById("resConsultaEvento").innerText = "Erro ao buscar eventos.";
//	    return;
//	  }
//
//	  const eventos = await res.json();
//	  if (!eventos.length) {
//	    document.getElementById("resConsultaEvento").innerText = "Nenhum evento encontrado.";
//	    return;
//	  }
//
//	  // Monta a tabela HTML
//	  let tabela = `
//	    <table border="1" cellpadding="5" cellspacing="0">
//	      <thead>
//		<tr>
//		  <th>ID</th>
//		  <th>Nome</th>
//		  <th>Data</th>
//		  <th>Local</th>
//		  <th>Responsável</th>
//		  <th>Cortesias</th>
//		</tr>
//	      </thead>
//	      <tbody>
//	  `;
//
//	  eventos.forEach(e => {
//	    tabela += `
//	      <tr>
//		<td>${e.id}</td>
//		<td>${e.nome}</td>
//		<td>${e.data}</td>
//		<td>${e.local}</td>
//		<td>${e.responsavel}</td>
//		<td>${e.quantidadeCortesias}</td>
//	      </tr>
//	    `;
//	  });
//
//	  tabela += `</tbody></table>`;
//
//	  document.getElementById("resConsultaEvento").innerHTML = tabela;
//	}

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
    tabela += `
      <tr>
        <td>${e.nome}</td>
        <td>${e.data}</td>
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
  const dataFormatada = new Date(evento.data).toLocaleDateString("pt-BR");
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
    tabela += `
      <tr>
        <td>${p.nome}</td>
        <td>${p.cpf}</td>
        <td>${p.cidade}</td>
        <td>${p.dataNascimento}</td>
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
  document.getElementById("editCpf").value = pessoa.cpf;
  document.getElementById("editDataNascimento").value = pessoa.dataNascimento;
  document.getElementById("editCidade").value = pessoa.cidade;
  document.getElementById("editTelefone").value = pessoa.telefone;
  document.getElementById("editEmail").value = pessoa.email;
}

async function salvarEdicaoPessoa() {
  const id = document.getElementById("editId").value;

  const data = {
    nome: document.getElementById("editNome").value,
    cpf: document.getElementById("editCpf").value,
    dataNascimento: document.getElementById("editDataNascimento").value,
    cidade: document.getElementById("editCidade").value,
    telefone: document.getElementById("editTelefone").value,
    email: document.getElementById("editEmail").value
  };

  const res = await fetch(`${API}/pessoas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  document.getElementById("resEditarPessoa").innerText = res.ok
    ? "Pessoa atualizada com sucesso!"
    : await res.text();
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

let cortesiasAtual = [];

async function listarCortesiasEvento() {
//  const eventoId = document.getElementById("eventoIdConsultaCortesias").value;
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
    container.innerText = "Nenhuma cortesia encontrada.";
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

//  mostrar('cadastroEvento'); // inicia na primeira aba
