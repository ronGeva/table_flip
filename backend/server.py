from flask import Flask, request, jsonify, session
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


class ChatsData(object):
    message_history = {}
    clients = {}

    @staticmethod
    def add_new_client(client, room):
        if room not in ChatsData.clients:
            ChatsData.clients[room] = [client]
        elif client not in ChatsData.clients[room]:
            ChatsData.clients[room].append(client)


class Clients(object):
    credentials = {"user1": "pass", "user2": "pass2"}  # TODO: use an actual DB and implement sign up
    rooms = {}
    sid_to_username = {}


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
    room = session.get('room')
    join_room(room)
    socket_io.emit("rooms_info", [{"name": "A nice room", "id": 123}, {"name": "A nicer room", "id": 125}],
                   room=request.sid)


@socket_io.on("join_room")
def client_join_room(data):
    join_room(data["room"])
    ChatsData.add_new_client(data["username"], data["room"])
    socket_io.emit("users_update", {"users": ChatsData.clients[data["room"]]}, room=data["room"])


@socket_io.on("authenticate")
def authenticate(data):
    if "authenticationType" not in data.keys():
        return  # TODO: send a faulty authentication message
    if data["authenticationType"] == "sign in":
        username, password = data["username"], data["password"]
        if username in Clients.credentials and password == Clients.credentials[username]:
            Clients.sid_to_username[request.sid] = username
            socket_io.emit("authentication_result", {"result": "ok"}, room=request.sid)
        else:
            socket_io.emit("authentication_result", {"result": "failure"}, room=request.sid)
    if data["authenticationType"] == "sign up":
        pass


@socket_io.on("disconnect")
def client_disconnect():
    if request.sid not in Clients.sid_to_username:
        return
    username = Clients.sid_to_username[request.sid]
    for room in ChatsData.clients.keys():
        if username in ChatsData.clients[room]:
            ChatsData.clients[room].remove(username)
            socket_io.emit("users_update", {"users": ChatsData.clients[room]}, room=room)
    Clients.sid_to_username.pop(request.sid)


def main():
    socket_io.run(app, "localhost", 5050, debug=True)


if __name__ == '__main__':
    main()
