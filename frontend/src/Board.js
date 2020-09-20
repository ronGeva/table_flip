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

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    handleMouseDown(event) {
        if (!this.state.isMouseDown) {
            console.log(event.clientX, event.clientY);
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

    draw(prev_x, prev_y, x, y, canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        console.log(rect.height, rect.width, rect.right, rect.bottom);
        console.log(prev_x, prev_y, x, y);
        let ctx = canvasElement.getContext("2d")
        ctx.moveTo(prev_x, prev_y);
        ctx.lineTo(x, y);
        ctx.stroke();

        /*
        ctx.moveTo(0, 0);
        ctx.lineTo(50, 120);
        ctx.stroke(); */
    }

    calcDistance(prev_x, prev_y, x, y) {
        return 100;
        return Math.sqrt(Math.pow(Math.abs(y - prev_y), 2) + Math.pow(Math.abs(x - prev_x), 2));
    }

    handleMouseMove(event) {
        let new_x = parseInt(event.clientX);
        let new_y = parseInt(event.clientY);
        if (this.state.isMouseDown &&
            this.calcDistance(this.state.lastX, this.state.lastY, new_x, new_y) > 5) {
            this.draw(this.state.lastX, this.state.lastY, new_x, new_y, event.target);
            this.setState({
                lastX: new_x,
                lastY: new_y
            });
        }
    }

    render() {
        return  <canvas id="boardCanvas" onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp} onMouseMove={this.handleMouseMove}
                        width={window.innerWidth * 0.69} height={window.innerHeight * 0.69}/>
    }
}

export default Board;