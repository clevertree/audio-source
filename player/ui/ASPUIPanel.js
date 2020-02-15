import React from "react";

class ASPUIPanel extends React.Component {

    render() {

        return (
            <div className="aspui-panel">
                <div className="title">{this.props.title}</div>
                {this.props.children}
            </div>
        )
    }
}
/** Export this script **/
export default ASPUIPanel;
