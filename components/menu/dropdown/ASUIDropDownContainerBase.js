import React from "react";
import PropTypes from "prop-types";

import ASUIMenuContext from "../ASUIMenuContext";
import ASUIClickable from "../../clickable/ASUIClickable";
import ASUIMenuDropDown from "../../menu/item/ASUIMenuDropDown";
import ASUIMenuItem from "../../menu/item/ASUIMenuItem";

import "./ASUIDropDownContainer.css";
import DropDownOptionProcessor from "./DropDownOptionProcessor";

export default class ASUIDropDownContainerBase extends React.Component {

    /** Menu Context **/
    static contextType = ASUIMenuContext;
    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }
    /** @return {ASUIDropDownContainer} **/
    getParentDropdown() { return this.context.parentDropDown; }


    // Default Props
    static defaultProps = {
        vertical:       false,
    };

    // Props Validation
    static propTypes = {
        onClose: PropTypes.func.isRequired,
        vertical: PropTypes.bool,
        disabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.state = {
            optionArray: null,
            positionSelected: this.props.positionSelected || null
        }
        this.ref = {
            container: React.createRef(),
            options: []
        }
        this.cb = {
            onKeyDown: e => this.onKeyDown(e)
        }
    }


    componentDidMount() {
        // console.log('ASUIDropDownContainer.componentDidMount')

        const overlay = this.getOverlay();
        overlay.addCloseMenuCallback(this, this.props.onClose);

        this.openMenu(this.props.options);

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // console.log('ASUIDropDownContainer.componentDidUpdate', prevState, this.state)
        if(prevProps.options !== this.props.options)
            this.setOptions(this.props.options);
    }

    componentWillUnmount() {
        this.getOverlay().removeCloseMenuCallback(this);
    }



    render() {
        return <ASUIMenuContext.Provider
            value={{overlay:this.getOverlay(), parentDropDown:this}}>
            {this.renderDropDownContainer()}
        </ASUIMenuContext.Provider>

    }


    /** Actions **/

    focus() {
        throw new Error("Not Implemented");
    }


    closeDropDownMenu() {
        this.props.onClose()
    }

    openMenu(options) {
        const overlay = this.getOverlay();
        // TODO: defer all to overlay if exists?

        // Try context menu open handler
        const res = this.props.skipOverlay ? false : overlay.openMenu(options);
        if (res !== false) {
            this.closeDropDownMenu();
            // console.info("Sub-menu options were sent to menu handler: ", this.getOverlay().openMenu);

        } else {
            // console.info("Sub-menu options rendered locally", options);

            // Process and render dropdown options locally
            this.setOptions(options);
        }
    }

    async setOptions(options) {
        if (typeof options === "function")
            options = options(this);
        if(options instanceof Promise) {
            this.setState({optionArray: [<ASUIMenuItem>Loading...</ASUIMenuItem>]})
            options = await options;
        }
        if (!options)
            console.warn("Empty options returned by ", this);


        let optionArray = DropDownOptionProcessor.processArray(options);
        let positionSelected = this.state.positionSelected, currentPosition = 0;
        optionArray = optionArray
            .filter(option => option.type !== React.Fragment)
            .map((option, i) => {

            if(positionSelected === null && option.props.selected)
                positionSelected = currentPosition;

            const props = {
                key: i,
            }
            if(option.type.prototype instanceof ASUIClickable) {
                props.position = currentPosition;
                this.ref.options[currentPosition] = React.createRef();
                props.ref = this.ref.options[currentPosition];
                currentPosition++;

            }

            return React.cloneElement(option, props);
        });


        this.setState({
            optionArray,
            positionSelected: positionSelected || null,
            positionCount: currentPosition
        })
    }

    /** Input **/

    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        e.stopPropagation();
        e.preventDefault();

        let positionSelected = this.state.positionSelected;
        if(positionSelected === null)
            positionSelected = -1;
        const optionRef = this.ref.options[positionSelected] ? this.ref.options[positionSelected].current : null;
        // console.info("onKeyDown", e.key, e.target, this.state.positionSelected, optionRef);
        switch(e.key) {

            case 'ArrowUp':
                positionSelected -= 1;
                if(positionSelected < 0)
                    positionSelected = this.state.positionCount-1;
                this.setState({positionSelected})
                break;

            case 'ArrowDown':
                positionSelected += 1;
                if(positionSelected >= this.state.positionCount)
                    positionSelected = 0;
                this.setState({positionSelected})
                break;

            case 'ArrowRight':
                if(optionRef instanceof ASUIMenuDropDown) {
                    optionRef.openDropDownMenu();
                } else {
                    console.warn("No action for ", e.key);
                }
                // optionRef.openDropDownMenu()
                break;

            case 'Escape':
            case 'ArrowLeft':
                const parentRef = this.getParentDropdown();
                this.closeDropDownMenu();
                if(parentRef)
                    parentRef.focus();
                else
                    this.getOverlay().restoreActiveElementFocus();

                break;

            case '':
            case 'Enter':
                if(optionRef instanceof ASUIClickable) {
                    optionRef.doAction(e);
                } else {
                    console.warn("No action for ", e.key);
                }
                // optionRef.openDropDownMenu()
                break;

            default:
                console.info("Unhandled key: ", e.key, e.target);
                break;
        }
    }


}
