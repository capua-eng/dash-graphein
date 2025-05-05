// JavaScript para controle do dropdown por clique
document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.getElementById('relatorioDropdown');
    const dropdown = dropdownBtn.closest('.dropdown');
    
    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
    
    // Fechar o dropdown ao clicar em qualquer lugar fora dele
    document.addEventListener('click', function() {
      dropdown.classList.remove('active');
    });
    
    // Prevenir que o dropdown feche ao clicar dentro dele
    dropdown.querySelector('.dropdown-content').addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // Modal
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('modalRelatorio');
  const closeModal = document.querySelector('.modal .close');

  // Pegando todos os links do dropdown de relatórios
  const relatorioLinks = document.querySelectorAll('.dropdown-content a');

  relatorioLinks.forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault(); // Evita o comportamento padrão do link
          modal.style.display = 'block'; // Mostra o modal
      });
  });

  // Fechar o modal quando clicar no botão de fechar (X)
  closeModal.addEventListener('click', function() {
      modal.style.display = 'none';
  });

  // Fechar o modal se clicar fora do conteúdo do modal
  window.addEventListener('click', function(e) {
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
      const url = `http://100.103.146.42:1880/admin/gerar-relatorio?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

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


// // mudando cor icon pelo status fake
// document.addEventListener('DOMContentLoaded', function() {
//   const statusInversores = [ 1];

//   const arrowIcons = document.querySelectorAll('.arrow-icon');

//   arrowIcons.forEach((icon, index) => {
//       const status = statusInversores[index];
//       icon.classList.remove('status-1', 'status--1', 'status-0', 'status-2');
      
//       switch(status) {
//           case 1: icon.classList.add('status-1'); break;
//           case -1: icon.classList.add('status--1'); break;
//           case 0: icon.classList.add('status-0'); break;
//           case 2: icon.classList.add('status-2'); break;
//           default: icon.style.backgroundColor = '#000';
//       }
      
//       // Atualiza o label com o número do inversor
//       const label = icon.closest('.inversor-item').querySelector('.inversor-label');
//       label.textContent = `Inversor ${index + 1}`;
//   });
// });

document.addEventListener('DOMContentLoaded', async function() {
  const arrowIcons = document.querySelectorAll('.arrow-icon');
  
  try {
      // 1. Busca os dados da API
      const response = await fetch('http://192.168.0.30:3001/api/inversores');
      if (!response.ok) throw new Error('Erro ao buscar dados da API');
      
      const { data } = await response.json();
      
      // 2. Transforma os dados da API no formato que você precisa
      const statusInversores = transformarDadosAPI(data, arrowIcons.length);
      
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
      
  } catch (error) {
      console.error('Erro:', error);
      // Fallback: usa valores padrão se a API falhar
      arrowIcons.forEach(icon => {
          icon.classList.add('status-1'); // Status padrão (operando)
      });
  }
});

// Função que transforma os dados da API no formato da lista fake
function transformarDadosAPI(apiData, totalInversores) {
  // Cria array com valores padrão (1 = operando)
  const statusArray = Array(totalInversores).fill(1);
  
  // Preenche com os valores reais da API
  Object.entries(apiData).forEach(([letra, inversor]) => {
      const index = letra.charCodeAt(0) - 65; // Converte A->0, B->1, etc.
      if (index >= 0 && index < totalInversores) {
          statusArray[index] = inversor.status;
      }
  });
  
  return statusArray;
}