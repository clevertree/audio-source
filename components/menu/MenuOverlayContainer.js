import React from "react";
import Div from "../div/Div";

import "./assets/MenuOverlayContainer.css";
import MenuContext from "./MenuContext";


class MenuOverlayContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.openMenuHandler = (e, options) => this.openDropDownMenu(e, options);
        this.closeMenuHandler = (e) => this.closeDropDownMenu(e);
    }
    // componentDidMount() {
    //     SubMenuItem.addGlobalSubMenuHandler(this.openMenuHandler)
    // }
    //
    // componentWillUnmount() {
    //     SubMenuItem.removeGlobalSubMenuHandler(this.openMenuHandler)
    // }

    render() {
        let content = <>{this.props.children}</>;

        if(this.state.open)
            content = <>
                <Div className="asui-menu-overlay-container"
                     onClick={e => this.closeDropDownMenu(e)}
                >
                </Div>
                <Div className="asui-menu-overlay-dropdown">
                    {typeof this.state.options === "function" ? this.state.options(this) : this.state.options}
                </Div>
                {content}
            </>;

        return <MenuContext.Provider
            value={{
                // parent: this,
                openMenuHandler: this.openMenuHandler,
                closeMenuHandler: this.closeMenuHandler
            }}>
            {content}
        </MenuContext.Provider>;
    }

    closeDropDownMenu(e) {
        this.setState({
            open: false,
            options: null
        })
    }

    openDropDownMenu(e, options) {
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


        // MenuItem.addCloseMenuCallback(e => this.close(e));

        // setTimeout(() => this.setState({open: true}), 1000);
        // this.menu.current.openDropDownMenu(e, options);
        return true;
    }
}

export default MenuOverlayContainer;
