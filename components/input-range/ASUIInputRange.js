import React from "react";
import PropTypes from "prop-types";

import "./assets/ASUIInputRange.css";

class ASUIInputRange extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onChange: PropTypes.func.isRequired,
    };



    constructor(props = {}) {
        super(props);
        this.cb = {
            onChange: e => this.onChange(e),
            onMouseUp: e => this.onClick(e),
        };
        this.state = {
            value: this.props.value
        }
    }

    onClick(e) {
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(newValue);
        // e.preventDefault();
        // this.closeAllOpenMenus();
    }

    onChange(e) {
        // console.log(e);
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(newValue)
        this.setState({value: newValue});
    }

    render() {
        const value = this.state.value;
        let className = "asui-input-range";
        if(this.props.className)
            className += ' ' + this.props.className;
        if((value - this.props.min) / (this.props.max - this.props.min) < 0.3)
            className += ' value-right';
        return <div
            className={className}
            >
            <div
                className="value"
                children={this.props.children || value}
                />
            <input
                key="input"
                type="range"
                value={value}
                onChange={this.cb.onChange}
                onMouseUp={this.cb.onMouseUp}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
                name={this.props.name}
                title={this.props.title || "Value: " + value}
                />
        </div>;
    }


    /** Overlay Context **/
    // static contextType = ASUIContextMenuContext;
    //
    // getOverlay() { return this.context.overlay; }
    //
    // closeAllOpenMenus() {
    //     const overlay = this.getOverlay();
    //     if(overlay.getOpenMenuCount() > 0) {
    //         overlay.closeAllMenus();
    //         overlay.restoreActiveElementFocus();
    //     }
    // }


}


/** Export this script **/
export default ASUIInputRange;
