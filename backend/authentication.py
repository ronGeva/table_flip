from db import DB


class AuthenticationManager(object):
    AUTHENTICATION_DB = 'main_db.db'

    def __init__(self):
        self.db = DB(self.AUTHENTICATION_DB)

    def _get_creds_records(self, username, password=None):
        query = "select * from users where {username_filter} {password_filter}"
        if password is not None:
            password_filter = "and password='{password}'".format(password=password)
        else:
            password_filter = ""
        username_filter = "username='{username}'".format(username=username)
        return self.db.query(query.format(username_filter=username_filter, password_filter=password_filter))

    def check_authentication(self, username, password):
        """
        Returns True if the user exists in our database, otherwise - False
        """
        res = self._get_creds_records(username, password)
        return len(res) > 0

    def insert_new_user(self, username, password):
        assert len(self._get_creds_records(username)) == 0, 'username already exist!'
        self.db.change("insert into users values ('{username}', '{password}')".format(
            username=username, password=password))
