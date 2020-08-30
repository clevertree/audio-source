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
            (this.state.open ? <ASUIContextMenu
                key="dropdown"
                // disabled={this.props.disabled}
                x={this.state.openPosition[0]}
                y={this.state.openPosition[1]}
                options={this.props.options}
                onClose={this.cb.onClose}
                // openOverlay={this.props.openOverlay}
            /> : null)
        ];
    }

    /** Actions **/

    openDropDownMenu(e) {
        if(this.props.disabled)
            return console.error("Clickable is disabled");
        const rect = e.target.getBoundingClientRect();
        console.log('ASUIClickableDropDown.openDropDownMenu', rect, e.target)
        let x = rect.right;
        let y = rect.top;
        if(this.props.vertical) {
            x = rect.left;
            y = rect.bottom;
        }
        this.setState({open: true, openPosition: [x, y]});
    }

    // stickDropDown() {
    //     this.setState({open: true, stick: true});
    // }

    closeDropDownMenu(e) {
        this.setState({open: false, openPosition: null, stick: false});
    }

    toggleMenu(e) {
        // console.log('open', this.state.open);
        if (!this.state.open)
            this.openDropDownMenu(e);
            // else if (!this.state.stick)
        //     this.stickDropDown();
        else
            this.closeDropDownMenu(e);
    }



    /** Hover **/

    hoverDropDown(e) {
        // console.log('hoverDropDown', this.state.open, this.isHoverEnabled())
        if(this.state.open === true || !this.isHoverEnabled())
            return;
        // this.getOverlay().closeAllMenus();
        this.openDropDownMenu(e);
        // setTimeout(() => {
        //     const dropdown = this.dropdown.current;
        //     dropdown && dropdown.closeAllDropDownMenusButThis();
        // }, 100);
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu(e);
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
