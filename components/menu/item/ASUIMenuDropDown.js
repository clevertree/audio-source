import React from "react";
import PropTypes from "prop-types";

import "../style/ASUIMenu.css";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";
import ASUIClickableBase from "../../button/ASUIClickableBase";

export default class ASUIMenuDropDown extends ASUIClickableBase {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };


    constructor(props) {
        super(props);

            // onKeyDown: (e) => this.onKeyDown(e),
        this.cb.onMouseEnter = e => this.onMouseEnter(e);
        this.dropdown = React.createRef();
    }


    getClassName() { return 'asui-menu-item action'; }

    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
            <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
            />
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


    /** Actions **/

    doAction(e) {
        this.toggleMenu();
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }
    hoverMenu()     { return this.dropdown.current.hoverMenu(); }

    /** User Input **/

    onMouseEnter(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        this.hoverMenu();
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


    /** Overlay Context **/

    closeAllDropDownMenus()     { return this.dropdown.current.closeAllDropDownMenus(); }

}
