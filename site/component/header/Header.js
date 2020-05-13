import * as React from "react";

import "./Header.css"

export default class Header extends React.Component {
    render() {
        return <h1 className="aspage-header" {...this.props} />;
    }
}



