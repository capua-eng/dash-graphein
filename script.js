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


const DataService = {
    dados: null,
    callbacks: [],
    intervalo: null,
    modalAberto: null, // Guarda referência do modal aberto


    atualizarDados: async function() {
        try {
            const response = await fetch('http://192.168.0.252:8080/api/inversores');
            if (!response.ok) throw new Error('Erro na API');
            this.dados = await response.json();
            this.notificarTodos();
            console.log('Dados atualizados:', this.dados);
        } catch (error) {
            console.error('Falha ao atualizar dados:', error);
        }
    },

    iniciar: function() {
        this.atualizarDados(); // Primeira carga
        this.intervalo = setInterval(() => this.atualizarDados(), 60000);
    },

    // ✅ 3. Método notificarTodos
    notificarTodos: function() {
        this.callbacks.forEach(cb => cb(this.dados));
    },
    parar: function() {
        clearInterval(this.intervalo);
    },

    // ✅ **NOVO: Abrir Modal do Inversor**
    abrirModal: function(inversorNum) {
        if (!this.dados) {
            console.error("Dados não carregados!");
            return;
        }
        
    
        // Fecha modal anterior
        this.fecharModal();
    
        // Obtém o template (ajustado para sua estrutura)
        const template = document.getElementById('modal-template');
        const modalClone = template.cloneNode(true);
        modalClone.id = `modal-inversor-${inversorNum}`;
        modalClone.style.display = 'block'; // Remove o display:none
    
        // Preenche os dados
        const inversorKey = `Inversor${inversorNum}`;
        const inversorData = this.dados[inversorKey];
        const modalElement = modalClone.querySelector('.modal-overlay');
        
        if (inversorData) {
            // Preenche os dados básicos
            modalElement.querySelector('.inversor-number').textContent = inversorNum;
            modalElement.querySelector('.timestamp').textContent = 
                `Última atualização: ${new Date().toLocaleTimeString()}`;
    
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
            // Adicione aqui outros campos que precisam ser preenchidos
            // Corrente Fase
            const correntePA = inversorData.Corrente_Fase?.PA?.toFixed(2) || '0.00';
            const correntePB = inversorData.Corrente_Fase?.PB?.toFixed(2) || '0.00';
            const correntePC = inversorData.Corrente_Fase?.PC?.toFixed(2) || '0.00';
            modalElement.querySelector('.corrente-pa').textContent = `${correntePA} A`;
            modalElement.querySelector('.corrente-pb').textContent = `${correntePB} A`;
            modalElement.querySelector('.corrente-pc').textContent = `${correntePC} A`;

            // PAC
            const pacValue = inversorData.PAC?.toFixed(2) || '0.00';
            modalElement.querySelector('.pac-value').textContent = `${pacValue} kW`;

            // Tensão Fase
            const tensaoPAB = inversorData.Tensao_Fase?.PAB?.toFixed(2) || '0.00';
            const tensaoPBC = inversorData.Tensao_Fase?.PBC?.toFixed(2) || '0.00';
            const tensaoPCA = inversorData.Tensao_Fase?.PCA?.toFixed(2) || '0.00';
            modalElement.querySelector('.tensao-pab').textContent = `${tensaoPAB} V`;
            modalElement.querySelector('.tensao-pbc').textContent = `${tensaoPBC} V`;
            modalElement.querySelector('.tensao-pca').textContent = `${tensaoPCA} V`;
        }
    
        // Configura eventos de fechar
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
        
        console.log(`Modal do inversor ${inversorNum} aberto!`); // Para debug
    },
    // ✅ **NOVO: Fechar Modal**
    fecharModal: function() {
        if (this.modalAberto) {
            this.modalAberto.remove();
            this.modalAberto = null;
        }
    },

    // ✅ **NOVO: Atualizar Modal Aberto (se houver)**
    atualizarModalAberto: function() {
        if (!this.modalAberto || !this.dados) return;

        const inversorNum = this.modalAberto.id.split('-')[2]; // Pega o número do modal (ex: "modal-inversor-1" → "1")
        this.abrirModal(inversorNum); // Reabre com dados atualizados
    },

    // ✅ **Modificar notificarTodos() para atualizar modais**
    notificarTodos: function() {
        this.callbacks.forEach(cb => cb(this.dados));
        this.atualizarModalAberto(); // Atualiza o modal se estiver aberto
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // 👇🏽 ADICIONE AQUI O SEU CÓDIGO DE CLIQUE NOS CARDS
    document.querySelectorAll('[id^="card"]').forEach(card => {
        card.addEventListener('click', function() {
            const inversorNum = parseInt(this.id.replace('card', ''));
            
            if (!DataService.dados) {
                console.warn("Dados ainda não carregados. Aguarde...");
                return;
            }
            
            DataService.abrirModal(inversorNum);
        });
    });
    
    // 3. SÓ DEPOIS INICIE O SERVICO
    DataService.iniciar(); 
});

console.log("DataService:", DataService);
console.log("Dados carregados:", DataService.dados);
console.log("Elementos .inversor-item:", document.querySelectorAll('.inversor-item').length);
console.log("Card encontrado:", card.id); // Verifica se está achando seus cards