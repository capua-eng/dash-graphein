// ========== VERIFICAÇÃO DE PÁGINA ATIVA ==========
const currentPage = window.location.pathname;

const isIndexPage = currentPage.includes("index.html") || currentPage === "/" || currentPage === "/index";
const isInversoresPage = currentPage.includes("inversores.html");


// ========== MÓDULO DE FUNÇÕES GERAIS (compartilhadas) ==========
const GeneralModule = {
    init: function() {
        this.setupDropdowns();
        this.setupModals();
        this.setupDatePickers();
    },

    setupDropdowns: function() {
        const dropdownBtn = document.getElementById('relatorioDropdown');
        const dropdown = dropdownBtn?.closest('.dropdown');

        if (dropdownBtn && dropdown) {
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
    },

    setupModals: function() {
        const modal = document.getElementById('modalRelatorio');
        const closeModal = document.querySelector('.modal .close');
        const relatorioLinks = document.querySelectorAll('.dropdown-content a');

        if (modal && closeModal) {
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
    },

    setupDatePickers: function() {
        document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
            label.addEventListener('click', () => {
                const input = document.getElementById(label.getAttribute('for'));
                input?.showPicker();
            });
        });
    },

    setupReportGeneration: function() {
        const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');

        if (gerarRelatorioBtn) {
            gerarRelatorioBtn.addEventListener('click', function() {
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
    }
};

// ========== MÓDULO DA TELA INICIAL ==========
const HomePageModule = {
    init: function() {
        if (!isIndexPage) return;
        
        this.setupHomeData();
    },

    setupHomeData: function () {
    let currentAlarms = [];
    const alarmsList = document.getElementById('alarmsList');
    const contextMenu = document.getElementById('contextMenu');
    const recognitionModal = document.getElementById('recognitionModal');
    const modalErrorDetails = document.getElementById('modalErrorDetails');
    let selectedAlarm = null;

    async function fetchAndUpdateAll() {
        try {
            const response = await fetch('http://192.168.0.252:8080/api/tela_inicial');
            if (!response.ok) {
                alert("Falha ao conectar à API.");
                throw new Error('Erro na API');
            }
            const data = await response.json();


            // === Atualizar inversores ===
            document.querySelectorAll('.inversor-item').forEach((item, index) => {
                const num = index + 1;
                const invKey = `Inversor${num}`;
                const inv = data[invKey];
                const arrow = item.querySelector('.arrow-icon');
                const label = item.querySelector('.inversor-label');
                const pac = item.querySelector('.value-pac');
                const pdc = item.querySelector('.value-pdc');
                const temp = item.querySelector('.temp-int');

                if (inv) {
                    const status = inv._Status ?? -1;
                    arrow.className = 'arrow-icon';
                    arrow.classList.add(`status-${status}`);
                    label.textContent = `Inversor ${num}`;
                    pac.textContent = `${inv[`INV${num}_PAC`]?.toFixed(1) ?? '0.00'}`;
                    pdc.textContent = `${inv[`INV${num}_PDC`]?.toFixed(1) ?? '0.00'}`;
                    temp.textContent = `${inv[`INV${num}_TI`]?.toFixed(1) ?? '0.0'}°C`;
                } else {
                    arrow.className = 'arrow-icon status--1';
                }
            });

            // === Atualizar meteorologia ===
            const met = data.central_meteorologica;
            if (met) {
                document.getElementById('velocidade-vento').textContent = `${met.VelocidadeVento.toFixed(1)} m/s`;
                document.getElementById('direcao-vento').textContent = `${met.DirecaoVento.toFixed(1)}°`;
                document.getElementById('irradiancia-inclinada').textContent = `${met.IrrSInclin.toFixed(1)} W/m²`;
                document.getElementById('irradiancia-horizontal').textContent = `${met.IrrSHoriz.toFixed(1)} W/m²`;
                document.getElementById('umidade-ar').textContent = `${met.UmidRelAr.toFixed(1)}%`;
                document.getElementById('temperatura-ambiente').textContent = `${met.TempAmb.toFixed(1)} °C`;
                document.getElementById('temperatura-placa').textContent = `${met.TempPlac.toFixed(1)} °C`;
            }

            // === Atualizar alarmes ===
            currentAlarms = (data.alarmes_erros || []).map((a, i) => ({
                id: i + 1,
                datetimeIn: new Date(a.DataErroIni).toLocaleString('pt-BR'),
                equipment: a.Equipamento,
                message: `${a.Equipamento}: ${a.Erro}`,
                isActive: a.DataErroFim === null,
                bits: a.BITS,
                originalData: a
            }));

            renderAlarms();

        } catch (err) {
            console.error('Erro ao buscar/atualizar dados:', err);
        }
    }

    function renderAlarms() {
        if (!alarmsList) return;
        alarmsList.innerHTML = '';
        currentAlarms.forEach(alarm => {
            if (!alarm.isActive && alarm.originalData.Reconhecimento === 'Reconhecido') return;
            // if (alarm.originalData.Status_ === 1) return;
            const el = document.createElement('div');
            el.className = `alarm-item ${alarm.isActive ? 'active' : 'resolved'}`;
            el.dataset.id = alarm.id;
            el.innerHTML = `
                <div class="message">${alarm.message}</div>
                <div class="datetime">${alarm.datetimeIn}</div>
            `;
            alarmsList.appendChild(el);
        });
    }

    function setupAlarmEvents() {
        alarmsList.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.alarm-item')) {
                e.preventDefault();
                selectedAlarm = e.target.closest('.alarm-item');
                showContextMenu(e.clientX, e.clientY);
            }
        });

        document.addEventListener('click', () => contextMenu.style.display = 'none');

        document.getElementById('recognizeThisError').addEventListener('click', recognizeSelected);
        document.getElementById('recognizeAllErrors').addEventListener('click', recognizeAll);
    }

    function showContextMenu(x, y) {
        const isActive = selectedAlarm.classList.contains('active');
        document.getElementById('recognizeThisError').disabled = isActive;
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    }

    async function recognizeSelected() {
        const id = parseInt(selectedAlarm.dataset.id);
        const alarm = currentAlarms.find(a => a.id === id);
        if(!alarm) return;
        if (alarm.originalData.Status_ === 1) {
          alert("Este alarme está ativo e não pode ser reconhecido.");
          contextMenu.style.display = "none";
          return;
        }
        if (alarm && await sendToAPI(alarm)) {
            alarm.originalData.Reconhecimento = 'Reconhecido';
            renderAlarms();
        }
        contextMenu.style.display = 'none';
    }

    async function recognizeAll() {
        const resolved = currentAlarms.filter(a => !a.isActive && !a.originalData.Reconhecimento && a.originalData.Status_ !== 1);
        for (const a of resolved) await sendToAPI(a);
        renderAlarms();
        contextMenu.style.display = 'none';
    }

    async function sendToAPI(alarm) {
        try {
            const payload = {
                BITS: Number(alarm.bits),
                Equipamento: alarm.equipment,
                DataErroIni: new Date(alarm.originalData.DataErroIni)
            };
            const resp = await fetch('http://192.168.0.252:8080/api/recAlarmes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return resp.ok;
        } catch (e) {
            console.error('Erro ao enviar reconhecimento:', e);
            return false;
        }
    }

    fetchAndUpdateAll();
    setupAlarmEvents();
    setInterval(fetchAndUpdateAll, 3000);
}


};

// ========== MÓDULO DA PÁGINA DE INVERSORES ==========
const InvertersPageModule = {
    init: function () {
        if (!isInversoresPage) return;
        this.DataService.iniciar();
        this.setupCardClickHandlers();
    },

    DataService: {
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

        parar: function () {
            clearInterval(this.intervalo);
        },

        notificarTodos: function () {
            this.callbacks.forEach(cb => cb(this.dados));
            this.atualizarCards();
            this.atualizarModalAberto();
        },

        atualizarCards: function () {
            if (!this.dados) return;

            for (let i = 1; i <= 18; i++) {
                const inversorKey = `Inversor${i}`;
                const dados = this.dados[inversorKey];
                if (!dados) continue;

                const campos = {
                    adc: dados.ADC,
                    udc: dados.UDC,
                    pdc: dados.PDC,
                    aac: dados.AAC,
                    uac: dados.UAC,
                    pac: dados.PAC,
                    gen_dia: dados.GEN_DIA,
                    status: dados.Status || "-"
                };

                for (const [sufixo, valor] of Object.entries(campos)) {
                    const span = document.getElementById(`inv${i}-${sufixo}`);
                    if (span) {
                        if (sufixo === 'status') {
                            span.textContent = valor;
                        } else {
                            const unidade = sufixo.includes('p') ? 'kW' :
                                            sufixo.includes('u') ? 'V' :
                                            sufixo.includes('a') ? 'A' : 'kWh';
                            span.textContent = `${valor?.toFixed(2) || '0.00'} ${unidade}`;
                        }
                    }
                }
            }
        },

        abrirModal: function (inversorNum) {
            if (!this.dados) return;

            const modalId = `modal-inversor-${inversorNum}`;
            let modalClone = document.getElementById(modalId);

            if (!modalClone) {
                const template = document.getElementById('modal-template');
                modalClone = template.cloneNode(true);
                modalClone.id = modalId;
                modalClone.style.display = 'block';

                const modalElement = modalClone.querySelector('.modal-overlay');
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
            }

            this.preencherDadosModal(inversorNum);
        },

        preencherDadosModal: function (inversorNum) {
            const modal = this.modalAberto;
            if (!modal || !this.dados) return;

            const inversorKey = `Inversor${inversorNum}`;
            const inversorData = this.dados[inversorKey];
            const modalElement = modal.querySelector('.modal-overlay');
            if (!inversorData) return;

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
            this.preencherDadosModal(inversorNum);
        }
    },

    setupCardClickHandlers: function () {
        document.querySelectorAll('[id^="card"]').forEach(card => {
            card.addEventListener('click', function () {
                const inversorNum = parseInt(this.id.replace('card', ''));
                if (!InvertersPageModule.DataService.dados) {
                    console.warn("Dados ainda não carregados.");
                    return;
                }
                InvertersPageModule.DataService.abrirModal(inversorNum);
            });
        });
    }
};



// ========== INICIALIZAÇÃO DOS MÓDULOS ==========
// document.addEventListener('DOMContentLoaded', function() {
//     GeneralModule.init();
//     HomePageModule.init();
//     InvertersPageModule.init();
// });
// ========== INICIALIZAÇÃO DOS MÓDULOS ==========
GeneralModule.init();
HomePageModule.init();
InvertersPageModule.init();
