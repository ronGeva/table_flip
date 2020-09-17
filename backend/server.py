from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import json
import time
import os
from threading import Lock, Thread

from authentication import AuthenticationManager

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)
socket_io = SocketIO(app, cors_allowed_origins="*")
message_history = {}
clients = []
authentication_manager = AuthenticationManager()


class ChatsData(object):
    message_history = {}
    clients = {}
    lock = Lock()

    @staticmethod
    def add_new_client(client, room):
        ChatsData.lock.acquire()
        if room not in ChatsData.clients:
            ChatsData.clients[room] = [client]
        elif client not in ChatsData.clients[room]:
            ChatsData.clients[room].append(client)
        ChatsData.lock.release()

    @staticmethod
    def remove_client(client):
        ChatsData.lock.acquire()
        for room in ChatsData.clients.keys():
            if client in ChatsData.clients[room]:
                ChatsData.clients[room].remove(client)
        ChatsData.lock.release()

    @staticmethod
    def get_client_rooms(client):
        return filter(lambda room: client in ChatsData.clients[room], ChatsData.clients.keys())


class Clients(object):
    credentials = {"user1": "pass", "user2": "pass2"}  # TODO: use an actual DB and implement sign up
    rooms = {}
    sid_to_username = {}
    users_last_keepalive = {}


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


def successful_authentication(sid, username):
    Clients.sid_to_username[sid] = username
    socket_io.emit("authentication_result", {"result": "ok"}, room=sid)
    Clients.users_last_keepalive[sid] = time.time()


@socket_io.on("authenticate")
def authenticate(data):
    if "authenticationType" not in data.keys():
        return  # TODO: send a faulty authentication message
    username, password = data["username"], data["password"]
    if data["authenticationType"] == "sign in":
        if authentication_manager.check_authentication(username, password):
            successful_authentication(request.sid, username)
        else:
            socket_io.emit("authentication_result", {"result": "failure"}, room=request.sid)
    if data["authenticationType"] == "sign up":
        try:
            authentication_manager.insert_new_user(username, password)
            successful_authentication(request.sid, username)
        except AssertionError:
            socket_io.emit("authentication_result", {"result": "failure"}, room=request.sid)


@socket_io.on("disconnect")
def client_disconnect():
    if request.sid not in Clients.sid_to_username:
        return
    clients_rooms = ChatsData.get_client_rooms(Clients.sid_to_username[request.sid])
    remove_client_from_globals(request.sid)
    for room in clients_rooms:
        socket_io.emit("users_update", {"users": ChatsData.clients[room]}, room=room)


@socket_io.on("client_keepalive")
def client_keepalive():
    Clients.users_last_keepalive[request.sid] = time.time()


def remove_client_from_globals(sid):
    """
    Removes the client data from the program's globals, for example: from all the chat rooms, from the last keepalive
    dictionary, etc.
    :param sid: The sid of the client.
    :return: None
    """
    Clients.users_last_keepalive.pop(sid)
    ChatsData.remove_client(Clients.sid_to_username.pop(sid))


def check_keepalives():
    """
    This routine runs in parallel to the server and checks for keepalive of the users. In case a user hasn't sent a
    keepalive for a sufficiently large amount of time we asuume it has disconnected and remove him from the server.
    In addition, in case we remove a client from the session, we update the users in all relevant rooms.
    :return: None
    """
    while True:
        disconnected_sids = []
        rooms_to_update = set()
        for sid in Clients.users_last_keepalive.keys():
            last_keepalive = Clients.users_last_keepalive[sid]
            if time.time() - last_keepalive > 5: # TODO: make this a const, or better yet a part of a logical component
                disconnected_sids.append(sid)

        for sid in disconnected_sids:
            username = Clients.sid_to_username[sid]
            rooms_to_update = rooms_to_update.union(set(ChatsData.get_client_rooms(username)))
            remove_client_from_globals(sid)

        for room in rooms_to_update:
            socket_io.emit("users_update", {"users": ChatsData.clients[room]}, room=room)

        time.sleep(1)


def main():
    t = Thread(target=check_keepalives)
    t.start()
    socket_io.run(app, "localhost", 5050, debug=True)
    t.join()


if __name__ == '__main__':
    main()
