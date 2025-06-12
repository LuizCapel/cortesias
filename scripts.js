const API = "https://exclusive-krista-luizcapel-78430027.koyeb.app/api";
//const API = "http://localhost:8080/api";

let token = null;
let permissoes = []; // Initialize as an empty array

// --- Funções Auxiliares --- 

function authedFetch(url, options = {}) {
  if (!options.headers) {
    options.headers = {};
  }
  const storedToken = localStorage.getItem("authToken");
  const currentToken = token || storedToken;
  
  if (!currentToken) {
      console.error("Tentativa de fetch autenticado sem token.");
      // Não força logout aqui, deixa a chamada falhar e ser tratada
      // logout(); 
      throw new Error("Usuário não autenticado."); // Prevent fetch
  }
  
  options.headers["Authorization"] = "Bearer " + currentToken;
  return fetch(url, options);
}

function exibirMensagem(elementId, texto, tipo = 'info') {
  const div = document.getElementById(elementId);
  if (!div) return;
  div.innerHTML = texto;
  // Garante que a mensagem seja visível
  div.className = `alert alert-${tipo} mt-3`; 
}

function limparMensagem(elementId) {
    const div = document.getElementById(elementId);
    if (div) {
        div.innerHTML = '';
        // Oculta a div de mensagem
        div.className = 'alert mt-3 d-none';
    }
}

function mostrarSecao(idToShow) {
    // Oculta todas as seções principais e submenus
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('menuPrincipal').classList.add('d-none');
    document.querySelectorAll('.submenu').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('section').forEach(el => el.classList.add('d-none'));

    // Mostra a seção desejada
    const secao = document.getElementById(idToShow);
    if (secao) {
        secao.classList.remove('d-none');
//        console.log(`Mostrando seção: ${idToShow}`); // Log para depuração
    } else {
        console.error(`Seção com ID ${idToShow} não encontrada.`);
    }
    
    // Limpa mensagens de resultado anteriores em todas as seções
    document.querySelectorAll('.resultado').forEach(div => limparMensagem(div.id));
}

// **NOVA FUNÇÃO AUXILIAR:** Inicializa tooltips dentro de um container
function inicializarTooltips(containerElement) {
    if (!containerElement) return;
    const tooltipTriggerList = [].slice.call(containerElement.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      // Remove tooltips antigos se existirem para evitar duplicação
      const oldTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
      if (oldTooltip) {
          oldTooltip.dispose();
      }
      // Cria novo tooltip
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}


async function carregarDadosUsuario() {
    try {
        const res = await authedFetch(`${API}/usuario/me`);
        if (res.ok) {
            const userData = await res.json();
            permissoes = Array.isArray(userData.permissoes) ? userData.permissoes : [];
            // Atualiza localStorage com as permissões frescas
            localStorage.setItem("userPermissoes", JSON.stringify(permissoes));
            return true; // Indica sucesso
        } else {
            console.error(`Erro ao buscar /usuario/me: ${res.status}`);
            // Se o token for inválido (401, 403), força logout
            if (res.status === 401 || res.status === 403) {
                logout();
            }
            return false; // Indica falha
        }
    } catch (error) {
        console.error("Erro na chamada para /usuario/me:", error);
        // Se for erro de "Usuário não autenticado", já foi tratado no authedFetch
        if (error.message !== "Usuário não autenticado.") {
             logout(); // Força logout em outros erros de fetch
        }
        return false; // Indica falha
    }
}

async function realizarLogin() {
  const btn = document.getElementById("btnLogin");
  btn.disabled = true;

  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;
  const mensagemDiv = document.getElementById("loginMensagem");

  limparMensagem("loginMensagem");

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    if (res.ok) {
      const data = await res.json();
      token = data.token; // Define o token global
      localStorage.setItem("authToken", token); // Salva o token
//      console.log("Login API (/auth/login) OK. Token recebido.");

      // **CHAMADA ESSENCIAL:** Carrega as permissões após obter o token
      const permissoesCarregadas = await carregarDadosUsuario();

      if (permissoesCarregadas) {
          configurarMenuPrincipal();
          mostrarSecao('menuPrincipal'); // Mostra o menu principal
      } else {
          // Se falhar ao carregar permissões, exibe erro e força logout
          exibirMensagem("loginMensagem", "Erro ao carregar dados do usuário após login.", "danger");
          logout(); // Garante que o usuário não fique em estado inconsistente
	  btn.disabled = false;
      }

    } else {
      const errorMsg = await res.text();
      exibirMensagem("loginMensagem", errorMsg || "Email ou senha inválidos.", "danger");
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Erro na função realizarLogin:", error);
    exibirMensagem("loginMensagem", "Erro ao tentar fazer login. Verifique a conexão.", "danger");
  } finally {
      btn.disabled = false;
  }
}

function logout() {
//  console.log("Executando logout...");
  token = null;
  permissoes = []; 
  localStorage.removeItem("authToken");
  localStorage.removeItem("userPermissoes");
  mostrarSecao('loginSection');
  // Limpa campos de login apenas se a seção de login for visível
  const loginEmailInput = document.getElementById("loginEmail");
  const loginSenhaInput = document.getElementById("loginSenha");
  if (loginEmailInput) loginEmailInput.value = '';
  if (loginSenhaInput) loginSenhaInput.value = '';
  limparMensagem("loginMensagem");
}

function configurarMenuPrincipal() {
    // Usa diretamente a variável global 'permissoes', que deve ter sido carregada
    const safePermissoes = Array.isArray(permissoes) ? permissoes : [];
//    console.log("Configurando menu com permissões:", safePermissoes);

    // Usa toggle com boolean diretamente
    document.getElementById('btnGerenciarEventos').classList.toggle('d-none', !(safePermissoes.includes('GERENTE_EVENTOS') || safePermissoes.includes('ADMIN')));
    document.getElementById('btnGerenciarPessoas').classList.toggle('d-none', !(safePermissoes.includes('GERENTE_PESSOAS') || safePermissoes.includes('ADMIN')));
    document.getElementById('btnGerenciarCortesias').classList.toggle('d-none', !(safePermissoes.includes('GERENTE_CORTESIAS') || safePermissoes.includes('ADMIN')));
    document.getElementById('btnGerenciarUsuarios').classList.toggle('d-none', !safePermissoes.includes('ADMIN'));
}

// --- Lógica de Navegação (Menus e Seções) --- 

function toggleSubmenu(submenuIdToShow) {
    // Oculta todas as seções <section> (conteúdo principal)
    document.querySelectorAll('section').forEach(el => el.classList.add('d-none'));
    // Oculta ou mostra os submenus .submenu
    document.querySelectorAll('.submenu').forEach(menu => {
        if (menu.id === submenuIdToShow) {
            menu.classList.toggle('d-none'); // Alterna a visibilidade do submenu clicado
        } else {
            menu.classList.add('d-none'); // Garante que outros submenus estejam fechados
        }
    });
}

function mostrar(sectionIdToShow) {
    // Fecha todos os submenus ao mostrar uma seção de conteúdo
    document.querySelectorAll('.submenu').forEach(el => el.classList.add('d-none'));
    // Oculta todas as outras seções <section>
    document.querySelectorAll('section').forEach(el => {
        if (el.id !== sectionIdToShow) {
             el.classList.add('d-none');
        }
    });

    // Mostra a seção de conteúdo desejada
    const secao = document.getElementById(sectionIdToShow);
    if (secao) {
        secao.classList.remove('d-none');
//        console.log(`Mostrando seção interna: ${sectionIdToShow}`); // Log para depuração
    } else {
         console.error(`Seção interna com ID ${sectionIdToShow} não encontrada.`);
    }

    // Limpa mensagens de resultado anteriores
    document.querySelectorAll(".resultado").forEach(div => limparMensagem(div.id));

    // Lógica específica ao mostrar certas seções (carregar dados, limpar forms, etc.)
    if (sectionIdToShow === "cadastroEvento") limparFormularioEvento();
    if (sectionIdToShow === "consultaCortesiasEvento") {
        carregarEventosSelect("eventosSelectCortesia");
        listarCortesiasEvento();
    }
    if (sectionIdToShow === "solicitarCortesia") {
        document.getElementById("resSolicitarCortesia").classList.add('d-none');
        document.getElementById("cpfSolicitar").value = "";
        carregarEventosSelect("eventoIdSolicitar");
    }
    if (sectionIdToShow === "validarCortesia") carregarEventosSelect("eventoIdValidar");
    if (sectionIdToShow === "consultaEvento") {
        document.getElementById("linkGerado").classList.add('d-none');
        buscarEventos(); // Carrega eventos ao mostrar a consulta
    }
    if (sectionIdToShow === "listarUsuarios") listarUsuarios();
    if (sectionIdToShow === "listarPessoas") buscarPessoas();
    if (sectionIdToShow === "cadastroPessoa") limparFormularioPessoa();
}

// --- Gerenciamento de Usuários --- 

async function cadastrarNovoUsuario() {
  const nome = document.getElementById("novoUsuarioNome").value;
  const email = document.getElementById("novoUsuarioEmail").value;
  const senha = document.getElementById("novoUsuarioSenha").value;
  const permissoesSelecionadas = Array.from(document.querySelectorAll(".chkPermissao:checked")).map(cb => cb.value);
  const resDivId = "resCadastroUsuario";

  limparMensagem(resDivId);

  if (!nome || !email || !senha || permissoesSelecionadas.length === 0) {
    exibirMensagem(resDivId, "Preencha todos os campos.", "warning");
    return;
  }

  try {
      const res = await authedFetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, permissoes: permissoesSelecionadas })
      });
      
      if (res.ok) {
          exibirMensagem(resDivId, "Usuário cadastrado com sucesso!", "success");
          document.getElementById("novoUsuarioNome").value = "";
          document.getElementById("novoUsuarioEmail").value = "";
          document.getElementById("novoUsuarioSenha").value = "";
          document.querySelectorAll(".chkPermissao").forEach(cb => cb.checked = false);
          listarUsuarios(); // Atualiza a lista após cadastro
      } else {
          const msg = await res.text();
          exibirMensagem(resDivId, msg || "Erro ao cadastrar usuário.", "danger");
      }
  } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      exibirMensagem(resDivId, `Erro: ${error.message}`, "danger");
  }
}

async function listarUsuarios() {
  const nome = document.getElementById("filtroNomeUsuario").value;
  const email = document.getElementById("filtroEmailUsuario").value;
  const tabelaBody = document.getElementById("tabelaUsuariosBody"); // Target tbody
  const url = new URL(API + "/usuario");
  if (nome) url.searchParams.append("nome", nome);
  if (email) url.searchParams.append("email", email);

  if (!tabelaBody) {
      console.error("Elemento tbody #tabelaUsuariosBody não encontrado!");
      return;
  }
  tabelaBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

  try {
      const res = await authedFetch(url);
      if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
      const data = await res.json();

      if (!data || data.length === 0) {
          tabelaBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum usuário encontrado.</td></tr>';
          return;
      }

      tabelaBody.innerHTML = ''; // Limpa o tbody
      data.forEach(u => {
        const userPerms = Array.isArray(u.permissoes) ? u.permissoes : []; 
        const permissoesCheckboxes = ["ADMIN", "GERENTE_EVENTOS", "GERENTE_PESSOAS", "GERENTE_CORTESIAS"].map(p =>
            `<div class="form-check form-check-inline">
               <input class="form-check-input" type="checkbox" name="permissao_${u.id}" value="${p}" ${userPerms.includes(p) ? "checked" : ""} id="perm_${u.id}_${p}">
               <label class="form-check-label small" for="perm_${u.id}_${p}">${p.replace('GERENTE_', '')}</label>
             </div>`
          ).join("");
          
        const row = tabelaBody.insertRow();
        row.innerHTML = `
            <td>${u.id}</td>
            <td><input class="form-control form-control-sm" value="${u.nome || ''}" id="nome_${u.id}"></td>
            <td><input class="form-control form-control-sm" value="${u.email || ''}" id="email_${u.id}"></td>
            <td>${permissoesCheckboxes}</td>
            <td><input type="password" class="form-control form-control-sm" placeholder="(Manter atual)" id="senha_${u.id}"></td>
            <td>
              <button class="btn btn-success btn-sm me-1" onclick="editarUsuario(${u.id})" data-bs-toggle="tooltip" data-bs-placement="top" title="Salvar Alterações"><i class="bi bi-check-lg"></i></button>
              <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${u.id})" data-bs-toggle="tooltip" data-bs-placement="top" title="Excluir Usuário"><i class="bi bi-trash"></i></button>
            </td>
        `;
      });
      
      inicializarTooltips(tabelaBody); // Inicializa tooltips após renderizar

  } catch (error) {
      console.error("Erro ao listar usuários:", error);
      tabelaBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro ao carregar usuários: ${error.message}</td></tr>`;
  }
}

async function editarUsuario(id) {
  const nome = document.getElementById("nome_" + id).value;
  const email = document.getElementById("email_" + id).value;
  const permissoes = Array.from(document.querySelectorAll(`input[name='permissao_${id}']:checked`)).map(cb => cb.value);
  const senha = document.getElementById("senha_" + id).value;

  const body = { nome, email, permissoes };
  if (senha) {
    body.senha = senha;
  }

  try {
      const res = await authedFetch(API + "/usuario/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
          alert("Usuário atualizado com sucesso!");
          listarUsuarios(); // Recarrega a lista
      } else {
          const msg = await res.text();
          alert(`Erro ao atualizar: ${msg || 'Erro desconhecido'}`);
      }
  } catch(error) {
      console.error("Erro ao editar usuário:", error);
      alert(`Erro: ${error.message}`);
  }
}

async function excluirUsuario(id) {
  if (!confirm("Tem certeza que deseja excluir este usuário? A ação não pode ser desfeita.")) return;

  try {
      const res = await authedFetch(API + "/usuario/" + id, { method: "DELETE" });
      if (res.ok) {
          alert("Usuário excluído com sucesso!");
          listarUsuarios(); // Recarrega a lista
      } else {
          const msg = await res.text();
          alert(`Erro ao excluir: ${msg || 'Erro desconhecido'}`);
      }
  } catch(error) {
      console.error("Erro ao excluir usuário:", error);
      alert(`Erro: ${error.message}`);
  }
}

// --- Gerenciamento de Eventos --- 

async function cadastrarEvento() {
    const btn = document.getElementById("btnCadastrarEvento");
    const resDivId = "resCadastroEvento";
    btn.disabled = true;
    limparMensagem(resDivId);

    try {
        const nome = document.getElementById("nomeEvento").value.trim();
        const dataInicio = document.getElementById("dataInicioEvento").value;
        const dataFim = document.getElementById("dataFimEvento").value;
        const local = document.getElementById("localEvento").value.trim();
        const responsavel = document.getElementById("responsavelEvento").value.trim();
        const quantidadeCortesias = parseInt(document.getElementById("quantidadeCortesias").value);

        if (!nome || !dataInicio || !dataFim || !local || !responsavel || isNaN(quantidadeCortesias)) {
            exibirMensagem(resDivId, "Preencha todos os campos corretamente.", "warning"); return;
        }
        if (quantidadeCortesias < 0) {
            exibirMensagem(resDivId, "Quantidade de cortesias não pode ser negativa.", "warning"); return;
        }
        if (new Date(dataFim) < new Date(dataInicio)) {
             exibirMensagem(resDivId, "Data final não pode ser anterior à data inicial.", "warning"); return;
        }

        const dataEvento = { nome, dataInicio: dataInicio + ":00", dataFim: dataFim + ":00", local, responsavel, quantidadeCortesias };

        const res = await authedFetch(`${API}/eventos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataEvento)
        });

        if (res.ok) {
            exibirMensagem(resDivId, "Evento cadastrado com sucesso!", "success");
            limparFormularioEvento();
        } else {
            const msg = await res.text();
            exibirMensagem(resDivId, `Erro: ${msg || 'Erro desconhecido'}`, "danger");
        }
    } catch (e) {
        console.error("Erro ao cadastrar evento:", e);
        exibirMensagem(resDivId, `Erro: ${e.message}`, "danger");
    } finally {
        btn.disabled = false;
    }
}

function limparFormularioEvento() {
    const form = document.getElementById("formCadastroEvento");
    if (form) form.reset();
    limparMensagem("resCadastroEvento");
}

async function buscarEventos() {
    document.getElementById("linkGerado").classList.add('d-none');

    const nome = document.getElementById("filtroNomeEvento").value;
    const data = document.getElementById("filtroDataEvento").value;
    const local = document.getElementById("filtroLocalEvento").value;
    const responsavel = document.getElementById("filtroResponsavelEvento").value;
    const tabelaBody = document.getElementById("tabelaEventosBody"); // Target tbody

    const params = new URLSearchParams();
    if (nome) params.append("nome", nome);
    if (data) params.append("data", data);
    if (local) params.append("local", local);
    if (responsavel) params.append("responsavel", responsavel);

    if (!tabelaBody) {
        console.error("Elemento tbody #tabelaEventosBody não encontrado!");
        return;
    }
    tabelaBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando...</td></tr>';

    try {
        const res = await authedFetch(`${API}/eventos/buscar?` + params.toString());
        if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
        const eventos = await res.json();

        if (!eventos.length) {
            tabelaBody.innerHTML = "<tr><td colspan='7' class='text-center text-muted'>Nenhum evento encontrado.</td></tr>";
            return;
        }

        tabelaBody.innerHTML = ''; // Limpa tbody
        eventos.forEach(e => {
            const eventoJsonString = JSON.stringify(e).replace(/"/g, "&quot;"); // Escapa aspas para onclick
            const row = tabelaBody.insertRow();
            row.innerHTML = `
                <td>${e.nome}</td>
                <td>${formatarDataComHora(e.dataInicio)}</td>
                <td>${formatarDataComHora(e.dataFim)}</td>
                <td>${e.local}</td>
                <td>${e.responsavel}</td>
                <td>${e.quantidadeCortesias}</td>
                <td>
                  <button class='btn btn-warning btn-sm me-1' onclick='editarEvento(${eventoJsonString})' data-bs-toggle="tooltip" data-bs-placement="top" title="Editar Evento"><i class="bi bi-pencil-square"></i></button>
                  <button class='btn btn-danger btn-sm me-1' onclick='excluirEvento(${e.id})' data-bs-toggle="tooltip" data-bs-placement="top" title="Excluir Evento"><i class="bi bi-trash"></i></button>
                  <button class='btn btn-info btn-sm' onclick="gerarLinkPublico(${e.id})" data-bs-toggle="tooltip" data-bs-placement="top" title="Gerar Link Público"><i class="bi bi-link-45deg"></i></button>
                </td>
            `;
        });

        inicializarTooltips(tabelaBody); // Inicializa tooltips após renderizar

    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        tabelaBody.innerHTML = `<tr><td colspan='7' class='text-center text-danger'>Erro ao carregar eventos: ${error.message}</td></tr>`;
    }
}

function editarEvento(evento) {
    // Preenche o formulário de edição
    document.getElementById("editEventoId").value = evento.id;
    document.getElementById("editNomeEvento").value = evento.nome;
    // Formata data para datetime-local input
    document.getElementById("editDataInicioEvento").value = evento.dataInicio ? evento.dataInicio.substring(0, 16) : '';
    document.getElementById("editDataFimEvento").value = evento.dataFim ? evento.dataFim.substring(0, 16) : '';
    document.getElementById("editLocalEvento").value = evento.local;
    document.getElementById("editResponsavelEvento").value = evento.responsavel;
    document.getElementById("editQtdCortesiasEvento").value = evento.quantidadeCortesias;
    limparMensagem("resEditarEvento");
    mostrar('editarEvento');
}

async function salvarEdicaoEvento() {
    const btn = document.getElementById("btnEditarEvento");
    const resDivId = "resEditarEvento";
    if (!btn) { console.error("Botão #btnSalvarEdicaoEvento não encontrado"); return; }
    btn.disabled = true;
    limparMensagem(resDivId);

    try {
        const id = document.getElementById("editEventoId").value;
        const nome = document.getElementById("editNomeEvento").value.trim();
        const dataInicio = document.getElementById("editDataInicioEvento").value;
        const dataFim = document.getElementById("editDataFimEvento").value;
        const local = document.getElementById("editLocalEvento").value.trim();
        const responsavel = document.getElementById("editResponsavelEvento").value.trim();
        const quantidadeCortesias = parseInt(document.getElementById("editQtdCortesiasEvento").value);

        if (!nome || !dataInicio || !dataFim || !local || !responsavel || isNaN(quantidadeCortesias)) {
            exibirMensagem(resDivId, "Preencha todos os campos corretamente.", "warning"); return;
        }
         if (quantidadeCortesias < 0) {
            exibirMensagem(resDivId, "Quantidade de cortesias não pode ser negativa.", "warning"); return;
        }
        if (new Date(dataFim) < new Date(dataInicio)) {
             exibirMensagem(resDivId, "Data final não pode ser anterior à data inicial.", "warning"); return;
        }

        const dataEvento = { nome, dataInicio: dataInicio + ":00", dataFim: dataFim + ":00", local, responsavel, quantidadeCortesias };

        const res = await authedFetch(`${API}/eventos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataEvento)
        });

        if (res.ok) {
            exibirMensagem(resDivId, "Evento atualizado com sucesso! Retornando para a lista...", "success");
            setTimeout(() => {
                mostrar('consultaEvento'); // Volta para a consulta após sucesso
                // buscarEventos(); // Não precisa chamar aqui, pois mostrar() já chama
            }, 1500);
        } else {
            const msg = await res.text();
            exibirMensagem(resDivId, `Erro ao atualizar: ${msg || 'Erro desconhecido'}`, "danger");
        }
    } catch (e) {
        console.error("Erro ao salvar edição do evento:", e);
        exibirMensagem(resDivId, `Erro: ${e.message}`, "danger");
    } finally {
        if (btn) btn.disabled = false;
    }
}

function cancelarEdicaoEvento() {
    limparMensagem("resEditarEvento");
    mostrar('consultaEvento'); // Volta para a lista de eventos
}

async function excluirEvento(id) {
    if (!confirm("Tem certeza que deseja excluir este evento? Cortesias associadas também podem ser afetadas.")) return;

    try {
        const res = await authedFetch(`${API}/eventos/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Evento excluído com sucesso!");
            buscarEventos(); // Atualiza a lista
        } else {
            const msg = await res.text();
            alert(`Erro ao excluir: ${msg || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error("Erro ao excluir evento:", error);
        alert(`Erro: ${error.message}`);
    }
}

function gerarLinkPublico(eventoId) {
    // Assume que solicitar-cortesia.html está no mesmo nível ou um nível acima
    const pathParts = window.location.pathname.split('/');
    pathParts.pop(); // Remove o nome do arquivo atual (index.html)
    const basePath = pathParts.join('/');
    const link = `${window.location.origin}${basePath}/solicitar-cortesia.html?evento=${eventoId}`;
    
    const divLink = document.getElementById("linkGerado");
    const inputLink = document.getElementById("inputLinkPublico");
    if (!divLink || !inputLink) {
        console.error("Elementos #linkGerado ou #inputLinkPublico não encontrados.");
        return;
    }
    inputLink.value = link;
    gerarLinkComQr(link);
    divLink.classList.remove('d-none');
}

async function gerarLinkComQr(url) {
  const res = await fetch(`${API}/links/encurtar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  console.log("Link:", data.shortUrl);
  console.log("QR Code:", data.qrCodeUrl);

  document.getElementById("resultadoLink").innerText = data.shortUrl;
  document.getElementById("qrcode").src = data.qrCodeUrl;
}

function copiarLink() {
     const inputLink = document.getElementById("inputLinkPublico");
     if (!inputLink) return;
     inputLink.select();
     inputLink.setSelectionRange(0, 99999); // Para mobile
     try {
        navigator.clipboard.writeText(inputLink.value);
        alert('Link copiado para a área de transferência!');
     } catch (err) {
        console.error('Erro ao copiar link: ', err);
        alert('Erro ao copiar o link.');
     }
}

// --- Gerenciamento de Pessoas --- 

async function cadastrarPessoa() {
    const btn = document.getElementById("btnCadastrarPessoa");
    const resDivId = "resCadastroPessoa";
    if (!btn) { console.error("Botão #btnCadastrarPessoa não encontrado"); return; }
    btn.disabled = true;
    limparMensagem(resDivId);

    try {
        const nome = document.getElementById("nomePessoa").value.trim();
        const cpf = document.getElementById("cpfPessoa").value.replace(/\D/g, "");
        const dataNascimento = document.getElementById("dataNascimentoPessoa").value;
        const cidade = document.getElementById("cidadePessoa").value.trim();
        const telefone = document.getElementById("telefonePessoa").value.replace(/\D/g, "");
        const email = document.getElementById("emailPessoa").value.trim();

        if (!nome || !cpf || !dataNascimento || !cidade || !telefone || !email) {
            exibirMensagem(resDivId, "Preencha todos os campos corretamente.", "warning"); return;
        }
        if (!validarCPF(cpf)) {
            exibirMensagem(resDivId, "CPF inválido.", "warning"); return;
        }
        if (telefone.length < 10) {
            exibirMensagem(resDivId, "Telefone inválido (mínimo 10 dígitos com DDD).", "warning"); return;
        }
        if (!validarEmail(email)) {
            exibirMensagem(resDivId, "Email inválido.", "warning"); return;
        }
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const nascimento = new Date(dataNascimento); nascimento.setHours(0,0,0,0);
        const idadeAnos = hoje.getFullYear() - nascimento.getFullYear();
        const mesNasc = nascimento.getMonth();
        const diaNasc = nascimento.getDate();
        if (hoje.getMonth() < mesNasc || (hoje.getMonth() === mesNasc && hoje.getDate() < diaNasc)) {
           // Ainda não fez aniversário este ano
        }
        if (nascimento > hoje || idadeAnos < 0 || idadeAnos >= 120) { // Verifica idade razoável
            exibirMensagem(resDivId, "Data de nascimento inválida.", "warning"); return;
        }

        const data = { nome, cpf, dataNascimento, cidade, telefone, email };

        const res = await authedFetch(`${API}/pessoas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });


        if (res.ok || res.Created) {
            limparFormularioPessoa();
            exibirMensagem(resDivId, "Pessoa cadastrada com sucesso!", "success");
        } else {
            const msg = await res.text();
            exibirMensagem(resDivId, `Erro: ${msg || 'Erro desconhecido'}`, "danger");
        }

    } catch (e) {
        console.error("Erro ao cadastrar pessoa:", e);
        exibirMensagem(resDivId, `Erro: ${e.message}`, "danger");
    } finally {
        if (btn) btn.disabled = false;
    }
}

function limparFormularioPessoa() {
    const form = document.getElementById("formCadastroPessoa");
    if (form) form.reset();
    limparMensagem("resCadastroPessoa");
}

async function buscarPessoas() {
    const nome = document.getElementById("filtroNome").value;
    const cidade = document.getElementById("filtroCidade").value;
    const cpf = document.getElementById("filtroCPF").value.replace(/\D/g, "");
    const tabelaBody = document.getElementById("tabelaPessoasBody"); // Target tbody

    const params = new URLSearchParams();
    if (nome) params.append("nome", nome);
    if (cidade) params.append("cidade", cidade);
    if (cpf) params.append("cpf", cpf);

    if (!tabelaBody) {
        console.error("Elemento tbody #tabelaPessoasBody não encontrado!");
        return;
    }
    tabelaBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando...</td></tr>';

    try {
        const res = await authedFetch(`${API}/pessoas/buscar?` + params.toString());
        if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
        const pessoas = await res.json();

        if (!pessoas.length) {
            tabelaBody.innerHTML = "<tr><td colspan='7' class='text-center text-muted'>Nenhuma pessoa encontrada.</td></tr>";
            return;
        }

        tabelaBody.innerHTML = ''; // Limpa tbody
        pessoas.forEach(p => {
             const pessoaJsonString = JSON.stringify(p).replace(/"/g, "&quot;"); // Escapa aspas
             const row = tabelaBody.insertRow();
             row.innerHTML = `
                <td>${p.nome}</td>
                <td>${formatarCPF(p.cpf)}</td>
                <td>${formatarDataIso(p.dataNascimento)}</td>
                <td>${p.cidade}</td>
                <td>${formatarTelefone(p.telefone)}</td>
                <td>${p.email}</td>
                <td>
                  <button class='btn btn-warning btn-sm me-1' onclick='editarPessoa(${pessoaJsonString})' data-bs-toggle="tooltip" data-bs-placement="top" title="Editar Pessoa"><i class="bi bi-pencil-square"></i></button>
                  <button class='btn btn-danger btn-sm' onclick='excluirPessoa(${p.id})' data-bs-toggle="tooltip" data-bs-placement="top" title="Excluir Pessoa"><i class="bi bi-trash"></i></button>
                </td>
            `;
        });
        
        inicializarTooltips(tabelaBody); // Inicializa tooltips após renderizar

    } catch (error) {
        console.error("Erro ao buscar pessoas:", error);
        tabelaBody.innerHTML = `<tr><td colspan='7' class='text-center text-danger'>Erro ao carregar pessoas: ${error.message}</td></tr>`;
    }
}

function editarPessoa(pessoa) {
    document.getElementById("editId").value = pessoa.id;
    document.getElementById("editNome").value = pessoa.nome;
    document.getElementById("editCpf").value = formatarCPF(pessoa.cpf);
    document.getElementById("editDataNascimento").value = pessoa.dataNascimento; // Formato YYYY-MM-DD
    document.getElementById("editCidade").value = pessoa.cidade;
    document.getElementById("editTelefone").value = formatarTelefone(pessoa.telefone);
    document.getElementById("editEmail").value = pessoa.email;
    limparMensagem("resEditarPessoa");
    mostrar('editarPessoa');
}

async function salvarEdicaoPessoa() {
    const btn = document.getElementById("btnEditarPessoa");
    const resDivId = "resEditarPessoa";
    if (!btn) { console.error("Botão #btnSalvarEdicaoPessoa não encontrado"); return; }
    btn.disabled = true;
    limparMensagem(resDivId);

    try {
        const id = document.getElementById("editId").value;
        const nome = document.getElementById("editNome").value.trim();
        const cpf = document.getElementById("editCpf").value.replace(/\D/g, "");
        const dataNascimento = document.getElementById("editDataNascimento").value;
        const cidade = document.getElementById("editCidade").value.trim();
        const telefone = document.getElementById("editTelefone").value.replace(/\D/g, "");
        const email = document.getElementById("editEmail").value.trim();

        if (!nome || !cpf || !dataNascimento || !cidade || !telefone || !email) {
            exibirMensagem(resDivId, "Preencha todos os campos corretamente.", "warning"); return;
        }
        if (!validarCPF(cpf)) {
            exibirMensagem(resDivId, "CPF inválido.", "warning"); return;
        }
         if (telefone.length < 10) {
            exibirMensagem(resDivId, "Telefone inválido (mínimo 10 dígitos com DDD).", "warning"); return;
        }
        if (!validarEmail(email)) {
            exibirMensagem(resDivId, "Email inválido.", "warning"); return;
        }
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const nascimento = new Date(dataNascimento); nascimento.setHours(0,0,0,0);
        const idadeAnos = hoje.getFullYear() - nascimento.getFullYear();
        const mesNasc = nascimento.getMonth();
        const diaNasc = nascimento.getDate();
        if (hoje.getMonth() < mesNasc || (hoje.getMonth() === mesNasc && hoje.getDate() < diaNasc)) {
           // Ainda não fez aniversário este ano
        }
        if (nascimento > hoje || idadeAnos < 0 || idadeAnos >= 120) {
            exibirMensagem(resDivId, "Data de nascimento inválida.", "warning"); return;
        }

        const data = { nome, cpf, dataNascimento, cidade, telefone, email };

        const res = await authedFetch(`${API}/pessoas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            exibirMensagem(resDivId, "Pessoa atualizada com sucesso! Retornando para a lista...", "success");
            setTimeout(() => {
                mostrar('listarPessoas'); // Volta para a consulta
                // buscarPessoas(); // Não precisa chamar aqui, pois mostrar() já chama
            }, 1500);
        } else {
            const msg = await res.text();
            exibirMensagem(resDivId, `Erro ao atualizar: ${msg || 'Erro desconhecido'}`, "danger");
        }
    } catch (e) {
        console.error("Erro ao salvar edição da pessoa:", e);
        exibirMensagem(resDivId, `Erro: ${e.message}`, "danger");
    } finally {
        if (btn) btn.disabled = false;
    }
}

function cancelarEdicaoPessoa() {
    limparMensagem("resEditarPessoa");
    mostrar('listarPessoas');
}

async function excluirPessoa(id) {
    if (!confirm("Tem certeza que deseja excluir esta pessoa? Cortesias associadas podem ser afetadas.")) return;

    try {
        const res = await authedFetch(`${API}/pessoas/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Pessoa excluída com sucesso!");
            buscarPessoas(); // Atualiza a lista
        } else {
            const msg = await res.text();
            alert(`Erro ao excluir: ${msg || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error("Erro ao excluir pessoa:", error);
        alert(`Erro: ${error.message}`);
    }
}

// --- Gerenciamento de Cortesias --- 

async function carregarEventosSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) { console.error(`Select #${selectId} não encontrado.`); return; }
    select.innerHTML = "<option value=''>Carregando eventos...</option>";
    select.disabled = true;

    try {
        // Usa fetch normal se for na página pública, authedFetch se for na admin
        const fetchFunc = typeof authedFetch === 'function' ? authedFetch : fetch;
        const res = await fetchFunc(`${API}/eventos`); // Endpoint público ou protegido dependendo do contexto
        if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
        const eventos = await res.json();
        
        select.innerHTML = "<option value=''>Selecione um evento</option>";
        eventos.forEach(e => {
            const option = document.createElement("option");
            option.value = e.id;
            option.textContent = `${e.nome} (${formatarDataIso(e.dataInicio ? e.dataInicio.substring(0,10) : '')})`;
            select.appendChild(option);
        });
        select.disabled = false;
    } catch (error) {
        console.error("Erro ao carregar eventos no select:", error);
        select.innerHTML = `<option value=''>Erro ao carregar</option>`;
        select.disabled = true;
    }
}

async function solicitarCortesia() {
    const resDivId = "resSolicitarCortesia";
    limparMensagem(resDivId);
    const eventoId = document.getElementById("eventoIdSolicitar").value;
    const cpf = document.getElementById("cpfSolicitar").value.replace(/\D/g, "");

    if (!eventoId || !cpf) {
        exibirMensagem(resDivId, "Selecione o evento e informe o CPF.", "warning"); return;
    }
     if (!validarCPF(cpf)) {
        exibirMensagem(resDivId, "CPF inválido.", "warning"); return;
    }

    const data = { eventoId: parseInt(eventoId), cpf };

    try {
        const res = await authedFetch(`${API}/cortesias/solicitar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const msg = await res.text();
        if (res.ok) {
            exibirMensagem(resDivId, msg || "Cortesia solicitada com sucesso!", "success");
            document.getElementById("cpfSolicitar").value = ''; // Limpa CPF
        } else {
            exibirMensagem(resDivId, `Erro: ${msg || 'Erro desconhecido'}`, "danger");
        }
    } catch (error) {
        console.error("Erro ao solicitar cortesia:", error);
        exibirMensagem(resDivId, `Erro: ${error.message}`, "danger");
    }
}

async function validarCortesia() {
    const resDivId = "resValidarCortesia";
    limparMensagem(resDivId);
    const eventoId = document.getElementById("eventoIdValidar").value;
    const codigo = document.getElementById("codigoCortesia").value.trim();

    if (!eventoId || !codigo) {
        exibirMensagem(resDivId, "Selecione o evento e informe o Código da Cortesia.", "warning"); return;
    }

    try {
        const res = await authedFetch(`${API}/cortesias/evento/${eventoId}/validar?codigo=${codigo}`, {
            method: "POST"
        });
        const msg = await res.text();
        if (res.ok) {
            exibirMensagem(resDivId, msg || "Cortesia validada com sucesso!", "success");
             document.getElementById("codigoCortesia").value = ''; // Limpa código
        } else {
            exibirMensagem(resDivId, `Erro: ${msg || 'Erro desconhecido'}`, "danger");
        }
    } catch (error) {
        console.error("Erro ao validar cortesia:", error);
        exibirMensagem(resDivId, `Erro: ${error.message}`, "danger");
    }
}

let cortesiasAtual = [];

async function listarCortesiasEvento() {
    const eventoId = document.getElementById("eventosSelectCortesia").value;
    const filtroResgate = document.getElementById("filtroResgate").value;
    const tabelaBody = document.getElementById("tabelaCortesiasBody"); // Target tbody

    if (!tabelaBody) {
        console.error("Elemento tbody #tabelaCortesiasBody não encontrado!");
        return;
    }

    if (!eventoId) {
        tabelaBody.innerHTML = "<tr><td colspan='5' class='text-center text-muted'>Selecione um evento.</td></tr>";
        return;
    }

    const params = new URLSearchParams();
    if (filtroResgate !== "") params.append("resgatada", filtroResgate);

    tabelaBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';

    try {
        const res = await authedFetch(`${API}/cortesias/evento/${eventoId}?` + params.toString());
        if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
        const cortesias = await res.json();
        cortesiasAtual = cortesias;

        if (!cortesias.length) {
            tabelaBody.innerHTML = "<tr><td colspan='5' class='text-center text-muted'>Nenhuma cortesia encontrada para este evento/filtro.</td></tr>";
            return;
        }

        tabelaBody.innerHTML = ''; // Limpa tbody
        cortesias.forEach(c => {
            const status = c.resgatada ? `<span class="badge bg-success">Resgatada</span>` : `<span class="badge bg-warning text-dark">Não Resgatada</span>`;
            const row = tabelaBody.insertRow();
            row.innerHTML = `
                <td><code>${c.codigo}</code></td>
                <td>${c.pessoaNome || 'N/A'} (${formatarCPF(c.pessoaCpf)})</td>
                <td>${status}</td>
                <td>${c.dataSolicitacao}</td>
                <td>${!c.resgatada ? `<button class='btn btn-warning btn-sm' onclick="marcarResgatada('${c.codigo}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Resgatar Cortesia"><i class="bi bi-pencil-square"></i></button>` : ""}</td>
            `;
        });
        
        inicializarTooltips(tabelaBody); // Inicializa tooltips após renderizar

    } catch (error) {
        console.error("Erro ao listar cortesias:", error);
        tabelaBody.innerHTML = `<tr><td colspan='5' class='text-center text-danger'>Erro ao carregar cortesias: ${error.message}</td></tr>`;
    }
}

//async function excluirCortesia(id) {
//    if (!confirm("Tem certeza que deseja excluir esta cortesia?")) return;
//
//    try {
//        const res = await authedFetch(`${API}/cortesias/${id}`, { method: "DELETE" });
//        if (res.ok) {
//            alert("Cortesia excluída com sucesso!");
//            listarCortesiasEvento(); // Atualiza a lista
//        } else {
//            const msg = await res.text();
//            alert(`Erro ao excluir: ${msg || 'Erro desconhecido'}`);
//        }
//    } catch (error) {
//        console.error("Erro ao excluir cortesia:", error);
//        alert(`Erro: ${error.message}`);
//    }
//}

async function marcarResgatada(codigo) {
  if (!confirm("Deseja marcar esta cortesia como resgatada?")) return;

  const res = await authedFetch(`${API}/cortesias/resgatar?codigo=${codigo}`, {
    method: "POST"
  });

  alert(await res.text());
  listarCortesiasEvento(); // recarrega tabela
}

async function exportarCSV() {
  if (!cortesiasAtual.length) {
    alert("Nenhuma cortesia para exportar.\n\nPrimeiro liste as cortesias para poder exportar!");
    return;
  }

  const linhas = [
    ["Código", "Nome", "CPF", "Resgatada", "Data Solicitação"],
    ...cortesiasAtual.map(c => [
      c.codigo,
      c.pessoaNome,
      c.pessoaCpf,
      c.resgatada ? "Sim" : "Não",
      c.dataSolicitacao
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

// --- Funções de Formatação e Validação --- 

function validarCPF(cpf) {
  cpf = String(cpf).replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase());
}

function formatarDataIso(isoDateString) {
    if (!isoDateString || isoDateString.length < 10) return '-';
    try {
        const [ano, mes, dia] = isoDateString.substring(0, 10).split("-");
        if (!ano || !mes || !dia) return '-';
        return `${dia}/${mes}/${ano}`;
    } catch (e) {
        console.error("Erro ao formatar data ISO:", isoDateString, e);
        return '-';
    }
}

function formatarDataComHora(isoString) {
    if (!isoString) return '-';
    try {
        // Tenta extrair YYYY-MM-DD e HH:MM diretamente da string
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
        if (match) {
            const [, ano, mes, dia, hora, minuto] = match;
            // Retorna no formato dd/MM/yyyy HH:mm
            return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
        } else {
            // Fallback: Se não conseguir extrair, tenta formatar a data apenas (sem hora)
            console.warn("Não foi possível extrair data e hora de:", isoString, ". Formatando apenas a data.");
            return formatarDataIso(isoString);
        }
    } catch (e) {
        console.error("Erro ao formatar data com hora (ignorando timezone):", isoString, e);
        return '-';
    }
}

function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = String(cpf).replace(/\D/g, '').padStart(11, '0');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    telefone = String(telefone).replace(/\D/g, '');
    if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (telefone.length === 10) {
        return telefone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
        return telefone; // Retorna sem formatação se não for 10 ou 11 dígitos
    }
}

// --- Inicialização da Página --- 

async function inicializarApp() {
//    console.log("Inicializando aplicação...");
    const storedToken = localStorage.getItem("authToken");
    let usuarioAutenticado = false;

//    if (storedToken) {
//        console.log("Token encontrado no localStorage. Tentando carregar dados do usuário...");
//        token = storedToken; // Define o token global para authedFetch funcionar
//        usuarioAutenticado = await carregarDadosUsuario(); // Tenta carregar permissões
//    }
//
//    if (usuarioAutenticado) {
//        console.log("Usuário autenticado. Configurando e mostrando menu principal.");
//        configurarMenuPrincipal();
//        mostrarSecao('menuPrincipal');
//    } else {
//        console.log("Usuário não autenticado ou falha ao carregar dados. Mostrando tela de login.");
        // Garante que token e permissões locais sejam nulos se a autenticação falhar
        token = null;
        permissoes = [];
        localStorage.removeItem("authToken");
        localStorage.removeItem("userPermissoes");
        mostrarSecao('loginSection');
//    }

    // Aplica máscaras e validações aos inputs relevantes
    // (Código das máscaras e validações permanece o mesmo da v3)
    const applyCpfMask = (inputElement) => {
        if (!inputElement) return;
        inputElement.addEventListener("input", () => {
            let value = inputElement.value.replace(/\D/g, "");
            value = value.substring(0, 11);
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            inputElement.value = value;
        });
         inputElement.addEventListener("blur", () => {
            const rawCpf = inputElement.value.replace(/\D/g, "");
            if (rawCpf.length > 0 && !validarCPF(rawCpf)) {
                // Usa a div de mensagem associada se existir, senão alert
                const form = inputElement.closest('form');
                const resDivId = form ? form.querySelector('.resultado')?.id : null;
                if (resDivId) {
                    exibirMensagem(resDivId, "CPF inválido.", "warning");
                } else {
                    alert("CPF inválido.");
                }
            }
        });
    };
    
    const applyPhoneMask = (inputElement) => {
         if (!inputElement) return;
         inputElement.addEventListener("input", () => {
            let value = inputElement.value.replace(/\D/g, "");
            value = value.substring(0, 11);
            if (value.length > 10) {
                 value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
            } else if (value.length > 6) {
                 value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
            } else if (value.length > 2) {
                 value = value.replace(/^(\d{2})(\d*)/, "($1) $2");
            } else if (value.length > 0) {
                 value = value.replace(/^(\d*)/, "($1");
            }
            inputElement.value = value;
        });
    };

    applyCpfMask(document.getElementById("cpfPessoa"));
    applyPhoneMask(document.getElementById("telefonePessoa"));
    applyCpfMask(document.getElementById("cpfSolicitar"));
    applyCpfMask(document.getElementById("filtroCPF"));
    applyCpfMask(document.getElementById("editCpf"));
    applyPhoneMask(document.getElementById("editTelefone"));

    const dataNascInput = document.getElementById("dataNascimentoPessoa");
    if (dataNascInput) {
        dataNascInput.addEventListener("blur", () => {
            const data = new Date(dataNascInput.value);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            data.setHours(0, 0, 0, 0); 
            const idadeAnos = hoje.getFullYear() - data.getFullYear();
            const mesNasc = data.getMonth();
            const diaNasc = data.getDate();
            if (hoje.getMonth() < mesNasc || (hoje.getMonth() === mesNasc && hoje.getDate() < diaNasc)) {
               // Ainda não fez aniversário este ano
            }
            if (data > hoje || idadeAnos < 0 || idadeAnos >= 120) {
                 const form = dataNascInput.closest('form');
                 const resDivId = form ? form.querySelector('.resultado')?.id : null;
                 if (resDivId) {
                     exibirMensagem(resDivId, "Data de nascimento inválida.", "warning");
                 } else {
                     alert("Data de nascimento inválida.");
                 }
            }
        });
    }
     const editDataNascInput = document.getElementById("editDataNascimento");
     if (editDataNascInput) {
         editDataNascInput.addEventListener("blur", () => {
             const data = new Date(editDataNascInput.value);
             const hoje = new Date();
             hoje.setHours(0, 0, 0, 0);
             data.setHours(0, 0, 0, 0);
             const idadeAnos = hoje.getFullYear() - data.getFullYear();
             const mesNasc = data.getMonth();
             const diaNasc = data.getDate();
             if (hoje.getMonth() < mesNasc || (hoje.getMonth() === mesNasc && hoje.getDate() < diaNasc)) {
                // Ainda não fez aniversário este ano
             }
             if (data > hoje || idadeAnos < 0 || idadeAnos >= 120) {
                  const form = editDataNascInput.closest('form');
                  const resDivId = form ? form.querySelector('.resultado')?.id : null;
                  if (resDivId) {
                      exibirMensagem(resDivId, "Data de nascimento inválida.", "warning");
                  } else {
                      alert("Data de nascimento inválida.");
                  }
             }
         });
     }
}

// Adiciona o listener para iniciar a aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", inicializarApp);

