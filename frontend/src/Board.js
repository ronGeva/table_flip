import React from "react";
import './Room.css'


class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isMouseDown : false,
            lastX: null,
            lastY: null
        };

        this.boardRef = React.createRef();
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    componentDidMount() {
        console.log("Binding draw message to draw function...")
        this.props.socket.on("draw", (msg) => this.draw(msg));
    }

    handleMouseDown(event) {
        if (!this.state.isMouseDown) {
            this.setState({
                isMouseDown: true,
                lastX: parseInt(event.clientX),
                lastY: parseInt(event.clientY)
            });
        }
    }

    handleMouseUp(event) {
        if (this.state.isMouseDown) {
            this.setState({
                isMouseDown: false
            });
        }
    }

    sendDrawMessage(prev_x, prev_y, x, y) {
        this.props.socket.emit("draw", {"prev_x": prev_x, "prev_y": prev_y, "x": x, "y": y, "room": this.props.room});
    }

    draw(msg) {
        console.log("Got draw message!");
        const prev_x = msg["prev_x"];
        const prev_y = msg["prev_y"];
        const x = msg["x"];
        const y = msg["y"];
        let ctx = this.boardRef.current.getContext("2d")
        ctx.moveTo(prev_x, prev_y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    calcDistance(prev_x, prev_y, x, y) {
        return Math.sqrt(Math.pow(Math.abs(y - prev_y), 2) + Math.pow(Math.abs(x - prev_x), 2));
    }

    handleMouseMove(event) {
        let new_x = parseInt(event.clientX);
        let new_y = parseInt(event.clientY);
        if (this.state.isMouseDown &&
            this.calcDistance(this.state.lastX, this.state.lastY, new_x, new_y) > 5) {
            //this.draw(this.state.lastX, this.state.lastY, new_x, new_y, event.target);
            this.sendDrawMessage(this.state.lastX, this.state.lastY, new_x, new_y)
            this.setState({
                lastX: new_x,
                lastY: new_y
            });
        }
    }

    render() {
        return  <canvas id="boardCanvas" onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp} onMouseMove={this.handleMouseMove}
                        width={window.innerWidth * 0.69} height={window.innerHeight * 0.69}
                        ref={this.boardRef}/>
    }
}

export default Board;