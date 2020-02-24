import React from "react";
// import PropTypes from 'prop-types';

import "./assets/Menu.css";

class MenuOverlayContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.open,
            options: null
        }
    }

    // Open menu in portrait mode
    openMenu(e, options) {
        console.log('openMenu', e, options);
        this.setState({
            open: true,
            options
        })

        // TODO: return close callback
    }

    render() {
        if(!this.state.open)
            return this.props.children;
        return [
            <div className="asui-menu-dropdown">
                {this.state.options}
            </div>,
            this.props.children,
        ]
    }
}


/** Export this script **/
export default MenuOverlayContainer;
