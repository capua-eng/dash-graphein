// ========== CONTROLE DO DROPDOWN ==========
const dropdownBtn = document.getElementById('relatorioDropdown');
const dropdown = dropdownBtn?.closest('.dropdown');

if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', function () {
        dropdown.classList.remove('active');
    });

    dropdown.querySelector('.dropdown-content')?.addEventListener('click', function (e) {
        e.stopPropagation();
    });
}
// ========== MODAL DE RELATÓRIO ==========
const modal = document.getElementById('modalRelatorio');
const closeModal = document.querySelector('.modal .close');
const relatorioLinks = document.querySelectorAll('.dropdown-content a');

if (modal && closeModal) {
    relatorioLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
    });

    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (e) {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
}

// ========== DATE PICKERS ==========
document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
    label.addEventListener('click', () => {
        const input = document.getElementById(label.getAttribute('for'));
        input?.showPicker();
    });
});

// ========== GERAR RELATÓRIO ==========
const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');

if (gerarRelatorioBtn) {
    gerarRelatorioBtn.addEventListener('click', function () {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';

        const startDate = document.getElementById('dataInicio').value;
        const endDate = document.getElementById('dataFim').value;
        const groupBy = document.getElementById('intervalo').value;

        const url = `http://192.168.0.252:1880/gerar-relatorio?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

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

// ========== STATUS DOS INVERSORES ==========
async function atualizarInversores() {
    try {
        // 1. Busca dados da API
        const response = await fetch('http://192.168.0.252:8080/api/tela_inicial');
        if (!response.ok) throw new Error('Erro na API');
        const data = await response.json();

        // 2. Atualiza cada inversor
        document.querySelectorAll('.inversor-item').forEach((item, index) => {
            const inversorNum = index + 1;
            const inversorKey = `Inversor${inversorNum}`;
            const inversorData = data[inversorKey];

            // Elementos HTML
            const arrowIcon = item.querySelector('.arrow-icon');
            const label = item.querySelector('.inversor-label');
            const pacValue = item.querySelector('.value-pac');
            const pdcValue = item.querySelector('.value-pdc');
            const tempValue = item.querySelector('.temp-int');

            // Atualiza os valores
            if (inversorData) {
                // Status (cor do ícone)
                const status = inversorData._Status ?? -1;
                // const status = `status-${status}`;
                arrowIcon.className = 'arrow-icon';
                arrowIcon.classList.add(`status-${status}`);
                // arrowIcon.classList.add({status})

                // Valores - Verifique no console os nomes exatos das propriedades
                label.textContent = `Inversor ${inversorNum}`;

                // Adapte estas linhas conforme os nomes no seu JSON:
                pacValue.textContent = `${inversorData.PAC?.toFixed(1) ?? inversorData.InvPAC?.toFixed(1) ?? inversorData[`INV${inversorNum}_PAC`]?.toFixed(1) ?? '0.00'}`;
                pdcValue.textContent = `${inversorData.PDC?.toFixed(1) ?? inversorData.InvPDC?.toFixed(1) ?? inversorData[`INV${inversorNum}_PDC`]?.toFixed(1) ?? '0.00'}`;
                tempValue.textContent = `${inversorData.TI?.toFixed(1) ?? inversorData.InvTI?.toFixed(1) ?? inversorData[`INV${inversorNum}_TI`]?.toFixed(1) ?? '0.0'}°C`;
            } else {
                // Fallback para dados ausentes
                arrowIcon.className = 'arrow-icon status--1';
                //   pacValue.textContent = 'N/A';
                //   pdcValue.textContent = 'N/A';
                //   tempValue.textContent = 'N/A°C';
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar inversores:', error);
        // Fallback visual para erro
        document.querySelectorAll('.arrow-icon').forEach(icon => {
            icon.className = 'arrow-icon status--1';
            document.querySelectorAll('.value-temp').forEach(temp => {
                temp.textContent = 'N/A°C';
            });
        });
    }
}

// ========== DATA SERVICE (MODAIS DOS INVERSORES) ==========
const DataService = {
    dados: null,
    callbacks: [],
    intervalo: null,
    modalAberto: null,
    ultimaAtualizacao: null,


    atualizarDados: async function () {
        try {
            const response = await fetch('http://192.168.0.252:8080/api/inversores');
            if (!response.ok) throw new Error('Erro na API');
            this.dados = await response.json();
            this.ultimaAtualizacao = new Date();
            this.notificarTodos();
        } catch (error) {
            console.error('Falha ao atualizar dados:', error);
        }
    },

    iniciar: function () {
        this.atualizarDados();
        this.intervalo = setInterval(() => this.atualizarDados(), 3000);
    },

    notificarTodos: function () {
        this.callbacks.forEach(cb => cb(this.dados));
        this.atualizarModalAberto();
    },

    parar: function () {
        clearInterval(this.intervalo);
    },

    abrirModal: function (inversorNum) {
        if (!this.dados) {
            console.error("Dados não carregados!");
            return;
        }

        this.fecharModal();

        const template = document.getElementById('modal-template');
        const modalClone = template.cloneNode(true);
        modalClone.id = `modal-inversor-${inversorNum}`;
        modalClone.style.display = 'block';

        const inversorKey = `Inversor${inversorNum}`;
        const inversorData = this.dados[inversorKey];
        const modalElement = modalClone.querySelector('.modal-overlay');

        if (inversorData) {
            modalElement.querySelector('.inversor-number').textContent = inversorNum;
            if (this.ultimaAtualizacao) {
                modalElement.querySelector('.timestamp').textContent =
                    `Atualizado em: ${this.ultimaAtualizacao.toLocaleTimeString()}`;
            }
            const mppts = inversorData.MPPTS;
            if (mppts) {
                for (let i = 1; i <= 12; i++) {
                    const mpptKey = `MPPT${i}`;
                    const mpptData = mppts[mpptKey];
                    const mpptDiv = modalElement.querySelector(`.mppts[data-mppt="${i}"]`);
                    if (mpptDiv && mpptData) {
                        const vSpan = mpptDiv.querySelector('.value-v');
                        const aSpan = mpptDiv.querySelector('.value-a');
                        if (vSpan) vSpan.textContent = `${mpptData.V.toFixed(2)} V`;
                        if (aSpan) aSpan.textContent = `${mpptData.A.toFixed(2)} A`;
                    }
                }
            }

            modalElement.querySelector('.corrente-pa').textContent = `${inversorData.Corrente_Fase?.PA?.toFixed(2) || '0.00'} A`;
            modalElement.querySelector('.corrente-pb').textContent = `${inversorData.Corrente_Fase?.PB?.toFixed(2) || '0.00'} A`;
            modalElement.querySelector('.corrente-pc').textContent = `${inversorData.Corrente_Fase?.PC?.toFixed(2) || '0.00'} A`;
            modalElement.querySelector('.pac-value').textContent = `${inversorData.PAC?.toFixed(2) || '0.00'} kW`;
            modalElement.querySelector('.tensao-pab').textContent = `${inversorData.Tensao_Fase?.PAB?.toFixed(2) || '0.00'} V`;
            modalElement.querySelector('.tensao-pbc').textContent = `${inversorData.Tensao_Fase?.PBC?.toFixed(2) || '0.00'} V`;
            modalElement.querySelector('.tensao-pca').textContent = `${inversorData.Tensao_Fase?.PCA?.toFixed(2) || '0.00'} V`;
        }

        modalElement.querySelector('.close-modal').addEventListener('click', () => {
            this.fecharModal();
        });

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                this.fecharModal();
            }
        });

        document.body.appendChild(modalClone);
        this.modalAberto = modalClone;
    },

    fecharModal: function () {
        if (this.modalAberto) {
            this.modalAberto.remove();
            this.modalAberto = null;
        }
    },

    atualizarModalAberto: function () {
        if (!this.modalAberto || !this.dados) return;
        const inversorNum = this.modalAberto.id.split('-')[2];
        this.abrirModal(inversorNum);
    }
};

async function atualizarMeteorologia() {
    try {
        const response = await fetch('http://192.168.0.252:8080/api/tela_inicial'); // Coloque o mesmo endpoint que retorna o JSON
        if (!response.ok) throw new Error('Erro ao buscar dados meteorológicos');
        const data = await response.json();

        const meteorologia = data.central_meteorologica;

        if (meteorologia) {
            document.getElementById('velocidade-vento').textContent = `${meteorologia.VelocidadeVento.toFixed(1)} m/s`;
            document.getElementById('direcao-vento').textContent = `${meteorologia.DirecaoVento.toFixed(1)}°`;
            document.getElementById('irradiancia-inclinada').textContent = `${meteorologia.IrrSInclin.toFixed(1)} W/m²`;
            document.getElementById('irradiancia-horizontal').textContent = `${meteorologia.IrrSHoriz.toFixed(1)} W/m²`;
            document.getElementById('umidade-ar').textContent = `${meteorologia.UmidRelAr.toFixed(1)}%`;
            document.getElementById('temperatura-ambiente').textContent = `${meteorologia.TempAmb.toFixed(1)} °C`;
            document.getElementById('temperatura-placa').textContent = `${meteorologia.TempPlac.toFixed(1)} °C`;
        } else {
            console.warn('Dados da central meteorológica ausentes.');
        }
    } catch (error) {
        console.error('Erro ao atualizar dados meteorológicos:', error);
    }
}


// DADOS INVERSORES ----------------------------------------------------------------------------
// ========== INICIALIZAÇÃO DOS CARDS ==========
document.querySelectorAll('[id^="card"]').forEach(card => {
    card.addEventListener('click', function () {
        const inversorNum = parseInt(this.id.replace('card', ''));
        if (!DataService.dados) {
            console.warn("Dados ainda não carregados. Aguarde...");
            return;
        }
        DataService.abrirModal(inversorNum);
    });
});

// Inicia serviços
DataService.iniciar();
atualizarInversores();
atualizarMeteorologia();
setInterval(atualizarInversores, 3000);
setInterval(atualizarMeteorologia, 3000);



// // # ALARMES-------------------------------------------------------------------------
const alarmsList = document.getElementById('alarmsList');
const contextMenu = document.getElementById('contextMenu');
const recognitialModal = document.getElementById('recognitionModal');
let currentAlarms = [];
let selectedAlarm = null;

function initAlarmSystem() {
    fetchAlarmsData();
    setupEventListeners();
}

async function fetchAlarmsData() {
    try {
        const response = await fetch('http://192.168.0.252:8080/api/tela_inicial');
        if (!response.ok) throw new Error('Erro na resposta da API');
        
        const data = await response.json();
        processAlarmData(data.alarmes_erros);
        renderAlarms();
        
        // Atualiza a cada 30 segundos
        setTimeout(fetchAlarmsData, 30000);
    } catch (error) {
        console.error('Falha ao buscar alarmes:', error);
        setTimeout(fetchAlarmsData, 5000); // Tenta novamente após 5s
    }
}

function processAlarmData(rawAlarms) {
    currentAlarms = rawAlarms.map((alarme, index) => ({
        id: index + 1,
        datetimeIn: formatDateTime(alarme.DataErroIni),
        equipment: alarme.Equipamento,
        message: `${alarme.Equipamento}: ${alarme.Erro}`,
        isActive: alarme.DataErroFim === null,
        bits: alarme.BITS,
        originalData: alarme
    }));
}

function formatDateTime(dateString) {
    return dateString ? new Date(dateString).toLocaleString('pt-BR') : '';
}

function renderAlarms() {
    alarmsList.innerHTML = '';
    
    currentAlarms.forEach(alarm => {
        if (!alarm.isActive && alarm.originalData.Reconhecimento === 'Reconhecido') return;
        
        const alarmElement = document.createElement('div');
        alarmElement.className = `alarm-item ${alarm.isActive ? 'active' : 'resolved'}`;
        alarmElement.dataset.id = alarm.id;
        alarmElement.innerHTML = `
            <div class="message">${alarm.message}</div>
            <div class="datetime">${alarm.datetimeIn}</div>
        `;
        
        alarmsList.appendChild(alarmElement);
    });
}
function setupEventListeners() {
    // Clique direito para menu de contexto
    alarmsList.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.alarm-item')) {
            e.preventDefault();
            selectedAlarm = e.target.closest('.alarm-item');
            showContextMenu(e.clientX, e.clientY);
        }
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', () => contextMenu.style.display = 'none');
    
    // Botões do menu de contexto
    document.getElementById('recognizeThisError').addEventListener('click', recognizeSelectedAlarm);
    document.getElementById('recognizeAllErrors').addEventListener('click', recognizeAllResolvedAlarms);
}

function showContextMenu(x, y) {
    const isActive = selectedAlarm.classList.contains('active');
    document.getElementById('recognizeThisError').disabled = isActive;
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
}
async function recognizeSelectedAlarm() {
    const alarmId = parseInt(selectedAlarm.dataset.id);
    const alarm = currentAlarms.find(a => a.id === alarmId);
    
    if (alarm && await sendRecognitionToAPI(alarm)) {
        alarm.originalData.Reconhecimento = 'Reconhecido';
        renderAlarms();
    }
    
    closeAllMenus();
}

async function recognizeAllResolvedAlarms() {
    const resolvedAlarms = currentAlarms.filter(a => !a.isActive && !a.originalData.Reconhecimento);
    
    for (const alarm of resolvedAlarms) {
        await sendRecognitionToAPI(alarm);
        alarm.originalData.Reconhecimento = 'Reconhecido';
    }
    
    renderAlarms();
    closeAllMenus();
}

async function sendRecognitionToAPI(alarm) {
    try {
        // Verifica se os dados necessários existem
        if (!alarm.bits || !alarm.equipment || !alarm.originalData.DataErroIni) {
            console.error('Dados incompletos no alarme:', alarm);
            return false;
        }

        // Formata o payload exatamente como a API espera
        const payload = {
            BITS: Number(alarm.bits),  // Campo em maiúsculo
            Equipamento: alarm.equipment,  // Campo com E maiúsculo
            DataErroIni: new Date(alarm.originalData.DataErroIni)  // Converte para objeto Date
        };

        console.log('Payload sendo enviado:', JSON.stringify(payload, null, 2));

        const response = await fetch('http://192.168.0.252:8080/api/recAlarmes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Resposta da API:', {
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Detalhes do erro:', errorDetails);
            throw new Error(`Erro ${response.status}: ${JSON.stringify(errorDetails)}`);
        }

        return true;
    } catch (error) {
        console.error('Erro ao reconhecer alarme:', error);
        return false;
    }
}

function closeAllMenus() {
    contextMenu.style.display = 'none';
    recognitionModal.style.display = 'none';
}
function showAlarmDetails(alarmId) {
    const alarm = currentAlarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    document.getElementById('modalErrorDetails').innerHTML = `
        <h3>Detalhes do Alarme</h3>
        <p><strong>Equipamento:</strong> ${alarm.equipment}</p>
        <p><strong>Início:</strong> ${alarm.datetimeIn}</p>
        <p><strong>Mensagem:</strong> ${alarm.message}</p>
        <p><strong>Status:</strong> ${alarm.isActive ? 'Ativo' : 'Resolvido'}</p>
    `;
    
    recognitionModal.style.display = 'flex';
}
// Inicia o sistema quando o script carrega
initAlarmSystem();


// Adicione este evento no setupEventListeners():
// document.querySelector('.close-modal').addEventListener('click', closeAllMenus);
// CÒDIGO ANTIGOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
// document.addEventListener('DOMContentLoaded', function () {
//     // Variáveis globais
//     const contextMenu = document.getElementById('contextMenu');
//     const recognitionModal = document.getElementById('recognitionModal');
//     const modalErrorDetails = document.getElementById('modalErrorDetails');
//     const alarmsList = document.getElementById('alarmsList');
//     let selectedAlarm = null;
//     let currentAlarms = [];

//     // função para BUSCAR dados da API
//     async function fetchAlarmsData() {
//         try {
//             const response = await fetch('http://192.168.0.252:8080/api/tela_inicial');
//             if (!response.ok) {
//                 throw new Error('Erro ao buscar dados da API');
//             }
//             const data = await response.json();

//             // transforma os dados da API no formato que precisamos
//             const formattedAlarms = data.alarmes_erros.map((alarme, index) => ({
//                 id: index + 1,
//                 datetimeIn: formatDateTime(alarme.DataErroIni),
//                 datetimeOut: alarme.DataErroFim ? formatDateTime(alarme.DataErroFim) : '',
//                 operator: alarme.Operador || '',
//                 tag: `TAG-${index.toString().padStart(3, '0')}`,
//                 message: `${alarme.Equipamento}: ${alarme.Erro}`,
//                 equipment: alarme.Equipamento,
//                 originalData: alarme,
//                 isActive: alarme.DataErroFim === null,
//                 bits: alarme.BITS
//             }));

//             currentAlarms = formattedAlarms;
//             renderAlarms();

//             // atualiza a cada 30 segundos
//             setTimeout(fetchAlarmsData, 30000);

//         } catch (error) {
//             console.error('Erro ao buscar alarmes:', error);
//             showToast('Erro ao carregar alarmes. Tentando novamente...', 'error');
//             setTimeout(fetchAlarmsData, 5000);
//         }
//     }

//     // Função auxiliar para formatar data/hora
//     function formatDateTime(dateTimeString) {
//         if (!dateTimeString) return '';
//         const date = new Date(dateTimeString);
//         return date.toLocaleString('pt-BR');
//     }

//     // renderiza os alarmes
//     function renderAlarms() {
//         alarmsList.innerHTML = '';

//         currentAlarms.forEach(alarm => {
//             const isActive = alarm.originalData.DataErroFim === null;

//             if (!isActive && alarm.originalData.Reconhecimento === 'Reconhecido') return;

//             const alarmElement = document.createElement('div');
//             alarmElement.className = `alarm-item ${isActive ? 'active' : 'resolved'}`;
//             alarmElement.dataset.id = alarm.id;

//             alarmElement.innerHTML = `
//                 <div class="datetime_in" style="width:15%">
//                     <p>${alarm.datetimeIn}</p>
//                 </div>
//                 <div class="datetime_out" style="width:15%">
//                     <p>${alarm.datetimeOut || '--'}</p>
//                 </div>
//                 <div class="operator" style="width:12%">
//                     <p>${alarm.operator}</p>
//                 </div>
//                 <div class="tag" style="width:15%">
//                     <p>${alarm.tag}</p>
//                 </div>
//                 <div class="message" style="width:33%">
//                     <p>${alarm.message}</p>
//                 </div>
//             `;

//             alarmsList.appendChild(alarmElement);
//         });

//         // Adiciona eventos de clique direito
//         document.querySelectorAll('.alarm-item').forEach(item => {
//             item.addEventListener('contextmenu', function (e) {
//                 e.preventDefault();
//                 selectedAlarm = this;
//                 const isActive = this.classList.contains('active');

//                 document.getElementById('recognizeThisError').disabled = isActive;
//                 document.getElementById('recognizeAllErrors').disabled = isActive;
//                 // Posiciona o menu
//                 const x = Math.min(e.pageX, window.innerWidth - 230);
//                 const y = Math.min(e.pageY, window.innerHeight - 150);

//                 contextMenu.style.display = 'block';
//                 contextMenu.style.left = `${x}px`;
//                 contextMenu.style.top = `${y}px`;
//             });
//         });
//     }

//     // Mostra detalhes do alarme no modal
//     window.showAlarmDetails = function (alarmId) {
//         const alarm = currentAlarms.find(a => a.id === alarmId);
//         if (!alarm) return;

//         modalErrorDetails.innerHTML = `
//             <div class="error-detail">
//                 <label>Data/Hora de Entrada</label>
//                 <span>${alarm.datetimeIn}</span>
//             </div>
//             <div class="error-detail">
//                 <label>Data/Hora de Saída</label>
//                 <span>${alarm.datetimeOut || '--'}</span>
//             </div>
//             <div class="error-detail">
//                 <label>Operador</label>
//                 <span>${alarm.operator}</span>
//             </div>
//             <div class="error-detail">
//                 <label>Tag</label>
//                 <span>${alarm.tag}</span>
//             </div>
//             <div class="error-detail">
//                 <label>Equipamento</label>
//                 <span>${alarm.equipment}</span>
//             </div>
//             <div class="error-detail">
//                 <label>Mensagem</label>
//                 <span>${alarm.message}</span>
//             </div>
//             <div class="error-detail">
//                 <label>Status</label>
//                 <span>${alarm.isActive ? 'Ativo' : 'Resolvido'}</span>
//             </div>
//         `;

//         recognitionModal.style.display = 'flex';
//     };
    // =-=-=-=-=-=-==-=-=-=-=-=-=-==-=-=-=-=-=-==-=-=-=-=-==-=-=-=-=-=-=

//     // Função para enviar reconhecimento para a API
//     async function sendRecognitionToAPI(alarmData, isRecognizeAll = false) {
//         try {
//             // Preparar os dados para a API
//             const payload = {
//                 bits: alarmData.bits,
//                 equipamento: alarmData.equipment,
//                 data_erro_ini: alarmData.originalData.DataErroIni
//             };

//             console.log('[DEBUG] Preparando payload:', payload);

//             // endpoint API Python
//             const apiUrl = 'http://192.168.0.252:8080/api/recAlarmes';
//             console.log('[DEBUG] Enviando para:', apiUrl);

//             const response = await fetch(apiUrl, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(payload)
//             });

//             console.log('[DEBUG] Status da resposta:', response.status);

//             if (!response.ok) {
//                 const errorText = await response.text();
//                 throw new Error(`HTTP ${response.status}: ${errorText}`);
//             }

//             const result = await response.json();
//             console.log('[DEBUG] Resposta completa:', result);
//             console.log('Reconhecimento enviado com sucesso:', result);

//             if (!isRecognizeAll) {
//                 showToast('Erro reconhecido com sucesso!', 'success');
//             }

//             return true;
//         } catch (error) {
//             console.error('Erro ao enviar reconhecimento:', error);
//             showToast('Erro ao reconhecer o erro. Tente novamente.', 'error');
//             return false;
//         }
//     }

//     // Função para reconhecer um erro específico
//     window.recognizeThisError = async function () {
//         console.log('[DEBUG] Iniciando reconhecimento de todos');
//         console.log('Alarme selecionado:', selectedAlarm);

//         const resolvedErrors = currentAlarms.filter(alarm =>
//             !alarm.isActive && alarm.originalData.Reconhecimento !== 'Reconhecido'
//         );

//         console.log('[DEBUG] Erros a reconhecer:', resolvedErrors.length, resolvedErrors);

//         if (!selectedAlarm) {
//             showToast('Nenhum alarme selecionado!', 'error');
//             return;
//         }

//         const alarmId = parseInt(selectedAlarm.dataset.id);
//         const alarm = currentAlarms.find(a => a.id === alarmId);

//         if (!alarm) return;

//         // Envia para a API
//         const success = await sendRecognitionToAPI(alarm);

//         if (success) {
//             // Atualiza localmente (opcional)
//             alarm.originalData.Reconhecimento = 'Reconhecido';
//             alarm.originalData.DataErroFim = new Date().toISOString();
//             renderAlarms();
//         }

//         contextMenu.style.display = 'none';
//         recognitionModal.style.display = 'none';
//     };

//     // Função para reconhecer todos os erros resolvidos
//     window.recognizeAllErrors = async function () {
//         // Filtra apenas os erros resolvidos não reconhecidos
//         const resolvedErrors = currentAlarms.filter(alarm =>
//             !alarm.isActive && alarm.originalData.Reconhecimento !== 'Reconhecido'
//         );

//         if (resolvedErrors.length === 0) {
//             console.log('[DEBUG] Nada para reconhecer');
//             showToast('Nenhum erro resolvido para reconhecer.', 'info');
//             contextMenu.style.display = 'none';
//             return;
//         }

//         // Envia cada erro para a API
//         let successCount = 0;
//         for (const [index, alarm] of resolvedErrors.entries()) {
//             console.log(`[DEBUG] Processando erro ${index + 1}/${resolvedErrors.length}`, alarm);
//             try {
//                 const success = await sendRecognitionToAPI(alarm, true);
//                 if (success) {
//                     successCount++;
//                     alarm.originalData.Reconhecimento = 'Reconhecido';
//                     console.log('[DEBUG] Erro marcado como reconhecido');
//                 }
//             } catch (e) {
//                 console.error(`[DEBUG] Erro no item ${index}:`, e);
//             }
//         }

//         console.log('[DEBUG] Total reconhecido com sucesso:', successCount);
//         if (successCount > 0) {
//             showToast(`${successCount} erro(s) reconhecido(s)!`, 'success');
//             renderAlarms();
//         } else {
//             showToast('Nenhum erro foi reconhecido.', 'error');
//         }
//         contextMenu.style.display = 'none';
//     };



//     // Fecha o menu de contexto ao clicar fora
//     document.addEventListener('click', function (e) {
//         if (e.target.closest('.context-menu') === null) {
//             contextMenu.style.display = 'none';
//         }
//     });

//     // Fecha o modal
//     document.querySelector('.close').addEventListener('click', function () {
//         recognitionModal.style.display = 'none';
//     });
//     document.getElementById('cancelRecognition').addEventListener('click', function () {
//         recognitionModal.style.display = 'none';
//     });

    // Inicia o carregamento dos dados
//     fetchAlarmsData();
// });
// =-=-=-=-=-=-==-=-=-=-=-=-=-==-=-=-=-=-=-==-=-=-=-=-==-=-=-=-=-=-=