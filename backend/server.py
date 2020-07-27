from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)
message_history = ""


@app.route('/index', methods=['GET'])
def main_page():
    return "Hello world"


@app.route('/message_post', methods=['POST'])
def answer_message():
    global message_history
    data_json = json.loads(request.data)
    message_history += data_json["message"] + "\n"
    return {"response": message_history}


def main():
    app.run("localhost", 5050, debug=True)


if __name__ == '__main__':
    main()