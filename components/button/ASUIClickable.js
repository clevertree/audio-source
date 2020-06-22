import React from "react";
import ASUIClickableBase from "./ASUIClickableBase";

export default class ASUIClickable extends ASUIClickableBase {

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

        return (
            <div
                title={this.props.title}
                className={className}
                onClick={this.cb.onMouseInput}
                // onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                onMouseLeave={this.cb.onMouseLeave}
                tabIndex={0}
                ref={this.ref.container}
            >
                {this.renderChildren()}
            </div>
        );
    }

    renderChildren(props={}) {
        return this.props.children;
    }

}
