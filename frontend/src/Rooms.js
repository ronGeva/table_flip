import React from "react";


class RoomView extends React.Component {
    enterRoom() {
        this.props.goToRoomFunc(this.props.roomName);
    }

    render() {
        return <div className="RoomView">
            <h1>Room: {this.props.roomName}</h1> <br/>
            <input type="button" value="Enter" onClick={ () => this.enterRoom() }/>
        </div>
    }
}


class Rooms extends React.Component {
    render() {
        let rows = []
        for (const roomIndex in this.props.roomsProps) {
            rows.push(<RoomView key={this.props.roomsProps[roomIndex]["id"]}
                                roomName={this.props.roomsProps[roomIndex]["name"]}
                                goToRoomFunc={this.props.goToRoomFunc}/>);
        }
        return <div>{rows}</div>;
    }
}

export default Rooms;