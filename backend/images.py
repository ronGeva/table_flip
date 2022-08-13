from db import DB


class ImagesManager(object):
    DB_NAME = 'main_db.db'
    CREATION_QUERY = 'CREATE TABLE if not exists images ' \
                     '(room_id text, image_name text, image_data blob)'
    ADD_IMAGE_QUERY = "insert into images values ('{room_id}', '{image_name}', {data})"
    GET_IMAGE_QUERY = "SELECT * from images where room_id='{room_id}' and image_name='{image_name}'"
    GET_IMAGE_NAMES = "SELECT image_name from images where room_id='{room_id}'"

    def __init__(self):
        self._db = DB(self.DB_NAME)
        self._assert_table_exist()

    def _assert_table_exist(self):
        self._db.change(self.CREATION_QUERY)

    def add_image_to_room(self, room_id: str, image_name: str, image_data: bytes):
        hex_data = image_data.hex()
        self._db.change(self.ADD_IMAGE_QUERY.format(room_id=room_id, image_name=image_name, data="x'{}'".format(
            hex_data)))

    def get_image_data(self, room_id: str, image_name: str) -> bytes:
        res = self._db.query(self.GET_IMAGE_QUERY.format(room_id=room_id, image_name=image_name))
        assert len(res) == 1, "Expected 1 result, got {}".format(len(res))
        return res[0][2]

    def images_iterator(self, room_id: str):
        images = self._db.query(self.GET_IMAGE_NAMES.format(room_id=room_id))
        for img in images:
            yield img[0]
