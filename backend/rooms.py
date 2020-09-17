from threading import Lock
from db import DB


class ChatsData(object):
    rooms = {}
    sid_to_username = {}
    users_last_keepalive = {}
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
    def remove_client(sid):
        ChatsData.lock.acquire()
        ChatsData.users_last_keepalive.pop(sid)
        username = ChatsData.sid_to_username.pop(sid)

        for room in ChatsData.clients.keys():
            if username in ChatsData.clients[room]:
                ChatsData.clients[room].remove(username)
        ChatsData.lock.release()

    @staticmethod
    def get_client_rooms(client):
        return filter(lambda room: client in ChatsData.clients[room], ChatsData.clients.keys())


class RoomsManager(object):
    DB_FILE = "main_db.db"

    def __init__(self):
        self._db = DB(self.DB_FILE)

    def get_all_rooms(self):
        return [line[0] for line in self._db.query("select name from rooms")]

    def add_room(self, room_name):
        rooms = self.get_all_rooms()
        assert room_name not in rooms, 'Can\'t add a room which already exists!'
        self._db.change("insert into rooms values ('{name}')".format(name=room_name))

    def delete_room(self, room_name):
        rooms = self.get_all_rooms()
        assert room_name in rooms, 'Can\'t delete a room which doesn\'t exist!'
        self._db.change("delete from rooms where name='{name}'".format(name=room_name))
