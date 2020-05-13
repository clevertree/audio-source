import * as React from "react";

import "./Paragraph.css"

export default class Paragraph extends React.Component {
    render() {
        return <p className="aspage-paragraph" {...this.props} />;
    }
}



