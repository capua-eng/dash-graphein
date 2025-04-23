from flask import Flask, redirect, make_response
import requests

app = Flask(__name__)

GRAFANA_URL = 'http://localhost:3000'
GRAFANA_API_KEY = 'sa-1-teste-bf906e64-6fc4-448f-8ca4-f2984398ce1a	'  # <-- cole o token aqui

@app.route('/grafana-login')
def grafana_login():
    # Requisição para pegar usuário atual e gerar sessão
    headers = {
        'Authorization': f'Bearer {GRAFANA_API_KEY}'
    }

    # Faz login com o token
    response = requests.get(f'{GRAFANA_URL}/api/user', headers=headers)
    
    if response.status_code == 200:
        user = response.json()
        # Cria uma nova sessão
        session_res = requests.post(f'{GRAFANA_URL}/login', json={
            'user': user['admin'],
            'email': user['brunun']
        })

        if session_res.status_code == 200:
            grafana_cookies = session_res.cookies
            redirect_url = f"{GRAFANA_URL}/d/dej7q4k7aja4gd/top"
            resp = make_response(redirect(redirect_url))
            
            # Adiciona os cookies da sessão
            for cookie in grafana_cookies:
                resp.set_cookie(cookie.name, cookie.value)
            
            return resp

    return "Erro ao autenticar", 401

if __name__ == '__main__':
    app.run(port=5000, debug=True)
