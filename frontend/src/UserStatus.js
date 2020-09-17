import React from 'react';


class UserStatus extends React.Component {
    getStatus() {
        if (this.props.username === null) {
            return "You haven't signed in yet!";
        }
        return "Welcome, " + this.props.username;
    }

    render() {
        return <div id="userStatus">
            <h2>{this.getStatus()}</h2><br/>
        </div>
    }
}

export default UserStatus;