import React from "react";


class ImageDialog extends React.Component {
    constructor(props) {
        super(props);
    }

    dragImage(event) {

    }

    render() {
        return (
            <ul>
                {this.props.images.map((value, index) => {
                    return <li key={index}>{value}</li>
                })}
            </ul>
            )
    }
}

export default ImageDialog;