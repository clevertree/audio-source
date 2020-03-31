import React from "react";
import PropTypes from "prop-types";

import "./assets/Menu.css";
import DropDownContainer from "./DropDownContainer";

export default class MenuDropDown extends React.Component {
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

        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
        this.dropdown = React.createRef();
    }


    getClassName() { return 'asui-menu-item'; }

    render() {
        let className = this.getClassName(); // 'asui-menu-item';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';

        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return (
            <div
                className={className}
                onClick={this.cb.onMouseInput}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseInput}
                tabIndex={0}
                >
                {this.props.children}
                {arrow ? <div className="arrow">{arrow}</div> : null}
                <DropDownContainer
                    ref={this.dropdown}
                    disabled={this.props.disabled}
                    options={this.props.options}
                    vertical={this.props.vertical}
                    />
            </div>
        )
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }
    hoverMenu()     { return this.dropdown.current.hoverMenu(); }

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        switch(e.type) {
            case 'click':
                this.toggleMenu();
                break;

            case 'mouseenter':
            case 'mouseover':
                this.hoverMenu();
                break;

            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }

    onKeyDown(e) {
        this.toggleMenu();
    }

    onMouseEnter(e) {
        this.toggleMenu();
    }

}
