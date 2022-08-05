import React from "react";
import './Room.css'
import './Board.css'

const BOARD_PEN_ID = "boardPen";
const BOARD_ERASER_ID = "boardEraser";
const BOARD_CLEAR_ID = "boardClear";

let DEFAULT_BUTTON_SOURCES = {}
DEFAULT_BUTTON_SOURCES[BOARD_PEN_ID] = "pen.png"
DEFAULT_BUTTON_SOURCES[BOARD_ERASER_ID] = "eraser.png"
DEFAULT_BUTTON_SOURCES[BOARD_CLEAR_ID] = "clear.png"

const CLICKED_BUTTON_SOURCES = {};
CLICKED_BUTTON_SOURCES[BOARD_PEN_ID] = "pen_chosen.png";
CLICKED_BUTTON_SOURCES[BOARD_ERASER_ID] = "eraser_chosen.png";

const DEFAULT_PEN_COLOR = '#000000';
const DEFAULT_ERASER_COLOR = '#ffffff';
const DEFAULT_PEN_WIDTH = 1;
const DEFAULT_ERASER_WIDTH = 5;

class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isMouseDown : false,
            lastX: null,
            lastY: null,
            clickedButton : null,
            buttonImages: {...DEFAULT_BUTTON_SOURCES},
            penAttributes: {
                color: DEFAULT_PEN_COLOR,
                width: DEFAULT_PEN_WIDTH,
            },
        };

        this.boardRef = React.createRef();
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.buttonClick = this.buttonClick.bind(this);
        this.onChangeWidth = this.onChangeWidth.bind(this);
    }

    componentDidMount() {
        console.log("Binding draw message to draw function...")
        this.props.socket.on("draw", (msg) => this.draw(msg));
        this.props.socket.on("clear", (msg) => this.clearBoard());
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
        this.props.socket.emit("draw", {"prev_x": prev_x, "prev_y": prev_y, "x": x, "y": y, "room": this.props.room,
                                        "penAttributes": this.state.penAttributes});
    }

    draw(msg) {
        console.log("Got draw message!");
        const prev_x = msg["prev_x"];
        const prev_y = msg["prev_y"];
        const x = msg["x"];
        const y = msg["y"];
        const color = msg["penAttributes"].color;
        let ctx = this.boardRef.current.getContext("2d")
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = msg["penAttributes"].width;
        ctx.moveTo(prev_x, prev_y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    calcDistance(prev_x, prev_y, x, y) {
        return Math.sqrt(Math.pow(Math.abs(y - prev_y), 2) + Math.pow(Math.abs(x - prev_x), 2));
    }

    penMouseMoveHandle(event) {
        let new_x = parseInt(event.clientX);
        let new_y = parseInt(event.clientY);
        if (this.state.isMouseDown &&
            this.calcDistance(this.state.lastX, this.state.lastY, new_x, new_y) > 5) {
            this.sendDrawMessage(this.state.lastX, this.state.lastY, new_x, new_y)
            this.setState({
                lastX: new_x,
                lastY: new_y
            });
        }
    }

    handleMouseMove(event) {
        switch (this.state.clickedButton) {
            case BOARD_PEN_ID:
            case BOARD_ERASER_ID:
                // Eraser and pen draws are handled exactly the same except eraser always has the color white.
                this.penMouseMoveHandle(event);
                break;
            case null:
                console.log("Reached default case, button is yet to be chosen");
                break;
            default:
                console.error("Something has gone wrong, contact the devs!");
        }
    }

    unclickOtherButtons(clickedButtonId) {
        let buttonImages = this.state.buttonImages;
        for (const [buttonID, _] of Object.entries(buttonImages)) {
            if (buttonID !== clickedButtonId) {
                console.log("Changing " + buttonID + " to " + DEFAULT_BUTTON_SOURCES[buttonID]);
                buttonImages[buttonID] = DEFAULT_BUTTON_SOURCES[buttonID];
            }
        }
        this.setState(buttonImages);
    }

    /*
    * Set the clicked button as the "pressed down button" and "unclick" all other buttons by reverting them to their
    * default sources.
    */
    setMarkedButton(clickedElementID) {
        this.unclickOtherButtons(clickedElementID);

        let buttonImages = this.state.buttonImages;
        buttonImages[clickedElementID] = CLICKED_BUTTON_SOURCES[clickedElementID];

        this.setState(buttonImages);
        this.setState({"clickedButton": clickedElementID} );
    }

    /*
    * Sends a message to all the guests in the room indicating the clients to clear the board.
    * */
    sendClearBoardMessage() {
        this.props.socket.emit("clear", {"room": this.props.room});
    }

    clearBoard() {
        let ctx = this.boardRef.current.getContext('2d');
        ctx.clearRect(0, 0, this.boardRef.current.width, this.boardRef.current.height);
    }

    buttonClick(event) {
        const clickedElementID = event.currentTarget.id;

        // Handle other edge-cases we need to figure out
        let penAttribtues = this.state.penAttributes;
        switch(clickedElementID) {
            case BOARD_PEN_ID:
                penAttribtues.color = DEFAULT_PEN_COLOR;
                penAttribtues.width = DEFAULT_PEN_WIDTH;
                this.setMarkedButton(clickedElementID);
                break;
            case BOARD_ERASER_ID:
                penAttribtues.color = DEFAULT_ERASER_COLOR;
                penAttribtues.width = DEFAULT_ERASER_WIDTH;
                this.setMarkedButton(clickedElementID);
                break;
            case BOARD_CLEAR_ID:
                this.sendClearBoardMessage();
                break;
            default:
                break;
        }
        this.setState(penAttribtues);
    }

    onChangeWidth(event) {
        let penAttributes = this.state.penAttributes;
        penAttributes.width = event.target.value;
        this.setState(penAttributes);
    }

    render() {
        return  <div>
                    <p> <canvas id="boardCanvas" onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp} onMouseMove={this.handleMouseMove}
                        width={window.innerWidth * 0.69} height={window.innerHeight * 0.69}
                        ref={this.boardRef}/>
                    </p>
                    <div id="boardIndex">
                        <img className="boardButton" id={BOARD_PEN_ID} src={this.state.buttonImages.boardPen}
                             alt="pen" onClick={this.buttonClick}/>
                        <img className="boardButton" id={BOARD_ERASER_ID} src={this.state.buttonImages.boardEraser}
                             alt="eraser" onClick={this.buttonClick}/>
                        <img className="boardButton" id={BOARD_CLEAR_ID} src={this.state.buttonImages.boardClear}
                             alt="clear" onClick={this.buttonClick}/>
                        <input className="boardButton" id="penWidthInput" type="range" min="1" max="100"
                               value={this.state.penAttributes.width} onChange={this.onChangeWidth}/>
                    </div>
                </div>

    }
}

export default Board;