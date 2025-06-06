from dotenv import load_dotenv
import os
import pyodbc

class Banco:
    def __init__(self):
        load_dotenv()
        self.servidores = [s.strip() for s in os.getenv("DB_SERVERS", "").split(",")]
        self.database = os.getenv("DB_NAME")
        self.username = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.driver = os.getenv("DB_DRIVER")
        self.connection = None

    def conectar(self):
        for server in self.servidores:
            conn_str = (
                f'DRIVER={self.driver};'
                f'SERVER={server};'
                f'DATABASE={self.database};'
                f'UID={self.username};'
                f'PWD={self.password}'
            )
            try:
                self.connection = pyodbc.connect(conn_str, timeout=5)
                print(f"[INFO] Conectado com sucesso ao servidor: {server}")
                return self.connection
            except pyodbc.InterfaceError as e:
                print(f"[WARN] Falha ao conectar ao servidor {server}: {e}")
            except Exception as e:
                print(f"[ERROR] Erro ao tentar conexão com {server}: {e}")
        raise ConnectionError("Não foi possível conectar a nenhum dos servidores.")

    def fechar_conexao(self):
        if self.connection:
            self.connection.close()
            print("[INFO] Conexão fechada.")
