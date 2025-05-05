document.addEventListener('DOMContentLoaded', async function() {
    const arrowIcons = document.querySelectorAll('.arrow-icon');
    
    try {
        // 1. Busca os dados reais da API
        const response = await fetch('http://192.168.0.30:3001/api/inversores');
        if (!response.ok) throw new Error('Erro ao buscar dados');
        
        const { data } = await response.json();
        
        // 2. Converte os dados da API para o formato de array que você usava
        const statusInversores = Array(18).fill(1); // Default (0 = operando)
        
        // Preenche com os valores reais da API
        Object.entries(data).forEach(([letra, inversor]) => {
            const index = letra.charCodeAt(0) - 65; // Converte A->0, B->1, etc.
            if (index >= 0 && index < 18) {
                statusInversores[index] = inversor.status;
            }
        });
        
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