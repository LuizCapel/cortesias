const API = "https://exclusive-krista-luizcapel-78430027.koyeb.app/api";
//const API = "http://186.233.152.174:8080/api";

const urlParams = new URLSearchParams(window.location.search);
const eventoId = urlParams.get("evento");

// Seleciona os elementos do DOM uma vez para reutilização
const mensagemDiv = document.getElementById("mensagem");
const formularioDiv = document.getElementById("formulario");
const dadosPessoaDiv = document.getElementById("dadosPessoa");
const cpfInput = document.getElementById("cpf");
const nomeInput = document.getElementById("nome");
const dataNascimentoInput = document.getElementById("dataNascimento");
const cidadeInput = document.getElementById("cidade");
const telefoneInput = document.getElementById("telefone");
const emailInput = document.getElementById("email");
const novaCortesiaDiv = document.getElementById("novaCortesia");

// Função para exibir mensagens usando alertas do Bootstrap
function exibirMensagem(texto, tipo = 'info') { // tipos: primary, secondary, success, danger, warning, info, light, dark
  mensagemDiv.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                             ${texto}
                             <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                           </div>`;
}

window.onload = async () => {
  if (!eventoId) {
    exibirMensagem("Evento não informado.", "danger");
    return;
  }

  try {
    exibirMensagem("Verificando disponibilidade de cortesias...", "info");
    const resp = await fetch(`${API}/cortesias/publico/disponiveis/${eventoId}`);
    if (!resp.ok) {
        // Tenta ler a mensagem de erro do backend, se houver
        const errorMsg = await resp.text();
        throw new Error(errorMsg || `Erro ao verificar disponibilidade: ${resp.status}`);
    }
    const json = await resp.json();

    if (!json.disponivel) {
      exibirMensagem("Todas as cortesias para este evento já foram solicitadas.", "warning");
      return;
    }

    // Exibe o formulário usando a classe do Bootstrap
    formularioDiv.classList.remove("d-none");
    exibirMensagem("Por favor, informe seu CPF para buscar seus dados. (Caso seja primeiro acesso, após tentar buscar irá aparecer uma tela de cadastro.)", "info");

  } catch (error) {
    console.error("Erro no carregamento:", error);
    exibirMensagem(`Erro ao carregar informações do evento: ${error.message}`, "danger");
  }
};

async function buscarPessoa() {
  const cpf = cpfInput.value.replace(/\D/g, ''); // Remove não-dígitos do CPF
  cpfInput.value = cpf;
  
  if (!cpf) {
      exibirMensagem("Por favor, digite um CPF válido.", "warning");
      dadosPessoaDiv.classList.add("d-none"); // Garante que os dados fiquem ocultos
      return;
  }

  exibirMensagem("Buscando dados...", "info"); // Feedback para o usuário
  dadosPessoaDiv.classList.add("d-none"); // Oculta dados antigos enquanto busca

  try {
    const res = await fetch(`${API}/pessoas/cpf/${cpf}`);
    if (res.ok) {
      const p = await res.json();
      nomeInput.value = p.nome || '';
      dataNascimentoInput.value = p.dataNascimento || '';
      cidadeInput.value = p.cidade || '';
      telefoneInput.value = p.telefone || '';
      emailInput.value = p.email || '';
      exibirMensagem("Pessoa encontrada! Verifique os dados e solicite a cortesia.", "success");
      // Exibe a seção de dados da pessoa
      dadosPessoaDiv.classList.remove("d-none");
    } else if (res.status === 404) {
        exibirMensagem("CPF não encontrado em nosso cadastro. Preencha seus dados para solicitar.", "info");
        // Limpa campos caso não encontre e permite preenchimento
        nomeInput.value = '';
        dataNascimentoInput.value = '';
        cidadeInput.value = '';
        telefoneInput.value = '';
        emailInput.value = '';
        // Libera campos para edição (removendo readonly, se houver)
        nomeInput.readOnly = false;
        dataNascimentoInput.readOnly = false;
        cidadeInput.readOnly = false;
        telefoneInput.readOnly = false;
        emailInput.readOnly = false;
        // Exibe a seção de dados da pessoa para preenchimento
        dadosPessoaDiv.classList.remove("d-none");
    } else {
        const errorMsg = await res.text();
        throw new Error(errorMsg || `Erro ao buscar CPF: ${res.status}`);
    }
  } catch (error) {
      console.error("Erro ao buscar pessoa:", error);
      exibirMensagem(`Erro ao buscar dados: ${error.message}`, "danger");
      dadosPessoaDiv.classList.add("d-none"); // Oculta em caso de erro
  }
}

async function solicitarCortesia() {
  // Validação simples dos campos (pode ser mais robusta)
  if (!nomeInput.value || !dataNascimentoInput.value || !cidadeInput.value || !telefoneInput.value || !emailInput.value) {
      exibirMensagem("Por favor, preencha todos os dados da pessoa.", "warning");
      return;
  }

  const payload = {
    cpf: cpfInput.value.replace(/\D/g, ''), // Garante envio só de números
    nome: nomeInput.value,
    dataNascimento: dataNascimentoInput.value,
    cidade: cidadeInput.value,
    telefone: telefoneInput.value,
    email: emailInput.value
  };

  exibirMensagem("Processando solicitação...", "info");

  try {
    const res = await fetch(`${API}/cortesias/publico/solicitar/${eventoId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const mensagem = await res.text(); // Pega a mensagem de resposta

    if (res.ok) {
      exibirMensagem(mensagem || "Cortesia solicitada com sucesso!", "success");
      // Opcional: Ocultar o formulário após sucesso
      formularioDiv.classList.add("d-none");
      novaCortesiaDiv.classList.remove("d-none");
    } else {
       // Exibe a mensagem de erro vinda do backend
       throw new Error(mensagem || `Erro ao solicitar cortesia: ${res.status}`);
    }
  } catch (error) {
      console.error("Erro ao solicitar cortesia:", error);
      exibirMensagem(`Erro na solicitação: ${error.message}`, "danger");
  }
}

async function novaCortesia() {
  location.reload();
}

