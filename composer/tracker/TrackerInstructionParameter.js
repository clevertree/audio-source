import * as React from "react";
import PropTypes from 'prop-types';

import DropDownContainer from "../../components/menu/DropDownContainer";

import "./assets/TrackerParam.css";


class TrackerInstructionParameter extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        options: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {

            onContextMenu: (e) => this.onContextMenu(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
    }
    render() {
        let className = "asct-parameter";
        if(this.props.className)
            className += ' ' + this.props.className;

        return <div
            onClick={this.cb.onMouseInput}
            onKeyDown={this.cb.onKeyDown}
            onContextMenu={this.cb.onContextMenu}
            className={className}
            tabIndex={0}
        >
            {this.props.children}
            <DropDownContainer
                ref={this.dropdown}
                options={this.props.options}
                vertical={this.props.vertical}
                />
        </div>;
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }


    /** User Input **/

    onMouseInput(e) {
        console.log(e.type);
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        switch(e.type) {
            case 'click':
                if(e.button === 0)
                    this.select();
                else if(e.button === 1)
                    throw new Error("Unimplemented middle button");
                else if(e.button === 2)
                    this.toggleMenu();
                else
                    throw new Error("Unknown mouse button");

                break;
            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }

    onContextMenu(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        this.toggleMenu();
    }

    onKeyDown(e) {
        this.toggleMenu();
    }

    onMouseEnter(e) {
        this.toggleMenu();
    }

}

export default TrackerInstructionParameter;

