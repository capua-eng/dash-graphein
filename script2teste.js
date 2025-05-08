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
        const response = await fetch('http://192.168.0.30:3001/api/inversores');
        if (!response.ok) throw new Error('Erro ao buscar dados');
        
        const { data } = await response.json();
        
        // 2. Converte os dados da API para o formato de array que você usava
        const statusInversores = Array(18).fill(1); // Default (0 = operando)
        
        // Preenche com os valores reais da API
        Object.entries(data).forEach(([letra, inversor]) => {
            const index = letra.charCodeAt(0) - 65; // Converte A->0, B->1, etc.
            if (index >= 0 && index < 18) {
                statusInversores[index] = inversor.status;
            }
        });
        
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




document.addEventListener('DOMContentLoaded', function() {
    // Carrega os dados do JSON
    fetch('dados_inversores.json')
        .then(response => response.json())
        .then(data => {
            console.log('Dados carregados:', data); // Para verificação
            
            // Para cada card de inversor (1 a 8)
            for (let i = 1; i <= 8; i++) {
                const card = document.getElementById(`card${i}`);
                if (!card) continue;

                // Adiciona evento de clique ao card
                card.addEventListener('click', function() {
                    abrirModal(i, data);
                });
            }
        })
        .catch(error => console.error('Erro ao carregar dados:', error));
});

function abrirModal(inversorNum, data) {
    // Encontra os dados do inversor específico
    const inversorData = data.find(item => item[`Inversor${inversorNum}`])?.[`Inversor${inversorNum}`];
    
    // Cria um novo modal baseado no template
    const template = document.getElementById('modal-template');
    const modalClone = template.cloneNode(true);
    modalClone.id = `modal-inversor-${inversorNum}`;
    modalClone.style.display = 'block';
    
    // Preenche os dados do modal
    const modalElement = modalClone.querySelector('.modal-overlay');
    modalElement.querySelector('.inversor-number').textContent = inversorNum;
    
    if (inversorData) {
        // Acesso aos valores corrigido para a nova estrutura
        modalElement.querySelector('.adc-value').textContent = inversorData.ADC?.toFixed(2) + ' A';
        modalElement.querySelector('.udc-value').textContent = inversorData.UDC?.toFixed(2) + ' V';
        modalElement.querySelector('.pdc-value').textContent = inversorData.PDC?.toFixed(3) + ' kW';
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





// ==================== SERVIÇO CENTRAL DE DADOS ====================
const DataService = {
    dados: null,
    callbacks: [],
    intervalo: null,

    iniciar: function() {
        this.atualizarDados();
        this.intervalo = setInterval(() => this.atualizarDados(), 30000);
    },

    parar: function() {
        clearInterval(this.intervalo);
    },

    atualizarDados: async function() {
        try {
            const response = await fetch('http://192.168.0.252:8080/api/tela_inicial');
            if (!response.ok) throw new Error('Erro na API');
            this.dados = await response.json();
            this.notificarTodos();
            this.atualizarInterfaceCompleta();
            console.log('Dados atualizados:', this.dados);
        } catch (error) {
            console.error('Falha ao atualizar dados:', error);
        }
    },

    atualizarInterfaceCompleta: function() {
        if (!this.dados) return;

        // Atualiza os inversores (1 a 8 conforme seu JSON)
        for (let i = 1; i <= 8; i++) {
            const inversorKey = `Inversor${i}`;
            const inversorData = this.dados[inversorKey];
            if (!inversorData) continue;

            // 1. Atualiza valores na lista principal
            const pacElement = document.querySelector(`#inversor-${i}-pac`);
            const pdcElement = document.querySelector(`#inversor-${i}-pdc`);
            const arrowIcon = document.querySelector(`#inversor-${i} .arrow-icon`);
            const label = document.querySelector(`#inversor-${i} .inversor-label`);

            if (pacElement) pacElement.textContent = `${inversorData[`INV${i}_PAC`]?.toFixed(2) || '0.00'} kW`;
            if (pdcElement) pdcElement.textContent = `${inversorData[`INV${i}_PDC`]?.toFixed(2) || '0.00'} kW`;
            if (arrowIcon) {
                arrowIcon.className = 'arrow-icon';
                arrowIcon.classList.add(`status-${inversorData._Status}`);
            }
            if (label) label.textContent = `Inversor ${i}`;

            // 2. Atualiza cards se existirem
            const card = document.getElementById(`card${i}`);
            if (card) {
                const potenciaElement = card.querySelector('.card-potenica');
                if (potenciaElement) {
                    potenciaElement.textContent = `${inversorData[`INV${i}_PAC`]?.toFixed(2) || '0.00'} kW`;
                }
            }
        }
    },

    registrar: function(callback) {
        this.callbacks.push(callback);
        if (this.dados) callback(this.dados);
    },

    notificarTodos: function() {
        this.callbacks.forEach(cb => cb(this.dados));
    }
};

// ==================== CONTROLES DE INTERFACE ====================
function configurarDropdown() {
    const dropdownBtn = document.getElementById('relatorioDropdown');
    if (!dropdownBtn) return;

    const dropdown = dropdownBtn.closest('.dropdown');

    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', function() {
        dropdown.classList.remove('active');
    });

    dropdown.querySelector('.dropdown-content')?.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

function configurarModalRelatorio() {
    const modal = document.getElementById('modalRelatorio');
    if (!modal) return;

    const closeModal = document.querySelector('.modal .close');
    const relatorioLinks = document.querySelectorAll('.dropdown-content a');

    relatorioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
}

function configurarGeradorRelatorio() {
    const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');
    if (!gerarRelatorioBtn) return;

    gerarRelatorioBtn.addEventListener('click', function() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';

        const startDate = document.getElementById('dataInicio').value;
        const endDate = document.getElementById('dataFim').value;
        const groupBy = document.getElementById('intervalo').value;

        const url = `http://100.83.80.13:1880/gerar-relatorio?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Erro na resposta da API');
                alert('Relatório gerado com sucesso!');
                return response.blob();
            })
            .then(blob => {
                if (spinner) spinner.style.display = 'none';
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
}

function configurarDatePickers() {
    document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
        label.addEventListener('click', () => {
            document.getElementById(label.getAttribute('for')).showPicker();
        });
    });
}

function configurarCardsInversores() {
    for (let i = 1; i <= 8; i++) {
        const card = document.getElementById(`card${i}`);
        if (!card) continue;

        card.addEventListener('click', function() {
            abrirModalInversor(i);
        });
    }
}

function abrirModalInversor(inversorNum) {
    DataService.registrar((dados) => {
        const inversorData = dados[`Inversor${inversorNum}`];
        fecharTodosModais();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Inversor ${inversorNum}</h2>
                <div class="modal-data">
                    <p>Potência AC: <span class="pac-value">${inversorData?.[`INV${inversorNum}_PAC`]?.toFixed(2) || 'N/A'} kW</span></p>
                    <p>Potência DC: <span class="pdc-value">${inversorData?.[`INV${inversorNum}_PDC`]?.toFixed(2) || 'N/A'} kW</span></p>
                    <p>Status: <span class="status-value">${getStatusText(inversorData?._Status)}</span></p>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    });
}

function getStatusText(status) {
    switch(status) {
        case 0: return 'Operando';
        case 1: return 'Atenção';
        case -1: return 'Offline';
        case 2: return 'Crítico';
        default: return 'Desconhecido';
    }
}

function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.remove();
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    // Inicia serviços
    DataService.iniciar();
    
    // Configura componentes de interface
    configurarDropdown();
    configurarModalRelatorio();
    configurarGeradorRelatorio();
    configurarCardsInversores();
    configurarDatePickers();
});

window.addEventListener('beforeunload', () => DataService.parar());

// ==================== CONTROLE DOS INVERSORES (STATUS + LABELS) ====================
function configurarInversores() {
    const arrowIcons = document.querySelectorAll('.arrow-icon');
    if (arrowIcons.length === 0) return;

    DataService.registrar((dados) => {
        const statusInversores = Array(18).fill(-1);

        for (let i = 1; i <= 18; i++) {
            const inversorKey = `Inversor${i}`;
            if (dados[inversorKey]) {
                statusInversores[i-1] = dados[inversorKey]._Status;
            }
        }

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
            
            const label = icon.closest('.inversor-item')?.querySelector('.inversor-label');
            if (label) label.textContent = `Inversor ${index + 1}`;
        });
    });
}

// ==================== CONTROLE DOS CARDS DE INVERSORES ====================
function configurarCardsInversores() {
    DataService.registrar((dados) => {
        for (let i = 1; i <= 8; i++) {
            const card = document.getElementById(`card${i}`);
            if (!card) continue;

            const inversorData = dados[`Inversor${i}`];
            if (inversorData) {
                // Atualiza os dados visíveis nos cards
                const potenciaElement = card.querySelector('.card-potenica');
                if (potenciaElement) {
                    potenciaElement.textContent = `${inversorData.INV1_PAC?.toFixed(2) || '0'} kW`;
                }
            }
        }
    });

    // Configura eventos de clique nos cards
    for (let i = 1; i <= 8; i++) {
        const card = document.getElementById(`card${i}`);
        if (!card) continue;

        card.addEventListener('click', function() {
            abrirModalInversor(i);
        });
    }
}

function abrirModalInversor(inversorNum) {
    DataService.registrar((dados) => {
        const inversorData = dados[`Inversor${inversorNum}`];
        fecharTodosModais();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Inversor ${inversorNum}</h2>
                <div class="modal-data">
                    <p>Potência AC: <span class="pac-value">${inversorData?.INV1_PAC?.toFixed(2) || 'N/A'} kW</span></p>
                    <p>Potência DC: <span class="pdc-value">${inversorData?.INV1_PDC?.toFixed(2) || 'N/A'} kW</span></p>
                    <p>Status: <span class="status-value">${getStatusText(inversorData?._Status)}</span></p>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    });
}

function getStatusText(status) {
    switch(status) {
        case 0: return 'Operando';
        case 1: return 'Atenção';
        case -1: return 'Offline';
        case 2: return 'Crítico';
        default: return 'Desconhecido';
    }
}

function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.remove();
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    // 1. Inicia o serviço de dados PRIMEIRO (ele já atualiza os inversores)
    DataService.iniciar();
    
    // 2. Configurações complementares (sem duplicar atualizações)
    configurarDropdown();
    configurarModalRelatorio();
    configurarGeradorRelatorio();
    
    // 3. Date Pickers (mantido igual)
    document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
        label.addEventListener('click', () => {
            document.getElementById(label.getAttribute('for')).showPicker();
        });
    });
});

window.addEventListener('beforeunload', () => DataService.parar());