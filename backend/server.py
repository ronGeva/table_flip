from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)
socket_io = SocketIO(app, cors_allowed_origins="*")
message_history = ""


@app.route('/index', methods=['GET'])
def main_page():
    return "Hello world"


@app.route('/get_chat', methods=['GET'])
def retrieve_chat():
    return {'chat': message_history}


@app.route('/message_post', methods=['POST'])
def message_post():
    global message_history
    data_json = json.loads(request.data)
    new_message = data_json["username"] + " : " + data_json["message"] + "\n"
    message_history += new_message
    emit("new_message", new_message)
    return {"response": "ok"}


def main():
    socket_io.run(app, "localhost", 5050, debug=True)


if __name__ == '__main__':
    main()