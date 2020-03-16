import React from "react";
import {SubMenuItem} from "./index";
import {Icon} from "../index";
import Div from "../div/Div";

import "./assets/MenuOverlayContainer.css";

class MenuOverlayContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.openMenuHandler = (e, options) => this.openMenu(e, options);
        this.onInputEventCallback = e => this.onInputEvent(e);
    }

    componentDidMount() {
        SubMenuItem.addGlobalSubMenuHandler(this.openMenuHandler)
    }

    componentWillUnmount() {
        SubMenuItem.removeGlobalSubMenuHandler(this.openMenuHandler)
    }

    render() {
        if(!this.state.open)
            return this.props.children;
        return <>
            <Div className="asui-menu-overlay-container"
                 onClick={e => this.close()}
                >
            </Div>
            <Div className="asui-menu-overlay-dropdown">
                {typeof this.state.options === "function" ? this.state.options(this) : this.state.options}
            </Div>
            {this.props.children}
        </>;
    }

    close(e) {
        this.setState({
            open: false,
            options: null
        })
    }

    openMenu(e, options) {
        if(!this.props.isActive)
            return false;

        switch(e.type) {
            case 'click':
                break;
            case 'mouseenter':
                // Prevent mouse-over opening the menu here
                return;
            default:
                throw new Error("Unknown menu event: " + e.type);
        }
        this.setState({
            open: true,
            options
        });
        // setTimeout(() => this.setState({open: true}), 1000);
        // this.menu.current.openDropDownMenu(e, options);
        return true;
    }
}

export default MenuOverlayContainer;
