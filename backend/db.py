import sqlite3
from contextlib import contextmanager


class DB(object):
    def __init__(self, db_file):
        self._db_file = db_file

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self._db_file)
        yield connection.cursor()
        connection.commit()
        connection.close()

    def query(self, query):
        with self.connect() as cursor:
            cursor.execute(query)
            return cursor.fetchall()

    def change(self, query):
        with self.connect() as cursor:
            cursor.execute(query)
