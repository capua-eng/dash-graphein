// JavaScript para controle do dropdown por clique
document.addEventListener('DOMContentLoaded', function () {
    const dropdownBtn = document.getElementById('relatorioDropdown');
    const dropdown = dropdownBtn.closest('.dropdown');

    dropdownBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Fechar o dropdown ao clicar em qualquer lugar fora dele
    document.addEventListener('click', function () {
        dropdown.classList.remove('active');
    });

    // Prevenir que o dropdown feche ao clicar dentro dele
    dropdown.querySelector('.dropdown-content').addEventListener('click', function (e) {
        e.stopPropagation();
    });
});

// Modal
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('modalRelatorio');
    const closeModal = document.querySelector('.modal .close');

    // Pegando todos os links do dropdown de relatórios
    const relatorioLinks = document.querySelectorAll('.dropdown-content a');

    relatorioLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Evita o comportamento padrão do link
            modal.style.display = 'block'; // Mostra o modal
        });
    });

    // Fechar o modal quando clicar no botão de fechar (X)
    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Fechar o modal se clicar fora do conteúdo do modal
    window.addEventListener('click', function (e) {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
});


// --- ADICIONE AQUI O NOVO CÓDIGO ---
document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
    label.addEventListener('click', () => {
        document.getElementById(label.getAttribute('for')).showPicker();
    });
});
// -----------------------------------



document.addEventListener('DOMContentLoaded', function () {
    const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');

    gerarRelatorioBtn.addEventListener('click', function () {
        // Exibe o spinner
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';

        // Captura os valores dos inputs (ajuste os IDs conforme necessário)
        const startDate = document.getElementById('dataInicio').value;
        const endDate = document.getElementById('dataFim').value;
        const groupBy = document.getElementById('intervalo').value;
        console.log(`Data de inicio: ${startDate}, Data de fim: ${endDate},  asdasda: ${groupBy}`)

        // Monta a URL da API
        const url = `http://100.83.80.13:1880/gerar-relatorio?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

        // Faz a requisição
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta da API');
                }
                else {
                    alert('Relatório gerado com sucesso!')
                }
                return response.blob(); // Espera um PDF
            })
            .then(blob => {
                if (spinner) spinner.style.display = 'none';

                // Cria um link temporário para download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'relatorio.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                if (spinner) spinner.style.display = 'none';
                alert('Erro ao gerar relatório: ' + error.message);
            });
    });
});


document.addEventListener('DOMContentLoaded', async function() {
    const arrowIcons = document.querySelectorAll('.arrow-icon');
    
    try {
        // 1. Busca os dados reais da API
        const response = await fetch('http://192.168.0.252:8080/api/tela_inicial');
        if (!response.ok) throw new Error('Erro ao buscar dados');
        
        const data = await response.json();
        
        // 2. Converte os dados da API para o formato de array que você usava
        const statusInversores = Array(18).fill(-1); // Default (0 = operando)
        
        // Preenche com os valores reais da API
        for (let i = 1; i <= 18; i++) {
            const inversorKey = `Inversor${i}`;
            if (data[inversorKey]) {
                statusInversores[i-1] = data[inversorKey]._Status;
            }
        }
        
        // 3. Atualiza a interface (igual ao seu código original)
        arrowIcons.forEach((icon, index) => {
            const status = statusInversores[index];
            icon.classList.remove('status-1', 'status--1', 'status-0', 'status-2');
            
            switch(status) {
                case 1: icon.classList.add('status-1'); break;
                case -1: icon.classList.add('status--1'); break;
                case 0: icon.classList.add('status-0'); break;
                case 2: icon.classList.add('status-2'); break;
                default: icon.style.backgroundColor = '#000';
            }
            
            const label = icon.closest('.inversor-item').querySelector('.inversor-label');
            label.textContent = `Inversor ${index + 1}`;
        });
        
        console.log('Status atualizados com dados reais:', statusInversores);
        
    } catch (error) {
        console.error('Erro ao atualizar interface:', error);
        
        // Fallback: mostra mensagem de erro (opcional)
        arrowIcons.forEach(icon => {
            icon.style.backgroundColor = '#ccc';
            const label = icon.closest('.inversor-item').querySelector('.inversor-label');
            label.textContent = 'Erro';
        });
    }
});




// Variável global para armazenar os dados atuais
let dadosAtuais = [];
let intervaloConexao = null;

// Função principal que carrega e atualiza os dados
function carregarEAtualizarDados() {
    // Primeira carga dos dados
    atualizarDados();
    
    // Configura a atualização periódica (a cada 60 segundos)
    intervaloConexao = setInterval(atualizarDados, 60000);
    
    // Configura os eventos dos cards
    configurarCards();
}

// Função para buscar e atualizar os dados do JSON
function atualizarDados() {
    fetch('dados_inversores.json')
        .then(response => response.json())
        .then(data => {
            console.log('Dados atualizados em:', new Date().toLocaleTimeString());
            dadosAtuais = data;
            
            // Atualiza os cards visíveis na tela
            atualizarCardsVisiveis();
        })
        .catch(error => console.error('Erro ao carregar dados:', error));
}

// Função para configurar os eventos de clique nos cards
function configurarCards() {
    for (let i = 1; i <= 8; i++) {
        const card = document.getElementById(`card${i}`);
        if (!card) continue;

        card.addEventListener('click', function() {
            abrirModal(i, dadosAtuais);
        });
    }
}

// Função para atualizar os cards visíveis na tela
function atualizarCardsVisiveis() {
    // Aqui você pode adicionar lógica para atualizar elementos visíveis
    // Exemplo: se tiver algum resumo na tela principal
    console.log('Dados atualizados:', dadosAtuais);
}

// Função para abrir o modal (atualizada para usar dadosAtuais)
function abrirModal(inversorNum) {
    // Encontra os dados do inversor específico
    const inversorData = dadosAtuais.find(item => item[`Inversor${inversorNum}`])?.[`Inversor${inversorNum}`];
    
    // Fecha qualquer modal aberto anteriormente
    fecharTodosModais();
    
    // Cria um novo modal baseado no template
    const template = document.getElementById('modal-template');
    const modalClone = template.cloneNode(true);
    modalClone.id = `modal-inversor-${inversorNum}`;
    modalClone.style.display = 'block';
    
    // Preenche os dados do modal
    const modalElement = modalClone.querySelector('.modal-overlay');
    modalElement.querySelector('.inversor-number').textContent = inversorNum;
    
    if (inversorData) {
        modalElement.querySelector('.adc-value').textContent = inversorData.ADC?.toFixed(2) + ' A';
        modalElement.querySelector('.udc-value').textContent = inversorData.UDC?.toFixed(2) + ' V';
        modalElement.querySelector('.pdc-value').textContent = inversorData.PDC?.toFixed(3) + ' kW';
        
        // Atualiza o timestamp se existir no JSON
        if (inversorData.ultima_atualizacao) {
            modalElement.querySelector('.timestamp').textContent = 
                `Última atualização: ${inversorData.ultima_atualizacao}`;
        }
    } else {
        modalElement.querySelector('.adc-value').textContent = 'N/A';
        modalElement.querySelector('.udc-value').textContent = 'N/A';
        modalElement.querySelector('.pdc-value').textContent = 'N/A';
    }
    
    // Adiciona evento para fechar o modal
    modalElement.querySelector('.close-modal').addEventListener('click', function() {
        fecharModal(`modal-inversor-${inversorNum}`);
    });
    
    // Adiciona o modal ao body e exibe
    document.body.appendChild(modalClone);
    
    // Fecha o modal ao clicar fora do conteúdo
    modalElement.addEventListener('click', function(e) {
        if (e.target === modalElement) {
            fecharModal(`modal-inversor-${inversorNum}`);
        }
    });
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

function fecharTodosModais() {
    document.querySelectorAll('[id^="modal-inversor-"]').forEach(modal => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });
}

// Inicia o sistema quando a página carrega
document.addEventListener('DOMContentLoaded', carregarEAtualizarDados);