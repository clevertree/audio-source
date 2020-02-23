import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
import '../button/assets/Button.css';

class SubMenuDropDown extends React.Component {

    constructor(props = {}) {
        super(props);
        this.state = {
            open: props.open || false,
        };
        this.onInputEventCallback = e => this.onInputEvent(e);
    }


    render() {
        let className = 'asui-menu-dropdown';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.vertical)
            className += ' vertical';

        let mouseProps = {
            onMouseLeave: this.onInputEventCallback,
            onMouseEnter: this.onInputEventCallback
        };

        let children = this.state.open ? this.props.options : null;
        if(typeof children === "function")
            children = children(this);

        // console.log('subMenuChildren', subMenuChildren);
        return <div className={className} children={children} {...mouseProps}/>;
    }



    closeDropDown() {
        if(this.state.open !== false)
            this.setState({open: false});
    }

    openDropDown() {
        if(this.state.open !== true)
            this.setState({open: true});
            // await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
        // this.closeAllSubMenusButThis();
    }

    onInputEvent(e) {
        console.log(e.type, this);

        switch (e.type) {
            case 'mouseenter':
            case 'mouseover':
                clearTimeout(this.mouseTimeout); // TODO: prevent closing on re-entry
                if(this.props.openOnHover !== false) {
                    this.mouseTimeout = setTimeout(e => {
                        this.openDropDown();
                    }, 100);
                }
                break;

            case 'mouseleave':
            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    if(!this.state.stick) {
                        this.closeDropDown();
                    }
                }, 400);
                break;

            case 'keydown':

                let keyEvent = e.key;
                switch (keyEvent) {
                    case 'Escape':
                    case 'Backspace':
                        this.closeDropDown(e);
                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        if(!this.props.vertical)
                            this.openDropDown();
                        this.selectNextTabItem(e);
                        break;

                    case 'ArrowLeft':
                        if(!this.props.vertical)
                            this.closeDropDown(e);
                        this.selectPreviousTabItem(e);
                        break;

                    case 'ArrowDown':
                        if(this.props.vertical)
                            this.openDropDown();
                        this.selectNextTabItem(e);
                        break;

                    case 'ArrowUp':
                        if(this.props.vertical)
                            this.closeDropDown(e);
                        this.selectPreviousTabItem(e);
                        break;

                    default:
                        console.log("Unknown key input: ", keyEvent);
                        break;

                }
                break;

            default:
                console.warn("Unknown input event: ", e.type);
                break;
        }
    }
}


/** Default props **/
SubMenuDropDown.defaultProps = {
    vertical:       false,
};

/** Validate props **/
SubMenuDropDown.propTypes = {
    vertical: PropTypes.bool,
};




/** Export this script **/
export {
    SubMenuDropDown as default,
};
