// ========== VERIFICAÇÃO DE PÁGINA ATIVA ==========
const currentPage = window.location.pathname;

const isIndexPage = currentPage === "/";
const isInversoresPage = currentPage === "/inversores";
const isUnifilarPage = currentPage === "/unifilar";
const isArquiteturaPage = currentPage === "/arquitetura";


// ========== MÓDULO DE FUNÇÕES GERAIS (compartilhadas) ==========

// nomes para as urls de gerar relatório
const relatorioMap = {
    "Irradiação": "irradiancia",
    "IDGT": "idgti",
    "Energia": "energia"
};

const GeneralModule = {
    init: function () {
        this.setupDropdowns();
        this.setupModals();
        this.setupDatePickers();

        this.setupReportGeneration();
    },

    // RELATÓRIOS
    setupDropdowns: function () {
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
    },

    setupModals: function () {
        const modal = document.getElementById('modalRelatorio');
        const closeModal = document.querySelector('.modal .close');
        const relatorioLinks = document.querySelectorAll('.dropdown-content a');

        if (modal && closeModal) {
            relatorioLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    const nome = link.textContent.trim();
                    relatorioSelecionado = relatorioMap[nome]; // pega o tipo do relatório específico pelo nome do

                    if (!relatorioSelecionado) {
                        alert("Tipo de relatório não reconhecido: " + nome);
                        return;
                    }

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
    },

    setupDatePickers: function () {
        document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
            label.addEventListener('click', () => {
                const input = document.getElementById(label.getAttribute('for'));
                input?.showPicker();
            });
        });
    },

    setupReportGeneration: function () {
        const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');

        if (gerarRelatorioBtn) {
            gerarRelatorioBtn.addEventListener('click', function () {
                const spinner = document.getElementById('loadingSpinner');
                if (spinner) spinner.style.display = 'block';

                const startDate = document.getElementById('dataInicio').value;
                const endDate = document.getElementById('dataFim').value;
                const groupBy = document.getElementById('intervalo').value;

                if (!relatorioSelecionado) {
                    alert('Tipo de relatório não definido!');
                    if (spinner) spinner.style.display = 'none';
                    return;
                }

                const url = `http://100.68.206.104:1880/${relatorioSelecionado}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

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
                        a.download = `relatorio-${relatorioSelecionado}.pdf`;
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
    init: function () {
        if (!isIndexPage) return;

        this.setupHomeData();
    },

    setupHomeData: function () {
        let currentAlarms = [];
        const alarmsList = document.getElementById('alarmsList');
        const contextMenu = document.getElementById('contextMenu');
        let selectedAlarm = null;

        async function fetchAndUpdateAll() {
            try {
                const response = await fetch('/api/tela_inicial');
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
                        pac.textContent = `${inv[`INV${num}_PAC`]?.toFixed(1) ?? '0.00'} kW`;
                        pdc.textContent = `${inv[`INV${num}_PDC`]?.toFixed(1) ?? '0.00'} kW`;
                        temp.textContent = `${inv[`INV${num}_TI`]?.toFixed(1) ?? '0.0'}°C`;
                    } else {
                        arrow.className = 'arrow-icon status--1';
                    }
                });

                // === Atualizar valores pac e paac ===
                const pac = data.central_meteorologica?.pac_Instantanea;
                const paac = data.central_meteorologica?.paac_Instantanea;

                const pacDiv = document.querySelector('.pac-usina');
                if (pacDiv && pac !== undefined) {
                    pacDiv.textContent = `${pac.toFixed(1)} kW`;
                }

                const paacDiv = document.querySelector('.paac-usina');
                if (paacDiv && paac !== undefined) {
                    paacDiv.textContent = `${paac.toFixed(1)} kW`;
                }


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
                    document.getElementById('energia-diaria-usina').textContent = `${met.EnergiaDiariaUsina.toFixed(1)} kWh`;
                    document.getElementById('energia-mensal-usina').textContent = `${met.EnergiaMensalUsina.toFixed(1)} kWh`;
                    document.getElementById('energia-instantanea-usina').textContent = `${met.pac_Instantanea.toFixed(1)} kW`;
                    document.getElementById('energia-consumida').textContent = `${met.Consumida.toFixed(1)} kWh`;
                    document.getElementById('energia-fornecida').textContent = `${met.Fornecida.toFixed(1)} kWh`;

                }

                // === Atualizar alarmes ===
                currentAlarms = (data.alarmes_erros || []).map((a, i) => ({
                    id: i + 1,
                    id_alarm: a.ID,
                    datetimeIn: new Date(a.DataErroIni).toLocaleString('pt-BR'),
                    datetimeOut: a.DataErroFim ? new Date(a.DataErroFim).toLocaleString('pt-BR').replace('T', ' ').split('.')[0] : 'Ativo',
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
                <div class="datetime">${alarm.datetimeIn}</div>
                <div class="datetimeout">${alarm.isActive ? '' : alarm.datetimeOut}</div>
                <div class="tag"></div>
                <div class="message">${alarm.message}</div>
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
            const recognizeBtn = document.getElementById('recognizeThisError');

            recognizeBtn.disabled = isActive;
            contextMenu.style.display = 'block';

            // Ajustar posição para não sair da tela
            const menuWidth = contextMenu.offsetWidth;
            const menuHeight = contextMenu.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Se o menu sair à direita, ajusta para a esquerda
            const left = x + menuWidth > windowWidth ? windowWidth - menuWidth - 5 : x;
            // Se o menu sair embaixo, ajusta para cima
            const top = y + menuHeight > windowHeight ? windowHeight - menuHeight - 5 : y;

            contextMenu.style.left = `${left}px`;
            contextMenu.style.top = `${top}px`;
        }

        async function recognizeSelected() {
            const id = parseInt(selectedAlarm.dataset.id);
            const alarm = currentAlarms.find(a => a.id === id);
            if (!alarm) return;
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
            if (resolved.length === 0) {
                const temAtivos = currentAlarms.some(a => a.originalData.Status_ === 1 && !a.originalData.Reconhecimento);
                if (temAtivos) {
                    alert("Existem alarmes ativos que não podem ser reconhecidos.");
                } else {
                    alert("Todos os alarmes já foram reconhecidos ou não há larmes resolvidos.");
                }
                contextMenu.style.display = 'none';
                return;
            }
            try {
                for (const a of resolved) {
                    await sendToAPI(a);
                    a.originalData.Reconhecimento = 'Reconhecido';
                }
                renderAlarms();
                alert(`${resolved.length} alarmes reconhecidos com sucesso!`);
            } catch (error) {
                console.error("Erro ao reconhecer alarmes:", error);
                alert("Ocorreu um erro ao reconhecer os alarmes.")
            }
            // for (const a of resolved) await sendToAPI(a);
            renderAlarms();
            contextMenu.style.display = 'none';
        }

        async function sendToAPI(alarm) {
            try {
                const payload = {
                    ID: Number(alarm.id_alarm),
                    BITS: Number(alarm.bits),
                    Equipamento: alarm.equipment,
                    DataErroIni: new Date(alarm.originalData.DataErroIni)
                };
                console.log(`${alarm.id_alarm}, ${alarm.bits}, ${alarm.equipment}, ${alarm.originalData.DataErroIni}`)
                const resp = await fetch('/api/recAlarmes', {
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
        statusAnterior: {},

        atualizarDados: async function () {
            try {
                const response = await fetch('api/inversores');
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
                    gen_mes: dados.GEN_MES // <-- incluído aqui
                };

                for (const [sufixo, valor] of Object.entries(campos)) {
                    const span = document.getElementById(`inv${i}-${sufixo}`);
                    if (span) {
                        const unidade = sufixo.includes('p') ? 'kW' :
                            sufixo.includes('u') ? 'V' :
                                sufixo.includes('a') ? 'kWh' : 'kWh';
                        span.textContent = `${valor?.toFixed(2) || '0.00'} ${unidade}`;
                    }
                }

                const statusElement = document.getElementById(`inv${i}-status`);
                const statusAtual = dados.Status;

                if (statusElement && statusAtual !== undefined && this.statusAnterior[i] !== statusAtual) {
                    let statusTexto;
                    switch (statusAtual) {
                        case 0: statusTexto = "🟡 Espera"; break;
                        case 1: statusTexto = "🟢 Gerando"; break;
                        case 2: statusTexto = "🔴 Falha"; break;
                        case 3: statusTexto = "⚫ Falha Permanente"; break;
                        default: statusTexto = "Desconhecido";
                    }

                    statusElement.textContent = statusTexto;
                    statusElement.style.color =
                        statusAtual === 1 ? '#2ecc71' :
                            statusAtual === 0 ? '#f39c12' :
                                '#e74c3c';

                    this.statusAnterior[i] = statusAtual;
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

// ========== MÓDULO UNIFILAR ==========
const UnifilarPageModule = {
    init: function () {
        if (!isUnifilarPage) return;
        this.atualizarUnifilar();
        setInterval(() => this.atualizarUnifilar(), 3000);
        this.setupDisjuntorButtons();
    },

    setupDisjuntorButtons: function () {
        const btnAbrir = document.getElementById('btnAbrir');
        const btnFechar = document.getElementById('btnFechar');
        const btnRearme = document.getElementById('btnRearme');

        if (btnAbrir) btnAbrir.addEventListener('click', () => this.confirmarAcao('abre'));
        if (btnFechar) btnFechar.addEventListener('click', () => this.confirmarAcao('fecha'));
        if (btnRearme) btnRearme.addEventListener('click', () => this.confirmarAcao('rearme'))
    },

    confirmarAcao: function (acao) {
        // Traduções para exibição
        const traducoes = {
            'abre': { titulo: 'ABERTURA DO DISJUNTOR', mensagem: 'Isso desligará a energia!', cor: '#ff0000' },
            'fecha': { titulo: 'FECHAMENTO DO DISJUNTOR', mensagem: 'Isso ligará a energia!', cor: '#ff0000' },
            'rearme': { titulo: 'REARME DO DISJUNTOR', mensagem: 'Isso resetará o disjuntor!', cor: '#4444ff' }
        };

        // Cria o modal de confirmação
        const modalId = 'modalConfirmacaoDisjuntor';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;">
                    <div class="modal-content" style="background:white;padding:30px;border-radius:8px;max-width:400px;width:100%;">
                        <h3 style="color:${traducoes[acao].cor};margin-top:0;">CONFIRMAR ${traducoes[acao].titulo}</h3>
                        <p>${traducoes[acao].mensagem}</p>
                        <p>Tem certeza que deseja continuar?</p>
                        <div style="display:flex;justify-content:space-between;margin-top:20px;">
                            <button id="cancelarAcaoBtn" style="background:#ccc;color:#333;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">CANCELAR</button>
                            <button id="confirmarAcaoBtn" style="background:${traducoes[acao].cor};color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('h3').textContent = `CONFIRMAR ${traducoes[acao].titulo}`;
            modal.querySelector('h3').style.color = traducoes[acao].cor;
            modal.querySelector('p').textContent = traducoes[acao].mensagem;
            modal.querySelector('#confirmarAcaoBtn').style.background = traducoes[acao].cor;
        }

        // Mostra o modal
        modal.style.display = 'block';

        // Configura os eventos dos botões do modal
        document.getElementById('confirmarAcaoBtn').onclick = () => {
            this.executarAcaoDisjuntor(acao);
            modal.style.display = 'none';
        };

        document.getElementById('cancelarAcaoBtn').onclick = () => {
            modal.style.display = 'none';
        };
    },

    executarAcaoDisjuntor: function (acao) {
        // Desabilita os botões durante a operação
        const botoes = document.querySelectorAll('.btn-menu button');
        botoes.forEach(btn => btn.disabled = true);

        console.log(`[SIMULAÇÃO] Enviando comando: ${acao}`)

        // URL do seu endpoint Node-RED
        const endpoint = `http://192.168.0.252:1880/disjuntor/?acao=${acao}`;
        // const url = window.location.href = 'https://g1.globo.com/';
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000);

        // Envia a requisição
        fetch(endpoint, { signal: controller.signal })
        fetch(endpoint)
            .then(response => {
                if (!response.ok) throw new Error('Erro na resposta');
                return response.text();
            })
            .then(result => {
                alert(`Comando de ${acao} executado com sucesso! ${result}`);
            })
            .catch(e => {
                alert(e.name === 'Abort' ? `Falha ao executar ${acao}` : `Erro: ${e}`)
            })
            .finally(() => {
                // Reabilita os botões
                botoes.forEach(btn => btn.disabled = false);
            });
    },

    async atualizarUnifilar() {
        try {
            const response = await fetch("/api/unifilar");
            if (!response.ok) throw new Error("Erro na API /api/unifilar");

            const data = await response.json();

            // === Atualiza MGEs ===
            for (let i = 1; i <= 3; i++) {
                const mge = data.MGE[`MGE_${i}`];
                if (!mge) continue;

                const fases = mge.Tensoes.Entre_fases;
                const fasesInd = mge.Tensoes.De_fase;
                const pot = mge.Potencias;

                // dados dos cards MGE unifilar →
                document.getElementById(`mge${i}-fab-valor`).textContent = `${fases.FAB.toFixed(1)} kV`;
                document.getElementById(`mge${i}-fbc-valor`).textContent = `${fases.FBC.toFixed(1)} kV`;
                document.getElementById(`mge${i}-fca-valor`).textContent = `${fases.FCA.toFixed(1)} kV`;
                document.getElementById(`mge${i}-fa-valor`).textContent = `${fasesInd.FA.toFixed(1)} kV`;
                document.getElementById(`mge${i}-fb-valor`).textContent = `${fasesInd.FB.toFixed(1)} kV`;
                document.getElementById(`mge${i}-fc-valor`).textContent = `${fasesInd.FC.toFixed(1)} kV`;
                document.getElementById(`mge${i}-ativa-valor`).textContent = `${pot.Ativa.toFixed(1)} kW`;


                // document.getElementById(`mge${i}-fab`).textContent = `Tensão entre fases AB - ${fases.FAB.toFixed(1)} V`;
                // document.getElementById(`mge${i}-fbc`).textContent = `Tensão entre fases BC - ${fases.FBC.toFixed(1)} V`;
                // document.getElementById(`mge${i}-fca`).textContent = `Tensão entre fases CA - ${fases.FCA.toFixed(1)} V`;
                // document.getElementById(`mge${i}-fa`).textContent = `Tensão Fase-Neutro AN - ${fasesInd.FA.toFixed(1)} kV`;
                // document.getElementById(`mge${i}-fb`).textContent = `Tensão Fase-Neutro BN - ${fasesInd.FB.toFixed(1)} kV`;
                // document.getElementById(`mge${i}-fc`).textContent = `Tensão Fase-Neutro CN - ${fasesInd.FC.toFixed(1)} kV`;

                // document.getElementById(`mge${i}-ativa`).textContent = `Potência - ${pot.Ativa.toFixed(1)} kW`;
                // document.getElementById(`mge${i}-reativa`).textContent = `${pot.Reativa.toFixed(1)} kVAR`;
            }


            // === função auxiliar para formatar valores, caso fiquem vazios ===
            function formatarValor(valor, unidade) {
                return (valor != null && !isNaN(valor)) ? `${valor.toFixed(1)} ${unidade}` : "--";
            }

            // === Atualiza Inversores (MODAIS) ===
            const inversores = data?.Inversores ?? {};

            // atualiza Modal 1 (Inversores 1 a 9)
            const modal1Hotspots = document.querySelectorAll('#modal-unifilar-qgbt1 .hotspot');
            let index1 = 0;

            for (let i = 1; i <= 9; i++) {
                const inv = inversores[`Inversor${i}`];

                if (modal1Hotspots[index1]) modal1Hotspots[index1].textContent = formatarValor(inv?.Tensao, "V");
                if (modal1Hotspots[index1 + 1]) modal1Hotspots[index1 + 1].textContent = formatarValor(inv?.Corrente, "A");
                if (modal1Hotspots[index1 + 2]) modal1Hotspots[index1 + 2].textContent = formatarValor(inv?.Potencia, "kW");

                index1 += 3;
            }

            // atualiza Modal 2 (Inversores 10 a 12 por enquanto)
            const modal2Hotspots = document.querySelectorAll('#modal-unifilar-qgbt2 .hotspot');
            let index2 = 0;

            for (let i = 10; i <= 18; i++) {
                const inv = inversores[`Inversor${i}`];

                if (modal2Hotspots[index2]) modal2Hotspots[index2].textContent = formatarValor(inv?.Tensao, "V");
                if (modal2Hotspots[index2 + 1]) modal2Hotspots[index2 + 1].textContent = formatarValor(inv?.Corrente, "A");
                if (modal2Hotspots[index2 + 2]) modal2Hotspots[index2 + 2].textContent = formatarValor(inv?.Potencia, "kW");

                index2 += 3;
            }

            const tripsAtivos = data.trips_ativos || [];
            const tripElements = document.querySelectorAll('.bolinhas p');

            // Mapeamento de números para identificadores no HTML
            const tripTextMap = {
                133: 'GS',
                157: 'Q',
                100: 'Falha Bobina'
                // Adicione outros mapeamentos especiais aqui se necessário
            };

            // Reset all indicators
            tripElements.forEach(el => {
                el.innerHTML = '⚪ ' + el.textContent.split(' ')[1];
            });

            // Update active trips
            tripsAtivos.forEach(trip => {
                tripElements.forEach(el => {
                    const tripText = el.textContent.split(' ')[1]; // Pega o número/texto após o emoji
                    const tripValue = el.getAttribute('data-trip');

                    // Verifica se é um trip especial (GS/Q) ou numérico
                    if ((trip in tripTextMap && tripTextMap[trip] === tripValue) ||
                        (trip.toString() === tripValue)) {
                        el.innerHTML = '🔴 ' + tripText;
                    }
                });
            });

            // data/hora da última atualização dos dados
            const lastRefreshGlobal = data?.last_refresh_time;
            if (lastRefreshGlobal) {
                const formattedDate = new Date(lastRefreshGlobal).toLocaleString();
                document.querySelectorAll(".last-refresh").forEach(el => {
                    el.textContent = `Última atualização: ${formattedDate}`;
                });
            }

        } catch (error) {
            console.error("Erro ao atualizar unifilar:", error);
        }
    }
};

// ========== MÓDULO DA PÁGINA DE ARQUITETURA ==========
const ArquiteturaPageModule = {
    init: function () {
        if (!isArquiteturaPage) return;
        this.setupTopologyData();
    },

    setupTopologyData: function () {
        async function fetchAndUpdateTopology() {
            try {
                const response = await fetch('/api/arquitetura');
                if (!response.ok) throw new Error('Erro na API');

                const { status_diag } = await response.json();

                // atualiza comunicação DIAG
                if (status_diag) {
                    Object.entries(status_diag).forEach(([bit, status]) => {
                        const element = document.querySelector(`[data-bit="${bit}"]`);
                        if (element) {
                            element.textContent = status === 1 ? "🔴" : "🟢";
                            element.classList.toggle('status-falha', status === 1);
                        }
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar topologia:', error);
            }
        }

        // inicializa a atualização
        fetchAndUpdateTopology();
        setInterval(fetchAndUpdateTopology, 3000);  // atualiza a cada 3 segundos
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
UnifilarPageModule.init();
ArquiteturaPageModule.init();