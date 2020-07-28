import React from 'react';
import './App.css';
import Chat from "./Chat";
import io from 'socket.io-client';
const ENDPOINT = "http://127.0.0.1:5050";


class App extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io(ENDPOINT);
  }

  render() {
    return <div className="App">
      <Chat username="sample_user" usernameHash="unimplemented" socket={this.socket}/>
    </div>
  }
}


export default App;