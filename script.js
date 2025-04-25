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
