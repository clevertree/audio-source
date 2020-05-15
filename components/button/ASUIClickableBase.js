import React from "react";

export default class ASUIClickableBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.onClick(e),
            onKeyDown: e => this.onKeyDown(e),
            onMouseEnter: null
        };
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

        return (
            <div
                title={this.props.title}
                className={className}
                onClick={this.cb.onClick}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                tabIndex={0}
            >
                {this.renderChildren()}
            </div>
        );
    }

    renderChildren(props={}) {
        return this.props.children;
    }

    /** User Input **/

    onClick(e) {
        console.log(e.type);
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        this.doAction(e);
    }


    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                this.doAction(e);
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    /** Actions **/

    doAction(e) {
        throw new Error("Not implemented");
    }

}
