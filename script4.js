// ========== DATE PICKERS ==========
document.querySelectorAll('label[for="dataInicio"], label[for="dataFim"]').forEach(label => {
    label.addEventListener('click', () => {
        const input = document.getElementById(label.getAttribute('for'));
        input?.showPicker();
    });
});

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
atualizarMeteorologia();
setInterval(atualizarInversores, 3000);

// Inicia o sistema quando o script carrega
initAlarmSystem();