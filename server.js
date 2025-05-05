const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const app = express();
const PORT = 3001;

const dbConfig = {
  user: 'estagiarios',
  password: 'capua123',
  server: '192.168.0.191\\GOODWE_API',
  database: 'GOODWE',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    driver: 'ODBC Driver 17 for SQL Server'
  }
};

const allowedOrigins = [
    'http://127.0.0.1:5500',    // Seu Live Server
    'http://192.168.0.31:5500', // Outro possível endereço
    'http://localhost:5500'     // Para desenvolvimento local
  ];
  
  app.use(cors({
    origin: function(origin, callback) {
      // Permite requisições sem origin (como mobile apps ou curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'A política CORS para este site não permite acesso a partir da origem especificada.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  

// Middleware para servir arquivos estáticos
app.use(express.static('public'));

// Teste de conexão simplificado
async function testarConexao() {
  try {
    console.log('Tentando conectar ao SQL Server...');
    const pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    await pool.close();
    return true;
  } catch (err) {
    console.error('❌ Falha na conexão:', err);
    return false;
  }
}

// app.use(cors(corsOptions));

// Rota principal da API
app.get('/api/inversores', async (req, res) => {
  try {
    const pool = await new sql.ConnectionPool(dbConfig).connect();
    
    const result = await pool.request().query(`
      SELECT 
        SUBSTRING(Origem, LEN('Mendes Inversor') + 1, 1) as inversor_id,
        Potencia,
        Status_ as status,
        Modelo,
        id
      FROM view_cards
      WHERE Origem IN (
        'Mendes InversorA',
        'Mendes InversorB',
        'Mendes InversorC',
        'Mendes InversorD'
      )
      AND id IN (
        SELECT MAX(id)
        FROM view_cards
        WHERE Origem LIKE 'Mendes Inversor%'
        GROUP BY SUBSTRING(Origem, LEN('Mendes Inversor') + 1, 1)
      )
      ORDER BY inversor_id
    `);
    
    const dados_inversores = {};
    result.recordset.forEach(row => {
      dados_inversores[row.inversor_id] = {
        potencia: row.Potencia,
        status: row.status,
        modelo: row.Modelo,
        ultimo_id: row.id
      };
    });

    await pool.close();
    
    res.json({
      success: true,
      data: dados_inversores,
      updatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Erro na rota /api/inversores:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados dos inversores'
    });
  }
});

// Rota de teste simples
app.get('/teste', (req, res) => {
  res.send('API operacional');
});

// Inicia o servidor
async function iniciarServidor() {
  const conexaoOk = await testarConexao();
  
  if (conexaoOk) {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } else {
    console.error('Não foi possível iniciar o servidor devido a problemas na conexão com o banco.');
    process.exit(1); // Encerra o processo com erro
  }
}

iniciarServidor();