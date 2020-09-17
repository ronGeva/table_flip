import React from 'react';
import './App.css';
import Chat from "./Chat";
import Rooms from "./Rooms";
import io from 'socket.io-client';
const ENDPOINT = "http://127.0.0.1:5050";


class AuthenticationWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      password: null,
      authenticationType: null
    }
    this.usernameChange = this.usernameChange.bind(this);
    this.passwordChange = this.passwordChange.bind(this);
    this.authenticate = this.authenticate.bind(this);
    this.signUp = this.signUp.bind(this);
  }

  usernameChange({ target }) {
    this.setState({
      username: target.value
    });
  }

  passwordChange({ target }) {
    this.setState({
      password: target.value
    });
  }

  authenticate() {
    this.setState({
      authentication: "sign in"
    });
    this.props.authenticationFunc(this.state);
  }

  signUp() {
    this.setState({
      authentication: "sign up"
    });
    this.props.authenticationFunc(this.state);
  }

  render() {
    return <form>
      <label>
        username:
        <input type="text" name="username" onChange={ this.usernameChange }/>
        username:
        <input type="text" name="password" onChange={ this.passwordChange }/>
      </label>
      <input type="button" value="sign in" onClick={ this.authenticate }/>
      <input type="button" value="sign up" onClick={ this.signUp }/>
    </form>
  }
}


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      roomsInfo : [],
      currentWindow: "authentication",
      currentRoom: null,
      username: null
    }
    this.socket = io(ENDPOINT);
  }

  componentDidMount() {
    this.socket.connect({'sync disconnect on unload': true});
    this.socket.on("rooms_info", (msg) => this.updateRoomsInfo(msg));
    this.socket.on("authentication_result", (msg) => this.handleAuthenticationResult(msg))
  }

  handleAuthenticationResult(msg) {
    if (msg["result"] === "ok") {
      this.setState({
        currentWindow: "rooms"
      })
    }
  }

  updateRoomsInfo(roomsInfo) {
    this.setState({roomsInfo: roomsInfo});
  }

  authenticate(authenticationState) {
    this.socket.emit("authenticate",
        {"username": authenticationState.username, "password": authenticationState.password,
        "authenticationType": authenticationState.authentication});
    this.setState({username: authenticationState.username});
  }

  goToRoom(roomID) {
    this.setState({
      currentWindow: "chat",
      currentRoom: roomID
    })
  }

  resolveCurrentWindow() {
    if (this.state.currentWindow === "rooms") {
      return <Rooms roomsProps={this.state.roomsInfo} goToRoomFunc={(roomID) => this.goToRoom(roomID)}/>;
    }
    if (this.state.currentWindow === "chat") {
      return <Chat username={this.state.username} usernameHash="unimplemented" socket={this.socket}
                   room={this.state.currentRoom} />
    }
    if (this.state.currentWindow === "authentication") {
      return <AuthenticationWindow authenticationFunc={(data) => this.authenticate(data)}/>;
    }
    alert("Failed resolving current window")
  }

  render() {
    return <div className="App">
      {this.resolveCurrentWindow()}
    </div>
  }
}


export default App;