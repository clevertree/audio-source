import React from 'react';


/** Icon **/
class ASUIIcon extends React.Component {
    constructor(props = {}) {
        super(props, {});
    }

    render() {
        let className = "asui-icon";
        if(this.props.className) {
            className += ' ' + this.props.className;
        }
        return <div className={className}/>;
    }

}

export default ASUIIcon;
