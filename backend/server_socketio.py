import socketio
import eventlet
import time
from authentication import AuthenticationManager
from rooms import ChatsData, RoomsManager


sio = socketio.Server(async_mode='eventlet', cors_allowed_origins="http://localhost:3000")
app = socketio.WSGIApp(sio)


authentication_manager = AuthenticationManager()
rooms_manager = RoomsManager()
message_history = {}


def _emit_rooms_info(sid):
    rooms = rooms_manager.get_all_rooms()
    rooms_info = [{"name": rooms[i], "id": i} for i in range(len(rooms))]  # TODO: make the unique ID better
    sio.emit("rooms_info", rooms_info, room=sid)


@sio.event
def connect(sid, auth):
    _emit_rooms_info(sid)  # TODO: fix this, security concern


@sio.event
def disconnect(sid):
    if sid not in ChatsData.sid_to_username:
        return

    username = ChatsData.sid_to_username[sid]
    rooms = ChatsData.get_client_rooms(username)
    ChatsData.remove_client(sid)
    for room in rooms:
        sio.emit("users_update", {"users": ChatsData.clients[room]}, room=room)


def successful_authentication(sid, username):
    ChatsData.sid_to_username[sid] = username
    sio.emit("authentication_result", {"result": "ok"}, room=sid)
    ChatsData.users_last_keepalive[sid] = time.time()


@sio.on("authenticate")
def authenticate(sid, msg):
    if "authenticationType" not in msg:
        return  # TODO: send a faulty authentication message
    username, password = msg["username"], msg["password"]
    if msg["authenticationType"] == "sign in":
        if authentication_manager.check_authentication(username, password):
            successful_authentication(sid, username)
        else:
            sio.emit("authentication_result", {"result": "failure"}, room=sid)
    if msg["authenticationType"] == "sign up":
        try:
            authentication_manager.insert_new_user(username, password)
            successful_authentication(sid, username)
        except AssertionError:
            sio.emit("authentication_result", {"result": "failure"}, room=sid)


@sio.on("add_room")
def add_room(sid, data):
    if "room_name" not in data:
        return  # TODO: error message?
    rooms_manager.add_room(data["room_name"])
    _emit_rooms_info(sid)


@sio.on("join_room")
def client_join_room(sid, data):
    sio.enter_room(sid, data["room"])
    ChatsData.add_new_client(data["username"], data["room"])
    sio.emit("users_update", {"users": ChatsData.clients[data["room"]]}, room=data["room"])


@sio.on("delete_room")
def delete_room(sid, data):
    if "room_name" not in data:
        return  # TODO: error message?
    room_name = data["room_name"]
    rooms_manager.delete_room(room_name)
    _emit_rooms_info(sid)
    ChatsData.remove_room(room_name)  # TODO: take care of the situation in which users are in the room during deletion


@sio.on("send_message")
def send_message(sid, message):
    global message_history
    new_message = message['username'] + " : " + message['message'] + '\n'
    room = message['room']
    message_history.setdefault(room, "")
    message_history[room] += new_message
    sio.emit("new_message", new_message, room=room)


@sio.on("draw")
def draw_on_board(sid, data):
    room = data['room']
    sio.emit("draw", data, room=room)


@sio.on("clear")
def draw_on_board(sid, data):
    room = data['room']
    sio.emit("clear", data, room=room)


def main():
    eventlet.wsgi.server(eventlet.listen(('', 5050)), app)


if __name__ == '__main__':
    main()
