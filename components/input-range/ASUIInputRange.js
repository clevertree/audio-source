import React from "react";
import "./assets/ASUIInputRange.scss";
import PropTypes from "prop-types";
import ASUIDropDownContext from "../dropdown/context/ASUIDropDownContext";

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
    }

    onClick(e) {
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(newValue);
        // e.preventDefault();
        this.closeAllOpenMenus();
    }

    onChange(e) {
        // console.log(e);
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(newValue)
        // this.setState({value: newValue});
    }

    render() {
        let className = "asui-input-range";
        if(this.props.className)
            className += ' ' + this.props.className;
        return (
            <input
                className={className}
                type="range"
                value={this.props.value}
                onChange={this.cb.onChange}
                onMouseUp={this.cb.onMouseUp}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
                name={this.props.name}
                title={this.props.title}
                />
        )
    }


    /** Overlay Context **/
    static contextType = ASUIDropDownContext;

    getOverlay() { return this.context.overlay; }

    closeAllOpenMenus() {
        const overlay = this.getOverlay();
        if(overlay.getOpenMenuCount() > 0) {
            overlay.closeAllMenus();
            overlay.restoreActiveElementFocus();
        }
    }


}


/** Export this script **/
export default ASUIInputRange;
