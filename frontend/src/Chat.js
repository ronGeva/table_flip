import React from 'react';
import './Chat.css'


class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            chatInputValue: "",
            chatBox: "This is the chatbox\n"
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput({ target }) {
        this.setState({
            chatBox: this.state.chatBox + this.state.chatInputValue  + "\n"
        })
    }

    handleChange({ target }) {
        this.setState({ chatInputValue: target.value });
    }

    render() {
        return <div className="chatDiv border">
            Chat window
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
