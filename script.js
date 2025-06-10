// Função de login simples
const usuariosSistema = [
    { usuario: "Debora", senha: "deb@2024" },
    { usuario: "Dariane", senha: "dar#321" },
    { usuario: "Marli", senha: "marli@789" },
    { usuario: "Jaqueline", senha: "jaq!456" },
    { usuario: "Ana Paula", senha: "anaP@2025" },
    { usuario: "Daniel", senha: "daniel#852" },
    { usuario: "admin", senha: "1234" } // mantém o admin
];

function realizarLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    const usuarioEncontrado = usuariosSistema.find(u => u.usuario === usuario && u.senha === senha);

    if (usuarioEncontrado) {
        document.getElementById("loginContainer").style.display = "none";
        document.getElementById("appContainer").style.display = "block";
        localStorage.setItem("usuarioLogado", usuario);

        // Aqui entra o trecho:
        if (usuario !== "admin") {
            document.getElementById("campoNome").style.display = "none";
            document.getElementById("nome").value = usuario;
        } else {
            document.getElementById("campoNome").style.display = "block";
            document.getElementById("nome").value = "";
        }

        carregarChamados();
    } else {
        alert("Usuário ou senha incorretos!");
    }
}

document.getElementById("formLogin").addEventListener("submit", realizarLogin);

const form = document.getElementById("formChamado");
const tabela = document.getElementById("tabelaChamados").getElementsByTagName("tbody")[0];

let editandoLinha = null;

form.addEventListener("submit", function(e) {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const problema = document.getElementById("problema").value;
    const prioridade = document.getElementById("prioridade").value;
    const dataHora = new Date().toLocaleString('pt-BR');
    const status = "Aberto";
    const usuarioLogado = localStorage.getItem("usuarioLogado") || "Desconhecido";

    if (editandoLinha) {
        // Atualiza a linha existente
        editandoLinha.cells[0].innerText = nome;
        editandoLinha.cells[1].innerText = problema;
        editandoLinha.cells[2].innerText = prioridade;
        editandoLinha.dataset.status = editandoLinha.cells[4].innerText;
        editandoLinha.dataset.prioridade = prioridade;
        salvarTodosChamados();
        editandoLinha = null;
    } else {
        const chamado = { nome, problema, prioridade, dataHora, status, criadoPor: usuarioLogado };
        salvarChamado(chamado);
        adicionarLinha(chamado);
    }

    form.reset();
});


function atualizarStatus(botao) {
    const linha = botao.parentNode.parentNode;
    linha.cells[4].innerText = "Finalizado";
    linha.cells[4].className = "status-finalizado";
    linha.dataset.status = "Finalizado";
    botao.disabled = true;
    botao.innerText = "Finalizado";
    botao.style.opacity = "0.6";
    salvarTodosChamados();
}

// Mostra/oculta o menu de opções
function mostrarMenuOpcoes(botao) {
    // Fecha outros menus abertos
    document.querySelectorAll('.menuOpcoes').forEach(menu => menu.style.display = 'none');
    const menu = botao.nextElementSibling;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';

    // Fecha o menu se clicar fora
    document.addEventListener('click', function fecharMenu(e) {
        if (!menu.contains(e.target) && e.target !== botao) {
            menu.style.display = 'none';
            document.removeEventListener('click', fecharMenu);
        }
    });
}

// Excluir chamado
function excluirChamado(botao) {
    const linha = botao.closest('tr');
    const status = linha.cells[4].innerText;

    if (status !== "Finalizado") {
        alert("Só é possível excluir chamados que estejam FINALIZADOS.");
        return;
    }

    let motivo = prompt("Informe o motivo da exclusão deste chamado (mínimo 20 caracteres):");
    if (!motivo || motivo.trim().length < 20) {
        alert("O motivo deve ter pelo menos 20 caracteres. Exclusão cancelada.");
        return;
    }

    // Recupera o usuário logado
const usuario = localStorage.getItem("usuarioLogado") || "Desconhecido";

    // Salva o motivo no localStorage
    const excluidos = JSON.parse(localStorage.getItem("chamadosExcluidos")) || [];
    excluidos.push({
        nome: linha.cells[0].innerText,
        problema: linha.cells[1].innerText,
        prioridade: linha.cells[2].innerText,
        dataHora: linha.cells[3].innerText,
        status: linha.cells[4].innerText,
        motivo: motivo,
        usuario: usuario,
        dataExclusao: new Date().toLocaleString('pt-BR')
    });
    localStorage.setItem("chamadosExcluidos", JSON.stringify(excluidos));

    linha.remove();
    salvarTodosChamados();
    alert("Chamado excluído com sucesso!\nMotivo: " + motivo);
}

// Editar chamado
function editarChamado(botao) {
    const linha = botao.closest('tr');
    document.getElementById('nome').value = linha.cells[0].innerText;
    document.getElementById('problema').value = linha.cells[1].innerText;
    document.getElementById('prioridade').value = linha.cells[2].innerText;
    editandoLinha = linha;
    // Fecha o menu de opções
    botao.parentElement.style.display = 'none';
}

// Filtros
document.getElementById("filtroStatus").addEventListener("change", filtrarChamados);
document.getElementById("filtroPrioridade").addEventListener("change", filtrarChamados);

function filtrarChamados() {
    const filtroStatus = document.getElementById("filtroStatus").value;
    const filtroPrioridade = document.getElementById("filtroPrioridade").value;
    const linhas = tabela.getElementsByTagName("tr");

    for (let i = 0; i < linhas.length; i++) {
        const status = linhas[i].dataset.status;
        const prioridade = linhas[i].dataset.prioridade;
        const exibirStatus = (filtroStatus === "" || filtroStatus === status);
        const exibirPrioridade = (filtroPrioridade === "" || filtroPrioridade === prioridade);
        linhas[i].style.display = (exibirStatus && exibirPrioridade) ? "" : "none";
    }
}

// LocalStorage: salvar, carregar, atualizar
function salvarChamado(chamado) {
    const chamados = JSON.parse(localStorage.getItem("chamados")) || [];
    chamados.push(chamado);
    localStorage.setItem("chamados", JSON.stringify(chamados));
}

function adicionarLinha(chamado) {
    const novaLinha = tabela.insertRow();

    const statusClass = chamado.status === "Finalizado" ? "status-finalizado" : "status-aberto";
    const botaoFinalizar = chamado.status === "Finalizado"
        ? '<button disabled style="opacity: 0.6;">Finalizado</button>'
        : '<button onclick="atualizarStatus(this)">Finalizar</button>';

    const usuarioLogado = localStorage.getItem("usuarioLogado");
    let opcoes = "";
    if (usuarioLogado === "admin") {
        opcoes = `
            <button class="btnOpcoes" onclick="mostrarMenuOpcoes(this)">Opções</button>
            <div class="menuOpcoes" style="display:none; position:absolute; background:#fff; border:1px solid #ccc; border-radius:6px; box-shadow:0 2px 8px #0002; z-index:10;">
                <button type="button" onclick="editarChamado(this)">Editar</button>
                <button type="button" onclick="excluirChamado(this)">Excluir</button>
            </div>
        `;
    }

    novaLinha.innerHTML = `
        <td>${chamado.nome}</td>
        <td>${chamado.problema}</td>
        <td>${chamado.prioridade}</td>
        <td>${chamado.dataHora}</td>
        <td class="${statusClass}">${chamado.status}</td>
        <td>
            ${botaoFinalizar}
            ${opcoes}
        </td>
    `;

    novaLinha.dataset.status = chamado.status;
    novaLinha.dataset.prioridade = chamado.prioridade;
    novaLinha.setAttribute('data-criado-por', chamado.criadoPor || "");
}

function salvarTodosChamados() {
    const linhas = tabela.getElementsByTagName("tr");
    const chamados = [];

    for (let linha of linhas) {
        chamados.push({
            nome: linha.cells[0].innerText,
            problema: linha.cells[1].innerText,
            prioridade: linha.cells[2].innerText,
            dataHora: linha.cells[3].innerText,
            status: linha.cells[4].innerText,
            criadoPor: linha.getAttribute('data-criado-por') || ""
        });
    }

    localStorage.setItem("chamados", JSON.stringify(chamados));
}

function carregarChamados() {
    tabela.innerHTML = "";
    const chamados = JSON.parse(localStorage.getItem("chamados")) || [];
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    chamados.forEach(chamado => {
        if (usuarioLogado === "admin" || chamado.criadoPor === usuarioLogado) {
            adicionarLinha(chamado);
        }
    });
}

// Esqueci minha senha
document.getElementById("esqueciSenha").addEventListener("click", function(e) {
    e.preventDefault();
    alert("Função de recuperação de senha não implementada.\nPor favor, entre em contato com o administrador do sistema. \nEmail: pamela@sammedi.com.br");
});

// Botão Sair
document.getElementById("btnLogout").addEventListener("click", function() {
    document.getElementById("appContainer").style.display = "none";
    document.getElementById("loginContainer").style.display = "block";
    document.getElementById("formLogin").reset();
});

// Botão Exportar para CSV
document.getElementById("btnExportar").addEventListener("click", function() {
    let csv = "Nome,Problema,Prioridade,Data/Hora,Status\n";
    const linhas = document.querySelectorAll("#tabelaChamados tbody tr");
    linhas.forEach(linha => {
        const colunas = linha.querySelectorAll("td");
        let row = [];
        for (let i = 0; i < 5; i++) { // Pega as 5 primeiras colunas
            row.push('"' + (colunas[i]?.innerText || "") + '"');
        }
        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chamados.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

window.addEventListener("DOMContentLoaded", function() {
    // Aplica modo noturno se já estava ativado
    if (localStorage.getItem("modoNoturno") === "true") {
        document.body.classList.add("modo-noturno");
    }

    // Adiciona o evento ao botão
    document.getElementById("btnModoNoturno").addEventListener("click", function() {
        document.body.classList.toggle("modo-noturno");
        localStorage.setItem("modoNoturno", document.body.classList.contains("modo-noturno"));
    });
});