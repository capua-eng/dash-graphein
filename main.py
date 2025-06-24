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
                cm.VelocidadeVento,
                cm.DirecaoVento,
                cm.IrrSInclin,
                cm.IrrSHoriz,
                cm.UmidRelAr,
                cm.TempAmb,
                cm.TempPlac,
                es.EnergiaDiariaUsina,
                es.EnergiaMensalUsina,
                es.MGE_1_ENER AS Instantanea,
                es.MGE_1_EP AS Consumida,
                es.MGE_1_EC AS Fornecida,
                tt.PAC_Usina AS pac_Instantanea,
                tt.PAAC_MGE_1 AS paac_Instantanea
            FROM 
                CentralMet cm
                JOIN Estatisticos es ON cm.last_refresh_time = es.last_refresh_time
                JOIN Instantaneos tt ON tt.last_refresh_time = cm.last_refresh_time
            ORDER BY cm.last_refresh_time DESC
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
        FROM AlarmesHistorico
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
        UPDATE AlarmesHistorico
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
    
@app.get("/api/unifilar")
def dados_unifilar_completo():
    try:
        conn = banco.connection
        cursor = conn.cursor()
        resultado = {"MGE": {}, "Inversores": {}}
        
        cursor.execute("""
            SELECT TOP 1 
                last_refresh_time,
                UAC_MGE_1_FA, UAC_MGE_1_FB, UAC_MGE_1_FC,
                UAC_MGE_1_FAB, UAC_MGE_1_FBC, UAC_MGE_1_FCA,
                PAAC_MGE_1, PRAC_MGE_1,
                UAC_MGE_2_FA, UAC_MGE_2_FB, UAC_MGE_2_FC,
                UAC_MGE_2_FAB, UAC_MGE_2_FBC, UAC_MGE_2_FCA,
                PAAC_MGE_2, PRAC_MGE_2,
                UAC_MGE_3_FA, UAC_MGE_3_FB, UAC_MGE_3_FC,
                UAC_MGE_3_FAB, UAC_MGE_3_FBC, UAC_MGE_3_FCA,
                PAAC_MGE_3, PRAC_MGE_3
            FROM Instantaneos
            ORDER BY last_refresh_time DESC
        """)
        
        row_mge = cursor.fetchone()
        
        if row_mge:
            colunas_mge = [col[0] for col in cursor.description]
            linha_mge = {col: val for col, val in zip(colunas_mge, row_mge) if val is not None}
            
            resultado["last_refresh_time"] = (
                linha_mge["last_refresh_time"].isoformat() 
                if isinstance(linha_mge.get("last_refresh_time"), (datetime.date, datetime.datetime))
                else None
            )
            
            for mge_num in range(1, 4):
                prefixo = f"UAC_MGE_{mge_num}_"
                mge_key = f"MGE_{mge_num}"
                
                resultado["MGE"][mge_key] = {
                    "Tensoes": {
                        "Entre_fases": {
                            "FAB": linha_mge.get(f"{prefixo}FAB"),
                            "FBC": linha_mge.get(f"{prefixo}FBC"),
                            "FCA": linha_mge.get(f"{prefixo}FCA")
                        },
                        "De_fase": {
                            "FA": linha_mge.get(f"{prefixo}FA"),
                            "FB": linha_mge.get(f"{prefixo}FB"),
                            "FC": linha_mge.get(f"{prefixo}FC")
                        }
                    },
                    "Potencias": {
                        "Ativa": linha_mge.get(f"PAAC_MGE_{mge_num}"),
                        "Reativa": linha_mge.get(f"PRAC_MGE_{mge_num}")
                    }
                }
        
        # 2. Consulta para cada inversor (1-18)
        for i in range(1, 19):
            nome_tabela = f"Inversor{i}"
            try:
                cursor.execute(f"""
                    SELECT TOP 1 
                        INV{i}_AC_PAB_V AS Tensao,
                        (INV{i}_ADC_MPPT1 + INV{i}_ADC_MPPT2 + INV{i}_ADC_MPPT3 + 
                         INV{i}_ADC_MPPT4 + INV{i}_ADC_MPPT5 + INV{i}_ADC_MPPT6 + 
                         INV{i}_ADC_MPPT7 + INV{i}_ADC_MPPT8 + INV{i}_ADC_MPPT9 + 
                         INV{i}_ADC_MPPT10 + INV{i}_ADC_MPPT11 + INV{i}_ADC_MPPT12) AS Corrente,
                        INV{i}_PAC AS Potencia,
                        last_refresh_time
                    FROM {nome_tabela}
                    ORDER BY last_refresh_time DESC
                """)
                
                row_inv = cursor.fetchone()
                
                if row_inv:
                    inversor_data = {
                        "Tensao": row_inv.Tensao,
                        "Corrente": row_inv.Corrente,
                        "Potencia": row_inv.Potencia,
                        "last_refresh_time": (
                            row_inv.last_refresh_time.isoformat()
                            if isinstance(row_inv.last_refresh_time, (datetime.date, datetime.datetime))
                            else None
                        )
                    }
                    resultado["Inversores"][f"Inversor{i}"] = inversor_data
                    
            except Exception as inv_error:
                print(f"Erro ao processar {nome_tabela}: {str(inv_error)}")
                continue
        
        # Função para extrair o tipo base do trip (ex: "TRIP 27")
        # Mapeamento direto de bit para número do trip (apenas o número)
        trip_mapping = {
            'PEXTRON1': {
                0: 27, 1: 27, 2: 27,   # TRIP 27 (todas as fases)
                3: 51, 4: 51, 5: 51, 6: 51,  # TRIP 51
                7: 100, # Falha na bobina de abertura
                8: 32, 9: 32, 10: 32,  # TRIP 32
                11: 50, 12: 50, 13: 50, 14: 50,  # TRIP 50
                15: 0 # Reserva
            },
            'PEXTRON2': {
                0: 37, 1: 37, 2: 37,   # TRIP 37
                3: 67, 4: 67, 5: 67, 6: 67,  # TRIP 67
                7: 0, # Reserva
                8: 133,   # Bandeirola TRIP GS 133
                9: 157,   # Bandeirola TRIP Q 157
                10: 81, # TRIP 81
                11: 59, 12: 59, 13: 59, 14: 59,  # TRIP 59
                15: 27  # TRIP 27-0
            },
            'PEXTRON3': {
                0: 78,  # TRIP 78
                1: 86,  # TRIP 86
                2: 47,  # TRIP 47
                3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0  # RESERVA
            }
        }

        # Seu código atual com a modificação
        query_alarmes = '''
        SELECT
            ah.Status_,
            ah.Equipamento,
            ah.BITS 
        FROM AlarmesHistorico ah
        WHERE ah.Status_ != 0
        AND ah.Equipamento IN ('PEXTRON1', 'PEXTRON2', 'PEXTRON3')
        ORDER BY DataErroIni DESC
        '''
        cursor.execute(query_alarmes)
        row_alarmes = cursor.fetchall()

        # Conjunto para armazenar os números dos trips ativos (sem duplicatas)
        trips_ativos = set()
        for trip in row_alarmes:
            equipamento = trip[1]
            bit = trip[2]
            
            if equipamento in trip_mapping and bit in trip_mapping[equipamento]:
                trip_num = trip_mapping[equipamento][bit]
                if trip_num != 0:
                    trips_ativos.add(trip_num)

        # Converte para lista ordenada
        resultado["trips_ativos"] = sorted(list(trips_ativos))

        return resultado
        
    except Exception as e:
        print(f"Erro geral: {str(e)}")
        return {"erro": "Ocorreu um erro ao processar os dados"}
    
    finally:
        if 'cursor' in locals():
            cursor.close()
