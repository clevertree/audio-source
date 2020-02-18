import React from "react";

import "./assets/Footer.css";
import Div from "../../components/div/Div";

class Footer extends React.Component {
    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = this.props.composer.state;
    }


    setStatus(newStatus) {
        this.setState({status: newStatus});
    }

    setError(errorStatus) {
        this.setState({status: <Div className="error">{errorStatus}</Div>});
    }

    render() {
        return (
            <div key="footer" className="asc-footer-container">
                <div className="asc-status-text">{this.state.status}</div>
                <div className="asc-version-text">{this.state.version}</div>
            </div>
        );

    }
}


/** Export this script **/
export default Footer;

