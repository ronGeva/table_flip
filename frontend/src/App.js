import React from 'react';
import './App.css';
import Room from "./Room";
import Lobby from "./Lobby";
import UserStatus from "./UserStatus"
import io from 'socket.io-client';
const ENDPOINT = "http://127.0.0.1:5050";


class AuthenticationWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      password: null
    }
    this.usernameChange = this.usernameChange.bind(this);
    this.passwordChange = this.passwordChange.bind(this);
    this.authenticate = this.authenticate.bind(this);
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

  authenticate({ target }) {
    this.props.authenticationFunc(this.state, target.value);
  }

  render() {
    return <form>
      <label>
        username:
        <input type="text" name="username" onChange={ this.usernameChange }/>
        password:
        <input type="text" name="password" onChange={ this.passwordChange }/>
      </label>
      <input type="button" value="sign in" onClick={ this.authenticate }/>
      <input type="button" value="sign up" onClick={ this.authenticate }/>
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
      username: null,
      confirmedUsername: null
    }
    this.socket = io(ENDPOINT);
  }

  componentDidMount() {
    this.socket.connect();
    this.socket.on("rooms_info", (msg) => this.updateRoomsInfo(msg));
    this.socket.on("authentication_result", (msg) => this.handleAuthenticationResult(msg))
  }

  handleAuthenticationResult(msg) {
    if (msg["result"] === "ok") {
      this.setState({
        currentWindow: "rooms",
        confirmedUsername: this.state.username
      })
    }
    if (msg["result"] === "failure") {
      if ("message" in msg) {
        alert(msg["message"])
      }
      else {
        alert("Authentication failed");
      }
    }
  }

  updateRoomsInfo(roomsInfo) {
    this.setState({roomsInfo: roomsInfo});
  }

  authenticate(authenticationState, authenticationType) {
    this.socket.emit("authenticate",
        {"username": authenticationState.username, "password": authenticationState.password,
        "authenticationType": authenticationType});
    this.setState({username: authenticationState.username});
  }

  goToRoom(roomID) {
    this.setState({
      currentWindow: "chat",
      currentRoom: roomID
    })
  }

  addRoom(roomName) {
    this.socket.emit("add_room", {"room_name": roomName});
  }

  deleteRoom(roomName) {
    this.socket.emit("delete_room", {"room_name": roomName});  // TODO: make this secured (requires credentials)
  }

  resolveCurrentWindow() {
    if (this.state.currentWindow === "rooms") {
      return <Lobby roomsProps={this.state.roomsInfo} goToRoomFunc={(roomID) => this.goToRoom(roomID)}
                    addRoomFunc={(roomName) => this.addRoom(roomName)}
                    deleteRoomFunc={(roomName) => this.deleteRoom(roomName)}/>;
    }
    if (this.state.currentWindow === "chat") {
      return <Room username={this.state.username} usernameHash="unimplemented" socket={this.socket}
                   room={this.state.currentRoom} />
    }
    if (this.state.currentWindow === "authentication") {
      return <AuthenticationWindow authenticationFunc={(data, authType) => this.authenticate(data, authType)}/>;
    }
    alert("Failed resolving current window")
  }

  render() {
    return <div className="App">
      <UserStatus username={this.state.confirmedUsername}/>
      {this.resolveCurrentWindow()}
    </div>
  }
}


export default App;