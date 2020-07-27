import React from 'react';
import './App.css';
import Chat from "./Chat";

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className="App">
      <Chat communicationPipe="unimplemented"></Chat>
    </div>
  }
}


export default App;