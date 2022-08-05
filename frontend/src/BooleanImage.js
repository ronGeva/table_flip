import React from "react";

/*
* This class represents an image that holds a boolean value.
* When clicked the boolean value held by the image object will be flipped.
* In addition, this value could potentially be changed by an external factor (for example by the containing element).
* */
class BooleanImage extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <div>
                <img className="boardButton" src={this.props.source} alt="a button"/>
            </div>
        );
    }
}