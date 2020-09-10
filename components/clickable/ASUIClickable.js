import React from "react";
import ASUIClickableBase from "./ASUIClickableBase";
import "./ASUIClickable.css";

export default class ASUIClickable extends ASUIClickableBase {

    constructor(props) {
        super(props);
        this.cb.onMouseEnter = e => this.onMouseEnter(e);
        this.timeoutMouseLeave = null;
    }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     return nextProps.children !== this.props.children;
    // }

    getClassName() { return 'asui-clickable'; }

    render() {
        // console.log(this.constructor.name + '.render()', this.props);
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';
        if(this.props.loading)
            className += ' loading';
        if(this.props.large)
            className += ' large';
        if(this.state && this.state.open)
            className += ' open';

        return (
            <div
                title={this.props.title}
                className={className}
                onClick={this.cb.onMouseInput}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                onMouseLeave={this.cb.onMouseLeave}
                // tabIndex={0}
                ref={this.ref.container}
            >
                {this.renderChildren()}
            </div>
        );
    }

    renderChildren(props={}) {
        return this.props.children;
    }

    /** User Input **/

    onMouseEnter(e) {
        // const button = e.button;
        clearTimeout(this.timeoutMouseLeave);
        this.hoverDropDown(e);
    }

}
