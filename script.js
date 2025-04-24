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