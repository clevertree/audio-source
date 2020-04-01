import * as React from "react";
import PropTypes from 'prop-types';

import DropDownContainer from "../../components/menu/DropDownContainer";

import "./assets/TrackerParam.css";


class TrackerInstructionParameter extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        vertical: true
    };

    /** Property validation **/
    static propTypes = {
        options: PropTypes.any.isRequired,
        trackerInstruction: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            // onMouseInput: e => this.onMouseInput(e),
        };
    }
    render() {
        let className = "asct-parameter";
        if(this.props.className)
            className += ' ' + this.props.className;

        return <div
            // onClick={this.cb.onMouseInput}
            // onKeyDown={this.cb.onKeyDown}
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

    // onMouseInput(e) {
    //     console.log(e.type);
    //     if(e.defaultPrevented)
    //         return;
    //     e.preventDefault();
    //
    //     switch(e.type) {
    //         case 'click':
    //             if(e.button === 0)
    //                 this.selectInstruction();
    //             else if(e.button === 1)
    //                 throw new Error("Unimplemented middle button");
    //             else if(e.button === 2)
    //                 this.toggleMenu();
    //             else
    //                 throw new Error("Unknown mouse button");
    //
    //             break;
    //         default:
    //             throw new Error("Unknown Mouse event: " + e.type);
    //     }
    // }

    onContextMenu(e) {
        if(e.defaultPrevented || e.shiftKey)
            return;
        e.preventDefault();
        this.toggleMenu();
    }

    onKeyDown(e) {
//         console.log("TODO", e.key);
        switch(e.key) {
            // case 'Delete':
            //     break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     throw new Error("TODO: navigate pop");
            //
            // case 'Enter':
            //     break;
            //
            // case 'Play':
            //     break;
            //
            // case 'ArrowRight':
            //     break;
            //
            // case 'ArrowLeft':
            //     break;
            //
            // case 'ArrowDown':
            //     break;
            //
            // case 'ArrowUp':
            //     break;
            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;

            case 'ContextMenu':
                this.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
        }
    }

    onMouseEnter(e) {
        this.toggleMenu();
    }

    selectInstruction() {
        this.props.trackerInstruction.selectInstruction();
    }

}

export default TrackerInstructionParameter;

