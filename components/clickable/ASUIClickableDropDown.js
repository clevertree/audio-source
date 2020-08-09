import React from "react";
import PropTypes from "prop-types";

import ASUIClickable from "./ASUIClickable";
import ASUIContextMenu from "../menu/context/ASUIContextMenu";

import "./ASUIClickable.css";

export default class ASUIClickableDropDown extends ASUIClickable {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
        // openOverlay:    false
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };


    constructor(props) {
        super(props);

            // onKeyDown: (e) => this.onKeyDown(e),
        // this.cb.onMouseLeave = e => this.onMouseLeave(e);
        this.cb.onClose = () => this.closeDropDownMenu();
        this.dropdown = React.createRef();
        this.state = {
            open: false,
            stick: false
        }

    }


    getClassName() {
        return 'asui-clickable dropdown';
    }

    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
            (this.state.open && !this.props.disabled ? <ASUIContextMenu
                key="dropdown"
                // disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
                onClose={this.cb.onClose}
                // openOverlay={this.props.openOverlay}
            /> : null)
        ];
    }

    /** Actions **/

    openDropDownMenu(onUpdated=null) {
        // console.log('ASUIClickableDropDown.openDropDownMenu')
        this.setState({open: true, stick: false}, onUpdated);
    }

    // stickDropDown() {
    //     this.setState({open: true, stick: true});
    // }

    closeDropDownMenu(onUpdated=null) {
        this.setState({open: false, stick: false}, onUpdated);
    }

    toggleMenu() {
        if (!this.state.open)
            this.openDropDownMenu();
            // else if (!this.state.stick)
        //     this.stickDropDown();
        else
            this.closeDropDownMenu();
    }



    /** Hover **/

    hoverDropDown() {
        // console.log('hoverDropDown', this.state.open === true, !this.isHoverEnabled())
        if(this.state.open === true || !this.isHoverEnabled())
            return;
        // this.getOverlay().closeAllMenus();
        this.openDropDownMenu( () => {
            this.closeAllDropDownElmsButThis();
        });
        // setTimeout(() => {
        //     const dropdown = this.dropdown.current;
        //     dropdown && dropdown.closeAllDropDownMenusButThis();
        // }, 100);
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu();
    }



    // onMouseLeave(e) {
    //     clearTimeout(this.timeoutMouseLeave);
    //     // this.closeDropDownMenu();
    //     // this.timeoutMouseLeave = setTimeout(() => this.closeDropDownMenu(), 100);
    // }



    // onKeyDown(e) {
    //     if(e.isDefaultPrevented())
    //         return;
    //     switch(e.key) {
    //         case ' ':
    //         case 'Enter':
    //             this.toggleMenu();
    //             break;
    //
    //         default:
    //             console.info("Unhandled key: ", e.key);
    //             break;
    //     }
    // }


}
