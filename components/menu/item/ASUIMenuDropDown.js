import React from "react";
import PropTypes from "prop-types";

import "../style/ASUIMenu.css";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";
import ASUIClickable from "../../button/ASUIClickable";

export default class ASUIMenuDropDown extends ASUIClickable {

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
        this.cb.onMouseEnter = e => this.onMouseEnter(e);
        this.cb.onMouseLeave = e => this.onMouseLeave(e);
        this.cb.onClose = () => this.closeDropDown();
        this.dropdown = React.createRef();
        this.state = {
            open: false,
            stick: false
        }

        this.timeoutMouseLeave = null;
    }


    getClassName() {
        return 'asui-menu-item action'
            + (this.props.disabled ? ' disabled' : '')
            + (this.state.open ? ' open' : '');
    }

    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
            (this.state.open ? <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                // disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
                onClose={this.cb.onClose}
                // openOverlay={this.props.openOverlay}
            /> : null)
        ];
    }

    // render() {
    //     let className = this.getClassName(); // 'asui-menu-item';
    //     if(this.props.className)
    //         className += ' ' + this.props.className;
    //     if(this.props.disabled)
    //         className += ' disabled';
    //     if(this.props.selected)
    //         className += ' selected';
    //
    //     let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
    //     return (
    //         <div
    //             title={this.props.title}
    //             className={className}
    //             onMouseEnter={this.cb.onMouseInput}
    //             onClick={this.cb.onMouseInput}
    //             onKeyDown={this.cb.onKeyDown}
    //             tabIndex={0}
    //         >
    //             {this.props.children}
    //             {arrow ? <div className="arrow">{arrow}</div> : null}
    //             <ASUIDropDownContainer
    //                 ref={this.dropdown}
    //                 disabled={this.props.disabled}
    //                 options={this.props.options}
    //                 vertical={this.props.vertical}
    //             />
    //         </div>
    //     )
    // }

    /** Drop Down Menu **/

    openDropDown() {
        this.setState({open: true, stick: false});
    }

    stickDropDown() {
        this.setState({open: true, stick: true});
    }

    closeDropDown() {
        this.setState({open: false, stick: false}, () => {
            this.getOverlay().updateOverlay();
        });
    }


    toggleMenu() {
        if (!this.state.open)
            this.openDropDown();
        // else if (!this.state.stick)
        //     this.stickDropDown();
        else
            this.closeDropDown();
    }

    hoverDropDown() {
        if(this.state.open === true || !this.getOverlay() || !this.getOverlay().isHoverEnabled())
            return;
        // this.getOverlay().closeAllMenus();
        this.openDropDown();
        setTimeout(() => {
            const dropdown = this.dropdown.current;
            dropdown && dropdown.closeAllDropDownMenusButThis();
        }, 100);
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu();
    }



    /** User Input **/

    onMouseEnter(e) {
        clearTimeout(this.timeoutMouseLeave);
        this.hoverDropDown();
    }

    onMouseLeave(e) {
        clearTimeout(this.timeoutMouseLeave);
        this.timeoutMouseLeave = setTimeout(() => this.closeDropDown(), 1500);
    }



    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                this.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }


}
