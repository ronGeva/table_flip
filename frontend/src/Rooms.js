import React from "react";


class RoomView extends React.Component {
    enterRoom() {
        this.props.goToRoomFunc(this.props.roomName);
    }

    deleteRoom() {
        this.props.deleteRoomFunc(this.props.roomName);
    }

    render() {
        return <div className="RoomView">
            <h1>Room: {this.props.roomName}</h1> <br/>
            <input type="button" value="Enter" onClick={ () => this.enterRoom() }/>
            <input type="button" value="delete" onClick={ () => this.deleteRoom() }/>
        </div>
    }
}


class Rooms extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            "newRoomName": null
        };

        this.handleRoomNameChange = this.handleRoomNameChange.bind(this);
    }


    handleRoomNameChange({ target }) {
        this.setState({
            "newRoomName": target.value
        })
    }

    render() {
        let rows = []
        for (const roomIndex in this.props.roomsProps) {
            rows.push(<RoomView key={this.props.roomsProps[roomIndex]["id"]}
                                roomName={this.props.roomsProps[roomIndex]["name"]}
                                goToRoomFunc={this.props.goToRoomFunc}
                                deleteRoomFunc={this.props.deleteRoomFunc}/>);
        }
        return <div>
            <div id="roomsDescriptionDiv">{rows}</div>
            <h2>Add a new room</h2>
            <br/>
            <h3>Room name: </h3>
            <input type="text" onChange={ this.handleRoomNameChange }/>
            <input type="button" value="add_room" onClick={() => this.props.addRoomFunc(this.state.newRoomName)} />
        </div>;
    }
}

export default Rooms;