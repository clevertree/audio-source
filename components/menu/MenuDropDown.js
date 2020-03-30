import React from "react";
import MenuOverlayContext from "./MenuOverlayContext";
import PropTypes from "prop-types";

import "./assets/Menu.css";
import DropDownContainer from "./DropDownContainer";

export default class MenuDropDown extends React.Component {
    constructor(props) {
        super(props);

        this.cb = {
            onClick: (e) => this.onClick(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseEnter: e => this.onMouseEnter(e),
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
                onClick={this.cb.onClick}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                tabIndex={0}
                >
                {this.props.children}
                {arrow ? <div className="arrow">{arrow}</div> : null}
                <DropDownContainer
                    ref={this.dropdown}
                    options={this.props.options}
                    vertical={this.props.vertical}
                    />
            </div>
        )
    }

    toggleMenu(e) {
        return this.dropdown.current.toggleMenu(e); }
    openMenu(e) {
        return this.dropdown.current.openMenu(e);
    }
    closeMenu(e) { return this.dropdown.current.closeMenu(e); }
    stickMenu(e) { return this.dropdown.current.stickMenu(e); }

    onClick(e) {
        this.toggleMenu(e);
    }

    onKeyDown(e) {
        this.toggleMenu(e);
    }

    onMouseEnter(e) {
            this.openMenu(e);
    }

}




// creating default props
MenuDropDown.defaultProps = {
    arrow:          true,
    vertical:       false,
    // openOnHover:    null,
    // disabled:       false,
};

// validating prop types
MenuDropDown.propTypes = {
    options: PropTypes.any.isRequired,
};

