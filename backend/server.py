from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)
socket_io = SocketIO(app, cors_allowed_origins="*")
message_history = {}
clients = []


@app.route('/index', methods=['GET'])
def main_page():
    return "Hello world"


@socket_io.on("send_message")
def send_message(message):
    global message_history
    new_message = message['username'] + " : " + message['message'] + '\n'
    room = message['room']
    message_history.setdefault(room, "")
    message_history[room] += new_message
    emit("new_message", new_message, room=room)


@socket_io.on("connect")
def on_connect():
    socket_io.emit("rooms_info", [{"name": "A nice room", "id": 123}, {"name": "A nicer room", "id": 125}])


@socket_io.on("join_room")
def client_join_room(data):
    join_room(data["room"])


def main():
    socket_io.run(app, "localhost", 5050, debug=True)


if __name__ == '__main__':
    main()