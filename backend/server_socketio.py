import socketio
import eventlet
import time
import base64
from typing import Optional
from authentication import AuthenticationManager
from rooms import ChatsData, RoomsManager
from images import ImagesManager


sio = socketio.Server(async_mode='eventlet', cors_allowed_origins="http://localhost:3000")
app = socketio.WSGIApp(sio)


authentication_manager = AuthenticationManager()
rooms_manager = RoomsManager()
images_manager = ImagesManager()
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


def send_image_to_client(room_id: str, image_name: str, sid: Optional[str] = None):
    image_data = images_manager.get_image_data(room_id=room_id, image_name=image_name)
    base64_data = base64.b64encode(image_data)
    # TODO: generate a real unique ID to image
    sio.emit("newImage", {"base64_data": base64_data.decode('ascii'), "id": image_name}, to=sid)


def send_all_current_images(sid: str, room_id: str):
    for image_name in images_manager.images_iterator(room_id):  # TODO: fix synchronization bug here
        send_image_to_client(room_id, image_name, sid)


@sio.on("join_room")
def client_join_room(sid, data):
    sio.enter_room(sid, data["room"])
    ChatsData.add_new_client(data["username"], data["room"])
    sio.emit("users_update", {"users": ChatsData.clients[data["room"]]}, room=data["room"])
    send_all_current_images(sid, data["room"])


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


@sio.on("img_upload")
def upload_image(sid, data):
    room = data['room']
    images_manager.add_image_to_room(room_id=room, image_name=data['image_name'], image_data=data['data'])
    send_image_to_client(room_id=data['room'], image_name=data['image_name'])  # send to all room members


@sio.on("dropImageToCanvas")
def drop_image_to_canvas(sid, data):
    room = data['room']
    sio.emit("drawImageOnCanvas", data, room=room)


def main():
    eventlet.wsgi.server(eventlet.listen(('', 5050)), app)


if __name__ == '__main__':
    main()
