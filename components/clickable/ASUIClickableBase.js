import React from "react";
import ASUIDropDownContext from "../dropdown/context/ASUIDropDownContext";
import PropTypes from "prop-types";

export default class ASUIClickable extends React.Component {
    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
            onMouseEnter: null,
            onMouseLeave: null,
        };
        this.ref = {
            container: React.createRef()
        }
    }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     return nextProps.children !== this.props.children;
    // }

    componentDidMount() {
        // this.getOverlay().addTabIndexItem(this);
    }
    componentWillUnmount() {
        // this.getOverlay().removeTabIndexItem(this);
    }

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
                e.preventDefault();
                this.doAction(e);
                break;

            case 'Tab':
                e.preventDefault();
                const tabIndexItem = this.getOverlay().getNextTabIndexItem(this, 1);
                console.log('TODO tabIndexItem', tabIndexItem);
                break;

            // case 'ArrowLeft':
            // case 'ArrowUp':
            // case 'ArrowDown':
            // case 'ArrowRight':
            //     console.info("Unhandled key: ", e.key);
            //     e.preventDefault();
            //     break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    /** Actions **/

    async doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.");
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = await this.props.onAction(e, this);
        if (result !== false)
            this.closeAllOpenMenus();
    }


    /** Overlay Context **/
    static contextType = ASUIDropDownContext;

    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }
    getParentDropdown() { return this.context.parentDropDown; }

    closeAllOpenMenus() {
        const overlay = this.getOverlay();
        if(overlay.getOpenMenuCount() > 0) {
            overlay.closeAllMenus();
            overlay.restoreActiveElementFocus();
        }
    }


}
