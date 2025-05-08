const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiUrl = 'http://192.168.0.252:8080/api/inversores';
const outputFile = 'arquivo.json';
const interval = 15000; // 15 segundos em milissegundos

async function fetchAndSaveJson() {
    try {
        // 1. Fazer a requisição para a API
        const response = await axios.get(apiUrl);
        
        // 2. Salvar o JSON no arquivo
        fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 4), 'utf-8');
        
        console.log(`[${new Date().toLocaleTimeString()}] JSON atualizado e salvo em ${outputFile}`);
        
        // 3. Ler o arquivo salvo para verificação (opcional)
        const savedData = fs.readFileSync(outputFile, 'utf-8');
        console.log('Conteúdo do arquivo:', savedData);
        
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Erro:`, error.message);
    }
}

// Executar imediatamente pela primeira vez
fetchAndSaveJson();

// Configurar o intervalo para executar a cada 15 segundos
const intervalId = setInterval(fetchAndSaveJson, interval);

// Para parar o intervalo (se necessário)
// clearInterval(intervalId);