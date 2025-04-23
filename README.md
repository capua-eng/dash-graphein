# dash-graphein
Desenvolvimento de dashboard de monitoramento para ufv unesp.


Criar regra para permitir Iframe no HTML
  1. Acesse o diretório de instalação do Grafana (típicamente para o Grafana no Windows é:)
     C:\Program Files\GrafanaLabs\grafana\conf
     
  2. Crie o arquivo 'custom.ini'
     No diretório 'conf', você pode criar o arquivo 'custom.ini' se ele não existir.
     
  3. Abra o arquivo e adicione o seguinte código:

    [security]
    # Permite embedding via iframe
    allow_embedding = true
    x_frame_options = ""
    
    [auth.anonymous]
    enabled = true
    org_name = Main Org.
    org_role = Viewer

  4. Reinicie o serviço do Grafana:
     Pressione 'Win + R', digite 'services.msc'
     Encontre 'Grafana', clique com o botão direito > Reiniciar

