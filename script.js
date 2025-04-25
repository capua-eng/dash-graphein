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
