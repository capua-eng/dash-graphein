async function getStatusList() {
    try {
        const response = await fetch('http://localhost:3001/api/inversores');
        const { data } = await response.json();
        
        // Cria array ordenado [A, B, C, D...] com apenas os valores de status
        const statusList = Object.entries(data)
            .sort(([letraA], [letraB]) => letraA.localeCompare(letraB)) // Ordena por letra
            .map(([_, inversor]) => inversor.status); // Pega só o status
            
        console.log('📋 Lista de status:', statusList);
        return statusList;
        
    } catch (error) {
        console.error('Erro ao obter status:', error);
        return []; // Retorna array vazio em caso de erro
    }
}

// Uso
getStatusList().then(statusList => {
    console.log('Resultado:', statusList);
    // Exemplo de saída: [1, 1, -1, 0] (para A=1, B=1, C=-1, D=0)
});