from flask import Flask, request, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import time
import os
from threading import Thread

from authentication import AuthenticationManager
from rooms import ChatsData, RoomsManager

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)
socket_io = SocketIO(app, cors_allowed_origins="*")
message_history = {}
clients = []
authentication_manager = AuthenticationManager()
rooms_manager = RoomsManager()


@socket_io.on("send_message")
def send_message(message):
    global message_history
    new_message = message['username'] + " : " + message['message'] + '\n'
    room = message['room']
    message_history.setdefault(room, "")
    message_history[room] += new_message
    emit("new_message", new_message, room=room)


def _emit_rooms_info(sid):
    rooms = rooms_manager.get_all_rooms()
    rooms_info = [{"name": rooms[i], "id": i} for i in xrange(len(rooms))]  # TODO: make the unique ID better
    socket_io.emit("rooms_info", rooms_info, room=sid)


@socket_io.on("connect")
def on_connect():
    room = session.get('room')
    join_room(room)
    _emit_rooms_info(request.sid)


@socket_io.on("join_room")
def client_join_room(data):
    join_room(data["room"])
    ChatsData.add_new_client(data["username"], data["room"])
    socket_io.emit("users_update", {"users": ChatsData.clients[data["room"]]}, room=data["room"])


def successful_authentication(sid, username):
    ChatsData.sid_to_username[sid] = username
    socket_io.emit("authentication_result", {"result": "ok"}, room=sid)
    ChatsData.users_last_keepalive[sid] = time.time()


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


@socket_io.on("client_keepalive")
def client_keepalive():
    ChatsData.users_last_keepalive[request.sid] = time.time()


@socket_io.on("add_room")
def add_room(data):
    if "room_name" not in data:
        return  # TODO: error message?
    rooms_manager.add_room(data["room_name"])
    _emit_rooms_info(request.sid)


@socket_io.on("delete_room")
def delete_room(data):
    if "room_name" not in data:
        return  # TODO: error message?
    rooms_manager.delete_room(data["room_name"])
    _emit_rooms_info(request.sid)


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
        for sid in ChatsData.users_last_keepalive.keys():
            last_keepalive = ChatsData.users_last_keepalive[sid]
            if time.time() - last_keepalive > 5: # TODO: make this a const, or better yet a part of a logical component
                disconnected_sids.append(sid)

        for sid in disconnected_sids:
            if sid not in ChatsData.sid_to_username:
                continue  # user has already been removed successfully
            username = ChatsData.sid_to_username[sid]
            rooms_to_update = rooms_to_update.union(set(ChatsData.get_client_rooms(username)))
            ChatsData.remove_client(sid)

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
