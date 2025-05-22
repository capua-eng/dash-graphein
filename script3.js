// ========== CONTROLE DO DROPDOWN ==========
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
// ========== MODAL DE RELATÓRIO ==========
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


    atualizarDados: async function() {
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

    iniciar: function() {
        this.atualizarDados();
        this.intervalo = setInterval(() => this.atualizarDados(), 3000);
    },

    notificarTodos: function() {
        this.callbacks.forEach(cb => cb(this.dados));
        this.atualizarModalAberto();
    },

    parar: function() {
        clearInterval(this.intervalo);
    },

    abrirModal: function(inversorNum) {
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

    fecharModal: function() {
        if (this.modalAberto) {
            this.modalAberto.remove();
            this.modalAberto = null;
        }
    },

    atualizarModalAberto: function() {
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

// --------------------------------------------------------------------------------DADOS INVERSORES

// ========== INICIALIZAÇÃO DOS CARDS ==========
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
  
  // Inicia serviços
  DataService.iniciar();
  atualizarInversores();
  atualizarMeteorologia();
  setInterval(atualizarInversores, 100);
  setInterval(atualizarMeteorologia, 3000);


// =-=-=-=-=-=-==-=-=-=-=-=-=-==-=-=-=-=-=-==-=-=-=-=-==-=-=-=-=-=-=