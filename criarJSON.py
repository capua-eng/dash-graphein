import pyodbc
import json
import time
from datetime import datetime

def atualizar_dados_inversores():
    conn_str = (
        r'DRIVER={SQL Server};'
        r'SERVER=192.168.0.252;'
        r'DATABASE=Usina;'
        r'UID=capua;'
        r'PWD=Capua13579'
    )
    
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        resultados = []

        for inversor_num in range(1, 9):
            tabela = f"Inversor{inversor_num}"
            
            try:
                cursor.execute(f"""
                    SELECT TOP 1 
                        [INV{inversor_num}_ADC] as ADC,
                        [INV{inversor_num}_UDC] as UDC,
                        [INV{inversor_num}_PDC] as PDC 
                    FROM {tabela} 
                    ORDER BY last_refresh_time DESC
                """)
                
                row = cursor.fetchone()
                
                if row:
                    resultados.append({
                        f"Inversor{inversor_num}": {
                            "ADC": row.ADC,
                            "UDC": row.UDC,
                            "PDC": row.PDC,
                            "ultima_atualizacao": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                    })
                    
            except pyodbc.Error as e:
                print(f"Erro ao acessar {tabela}: {str(e)}")

        if resultados:
            with open('dados_inversores.json', 'w', encoding='utf-8') as f:
                json.dump(resultados, f, indent=4)
            print(f"Dados atualizados em {datetime.now().strftime('%H:%M:%S')}")
            
    except Exception as e:
        print(f"Erro na conexão: {str(e)}")
    finally:
        if 'conn' in locals():
            conn.close()

# Configuração do intervalo de atualização (em segundos)
INTERVALO_ATUALIZACAO = 60  # Atualiza a cada 1 minuto

if __name__ == "__main__":
    print("Iniciando sistema de atualização de dados...")
    while True:
        atualizar_dados_inversores()
        time.sleep(INTERVALO_ATUALIZACAO)