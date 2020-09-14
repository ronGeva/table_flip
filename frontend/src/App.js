import React from 'react';
import './App.css';
import Chat from "./Chat";
import Rooms from "./Rooms";
import io from 'socket.io-client';
const ENDPOINT = "http://127.0.0.1:5050";


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      roomsInfo : [],
      currentWindow: "rooms",
      currentRoom: null
    }
    this.rooms = <Rooms roomsProps={this.state.roomsInfo} goToRoomFunc={this.goToRoom}/>
    this.socket = io(ENDPOINT);
  }

  componentDidMount() {
    this.socket.connect();
    this.socket.on("rooms_info", (msg) => this.updateRoomsInfo(msg));
  }

  updateRoomsInfo(roomsInfo) {
    this.setState({roomsInfo: roomsInfo});
  }

  goToRoom(roomID) {
    this.setState({
      currentWindow: "chat",
      currentRoom: roomID
    })
  }

  resolveCurrentWindow() {
    if (this.state.currentWindow === "rooms") {
      return <Rooms roomsProps={this.state.roomsInfo} goToRoomFunc={() => this.goToRoom()}/>;
    }
    if (this.state.currentWindow === "chat") {
      return <Chat username="sample_user" usernameHash="unimplemented" socket={this.socket}
                   room={this.state.currentRoom} />
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