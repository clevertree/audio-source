import React from "react";
import ASUIMenuContext from "../menu/ASUIMenuContext";

export default class ASUIClickable extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
            onMouseEnter: null,
            onMouseLeave: null,
        };
    }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     return nextProps.children !== this.props.children;
    // }


    renderChildren(props={}) {
        return this.props.children;
    }

    /** User Input **/

    onMouseInput(e) {
//         console.log(e.type);
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


    /** Overlay Context **/
    static contextType = ASUIMenuContext;

    getOverlay() { return this.context.overlay; }

    closeAllDropDownMenus(e) {
        this.getOverlay().closeAllMenus(e);
    }

}
