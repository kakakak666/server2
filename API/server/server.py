from flask import Flask, request, jsonify
import os
import shutil
from datetime import datetime
import threading
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Isso permite requisições de qualquer origem (incluindo 127.0.0.1:5500)

BASE_DIR = 'salas'

# Garante que a pasta base exista
os.makedirs(BASE_DIR, exist_ok=True)

# Função para deletar uma sala após 15 minutos
def agendar_exclusao_sala(caminho_sala, nome_sala):
    def deletar_sala():
        if os.path.exists(caminho_sala):
            shutil.rmtree(caminho_sala)
            print(f"Sala {nome_sala} excluída automaticamente após 15 minutos.")

    # Agenda a exclusão após 900 segundos (15 min)
    timer = threading.Timer(900, deletar_sala)
    timer.start()

@app.route('/sala', methods=['GET'])
def criar_sala():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    nome_sala = f'sala_{timestamp}'
    caminho_sala = os.path.join(BASE_DIR, nome_sala)
    os.makedirs(caminho_sala)

    # Registrar o momento da criação (opcional, para controle ou logs)
    with open(os.path.join(caminho_sala, 'created_at.txt'), 'w') as f:
        f.write(datetime.now().isoformat())

    # Agendar exclusão automática
    agendar_exclusao_sala(caminho_sala, nome_sala)

    return jsonify({'mensagem': 'Sala criada', 'sala': nome_sala}), 201

@app.route('/sala/<nome_sala>/novo_usuario', methods=['POST'])
def adicionar_usuario(nome_sala):
    dados = request.get_json()
    nome_usuario = dados.get('nome')
    if not nome_usuario:
        return jsonify({'erro': 'Nome do usuário é obrigatório'}), 400

    caminho_sala = os.path.join(BASE_DIR, nome_sala)
    if not os.path.exists(caminho_sala):
        return jsonify({'erro': 'Sala não encontrada'}), 404

    caminho_usuario = os.path.join(caminho_sala, f'{nome_usuario}.txt')
    with open(caminho_usuario, 'w') as f:
        f.write(f'nome: {nome_usuario}\npontos: 0\n')

    return jsonify({'mensagem': f'Usuário {nome_usuario} adicionado à sala {nome_sala}'}), 201

@app.route('/sala/<nome_sala>/usuario/<nome_usuario>/pontos', methods=['GET'])
def obter_pontos(nome_sala, nome_usuario):
    caminho_usuario = os.path.join(BASE_DIR, nome_sala, f'{nome_usuario}.txt')
    if not os.path.exists(caminho_usuario):
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    with open(caminho_usuario, 'r') as f:
        linhas = f.readlines()
    pontos = next((int(linha.split(':')[1].strip()) for linha in linhas if linha.startswith('pontos:')), None)

    return jsonify({'usuario': nome_usuario, 'pontos': pontos})

@app.route('/salas', methods=['GET'])
def listar_salas():
    caminho_base = os.path.join(BASE_DIR)
    if not os.path.exists(caminho_base):
        return jsonify([])

    salas = [
        nome for nome in os.listdir(caminho_base)
        if os.path.isdir(os.path.join(caminho_base, nome))
    ]
    return jsonify(salas)

@app.route('/sala/<nome_sala>/usuario/<nome_usuario>/pontos', methods=['POST'])
def atualizar_pontos(nome_sala, nome_usuario):
    dados = request.get_json()
    novos_pontos = dados.get('pontos')

    

    caminho_usuario = os.path.join(BASE_DIR, nome_sala, f'{nome_usuario}.txt')
    if not os.path.exists(caminho_usuario):
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    with open(caminho_usuario, 'r') as f:
        linhas = f.readlines()

    with open(caminho_usuario, 'w') as f:
        for linha in linhas:
            if linha.startswith('pontos:'):
                f.write(f'pontos: {novos_pontos}\n')
            else:
                f.write(linha)

    return jsonify({'mensagem': f'Pontos do usuário {nome_usuario} atualizados para {novos_pontos}'}), 200

@app.route('/sala/<nome_sala>/ranking', methods=['GET'])
def ranking_sala(nome_sala):
    caminho_sala = os.path.join(BASE_DIR, nome_sala)
    if not os.path.exists(caminho_sala):
        return jsonify({'erro': 'Sala não encontrada'}), 404

    ranking = []
    for arquivo in os.listdir(caminho_sala):
        if arquivo.endswith('.txt') and arquivo != 'created_at.txt':
            nome_usuario = arquivo.replace('.txt', '')
            caminho_usuario = os.path.join(caminho_sala, arquivo)
            with open(caminho_usuario, 'r') as f:
                linhas = f.readlines()
                pontos = 0
                for linha in linhas:
                    if linha.startswith('pontos:'):
                        try:
                            pontos = int(linha.split(':')[1].strip())
                        except (ValueError, IndexError):
                            pontos = 0
                        break
                ranking.append({'usuario': nome_usuario, 'pontos': pontos})

    # Ordena por pontos decrescentes
    ranking.sort(key=lambda x: x['pontos'], reverse=True)

    return jsonify(ranking)


if __name__ == '__main__':
    app.run(debug=True)
