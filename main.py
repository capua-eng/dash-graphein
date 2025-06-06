from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import Banco
import datetime
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Banco
banco = Banco()
banco.conectar()

# Static + Templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Rotas HTML
@app.get("/")
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/inversores")
def inversores(request: Request):
    return templates.TemplateResponse("inversores.html", {"request": request})

@app.get("/unifilar")
def unifilar(request: Request):
    return templates.TemplateResponse("unifilar.html", {"request": request})

@app.get("/arquitetura")
def arquitetura(request: Request):
    return templates.TemplateResponse("arquitetura.html", {"request": request})

@app.get("/favicon.ico")
def favicon():
    return FileResponse("static/assets/images/favicon.ico")

# API
@app.get("/api/tela_inicial")
def obter_potencia_com_meteo():
    resultado = {
        "central_meteorologica": {}
    }

    try:
        conn = banco.connection
        cursor = conn.cursor()

        # Dados da estação meteorológica
        query_meteo = """
            SELECT TOP 1
                VelocidadeVento,
                DirecaoVento,
                IrrSInclin,
                IrrSHoriz,
                UmidRelAr,
                TempAmb,
                TempPlac
            FROM
        CentralMet
            ORDER BY last_refresh_time DESC
        """
        cursor.execute(query_meteo)
        row = cursor.fetchone()
        if row:
            colunas = [col[0] for col in cursor.description]
            resultado["central_meteorologica"] = {
                col: (val.isoformat() if isinstance(val, (datetime.datetime, datetime.date)) else val)
                for col, val in zip(colunas, row)
            }
        
        # Dados dos alarmes
        query_alarmes = '''
        SELECT
            DataErroIni,
            DataErroFim,
            Operador,
            Equipamento,
            Status_,
            Erro,
            BITS
        FROM teste_AlarmesErros
        WHERE Reconhecimento IS NULL
		OR DataErroRec IS NULL
        OR Status_ = 1
        ORDER BY DataErroIni DESC
        '''
        cursor.execute(query_alarmes)
        row_alarmes = cursor.fetchall()
        if row_alarmes:
            colunas_alarmes = [col[0] for col in cursor.description]
            resultado["alarmes_erros"] = [
                {
                    col: (val.isoformat() if isinstance(val, (datetime.datetime, datetime.date)) else val)
                    for col, val in zip(colunas_alarmes, row)
                }
                for row in row_alarmes
            ]

        # Dados dos inversores
        for i in range(1, 19):
            nome = f"Inversor{i}"
            tabela = nome
            prefixo = f"INV{i}_"

            query = f"""
                SELECT TOP 1 _Status, {prefixo}TI, {prefixo}PAC, {prefixo}PDC
                FROM {tabela}
                ORDER BY last_refresh_time DESC
            """
            cursor.execute(query)
            row = cursor.fetchone()
            if row:
                colunas = [col[0] for col in cursor.description]
                resultado[nome] = {
                    col: val for col, val in zip(colunas, row)
                }

        cursor.close()
        return resultado

    except Exception as e:
        return {"erro": str(e)}

@app.get("/api/inversores")
def dados_detalhados():
    try:
        conn = banco.connection
        cursor = conn.cursor()
        dados_final = {}

        for i in range(1, 19):  # Tabelas Inversor1 até Inversor18
            nome_tabela = f"Inversor{i}"
            prefixo = f"INV{i}_"

            cursor.execute(f"""
                SELECT TOP 1 * FROM {nome_tabela}
                ORDER BY last_refresh_time DESC
            """)
            row = cursor.fetchone()

            if not row:
                continue  # ignora tabelas sem dados

            colunas = [col[0] for col in cursor.description]
            linha = dict(zip(colunas, row))

            last_refresh = linha.get("last_refresh_time")
            if isinstance(last_refresh, (datetime.date, datetime.datetime)):
                last_refresh = last_refresh.isoformat()

            # Dados principais do inversor
            inversor = {
                "last_refresh_time": last_refresh,
                "Status": linha.get(f"_Status"),
                "PAC": linha.get(f"{prefixo}PAC"),
                "UDC": linha.get(f"{prefixo}UDC"),
                "ADC": linha.get(f"{prefixo}ADC"),
                "PDC": linha.get(f"{prefixo}PDC"),
                "UAC": linha.get(f"{prefixo}UAC"),
                "AAC": linha.get(f"{prefixo}AAC"),
                "GEN_DIA": linha.get(f"{prefixo}GEN_DIA"),
                "GEN_MES": linha.get(f"{prefixo}GEN_MES"),
                "Tensao_Fase": {
                    "PAB": linha.get(f"{prefixo}AC_PAB_V"),
                    "PBC": linha.get(f"{prefixo}AC_PBC_V"),
                    "PCA": linha.get(f"{prefixo}AC_PCA_V"),
                    "PA": linha.get(f"{prefixo}AC_PA_V"),
                    "PB": linha.get(f"{prefixo}AC_PB_V"),
                    "PC": linha.get(f"{prefixo}AC_PC_V")
                },
                "Corrente_Fase": {
                    "PA": linha.get(f"{prefixo}AC_PA_A"),
                    "PB": linha.get(f"{prefixo}AC_PB_A"),
                    "PC": linha.get(f"{prefixo}AC_PC_A")
                }
            }

            # MPPTs
            mppts = {}
            for m in range(1, 13):
                mppts[f"MPPT{m}"] = {
                    "V": linha.get(f"{prefixo}UDC_MPPT{m}"),
                    "A": linha.get(f"{prefixo}ADC_MPPT{m}"),
                    "A1": linha.get(f"{prefixo}MPPT_A{(m - 1) * 2 + 1}"),
                    "A2": linha.get(f"{prefixo}MPPT_A{(m - 1) * 2 + 2}")
                }

            inversor["MPPTS"] = mppts
            dados_final[f"Inversor{i}"] = inversor

        return dados_final

    except Exception as e:
        return {"erro": str(e)}

class ReconhecimentoAlarme(BaseModel):
    BITS: int
    Equipamento: str
    DataErroIni: datetime.datetime
    class Config:
        arbitrary_types_allowed = True
@app.post("/api/recAlarmes")
def recAlarmes(alarme: ReconhecimentoAlarme):
    try:
        logging.debug(f"Recebido: BITS={alarme.BITS}, Equipamento={alarme.Equipamento}, DataErroIni={alarme.DataErroIni}")

        conn = banco.connection
        cursor = conn.cursor()
        query_update = """
        UPDATE teste_AlarmesErros
        SET Operador = 'Reconhecido',
            Reconhecimento = 'Sim',
            DataErroRec = GETDATE()
        WHERE Equipamento = ?
        AND BITS = ?
        """
        logging.debug("Executando UPDATE...")
        cursor.execute(query_update, (alarme.Equipamento, alarme.BITS))

        logging.debug(f"Linhas afetadas: {cursor.rowcount}")
        if cursor.rowcount == 0:
            logging.error("UPDATE não afetou nenhuma linha — pode haver problema de precisão ou o dado foi alterado.")

        conn.commit()
        cursor.close()
        return {"status": "Reconhecimento realizado com sucesso"}

    except Exception as e:
        logging.exception("Erro inesperado ao processar alarme:")
        raise HTTPException(status_code=400, detail=f"Erro inesperado: {str(e)}")