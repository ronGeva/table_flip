import React from 'react';
import './Chat.css'

class ChatDetails extends React.Component {
    render() {
        return <div id="chatTitle">
            <h1>{this.props.roomName}</h1>
            <br/>
            <h2>Users in room: {this.props.users.toString()}</h2>
        </div>
    }
}

class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            chatInputValue: "",
            chatBox: "This is the chatbox\n",
            users: []
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.props.socket.on("new_message", (msg) => this.receive_new_data(msg));
        this.props.socket.emit("join_room", {"room": this.props.room, "username": this.props.username});
        this.props.socket.on("users_update", (msg) => this.update_room_users(msg))
    }

    update_room_users(msg) {
        this.setState({
            users: msg["users"]
        });
    }

    receive_new_data(msg) {
        this.setState({
            chatBox: this.state.chatBox + msg
        })
    }

    handleInput({ target }) {
        this.props.socket.emit("send_message", {"message": this.state.chatInputValue, "username": this.props.username, "room": this.props.room});
    }

    handleChange({ target }) {
        this.setState({ chatInputValue: target.value });
    }

    render() {
        return <div className="chatDiv border">
            <ChatDetails roomName={this.props.room} users={this.state.users}> </ChatDetails>
            <br/>
            <textarea disabled id="chatBox" value={ this.state.chatBox }>
            </textarea>
            <form>
                <label>
                    message:
                    <input type="text" name="name" onChange={ this.handleChange }/>
                </label>
                <input type="button" value="send" onClick={ this.handleInput }/>
            </form>
        </div>;
    }
}

export default Chat;
