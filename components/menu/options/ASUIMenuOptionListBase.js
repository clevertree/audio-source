import React from "react";
import PropTypes from "prop-types";

import ASUIContextMenuContext from "../context/ASUIContextMenuContext";
import ASUIClickable from "../../clickable/ASUIClickable";
import ASUIMenuDropDown from "../dropdown/ASUIMenuDropDown";
import ASUIMenuItem from "../item/ASUIMenuItem";

import MenuOptionProcessor from "./MenuOptionProcessor";
import "./ASUIMenuOptionList.css";
import ASUIMenuBreak from "../break/ASUIMenuBreak";
import ASUIMenuAction from "../action/ASUIMenuAction";

export default class ASUIMenuOptionListBase extends React.Component {

    /** Menu Context **/
    static contextType = ASUIContextMenuContext;

    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }

    /** @return {ASUIMenuOptionList} **/
    getParentMenu() { return this.props.parentMenu || this.context.parentMenu; }


    // Default Props
    static defaultProps = {
        vertical:       false,
    };

    // Props Validation
    static propTypes = {
        options: PropTypes.any.isRequired,
        onClose: PropTypes.func.isRequired,
        vertical: PropTypes.bool,
        disabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.state = {
            offset: 0,
            limit: 25,
            optionArray: null,
            positionSelected: this.props.positionSelected || null
        }
        this.ref = {
            container: React.createRef(),
            options: []
        }
        this.cb = {
            onKeyDown: e => this.onKeyDown(e),
        }
        // console.log(`${this.constructor.name}.constructor`, props);
    }


    componentDidMount() {
        // console.log(`${this.constructor.name}.componentDidMount`);

        this.setOptions(this.props.options);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // console.log('ASUIMenuOptionList.componentDidUpdate', this.state, prevProps.options !== this.props.options);
        if(prevProps.options !== this.props.options) {
            // console.log(`${this.constructor.name}.componentDidUpdate`, prevProps.options, this.props.options)
            this.setOptions(this.props.options);
        }
    }

    // componentWillUnmount() {
    //     this.getOverlay().removeCloseMenuCallback(this);
    // }

    renderContent() {
        throw new Error("Not Implemented");
    }

    render() {
        return <ASUIContextMenuContext.Provider
            value={{overlay: this.getOverlay(), parentMenu: this}}>
            {this.renderContent()}
        </ASUIContextMenuContext.Provider>
    }

    // render() {
    //     return <ASUIContextMenuContext.Provider
    //         value={{overlay:this.getOverlay(), parentDropDown:this}}>
    //         {this.renderDropDownContainer()}
    //     </ASUIContextMenuContext.Provider>
    //
    // }

    getFilteredOptions() {
        let optionArray = this.state.optionArray;
        if(!optionArray || optionArray.length === 0)
            return [];
        if(optionArray.length < this.state.limit)
            return optionArray;
        if(this.state.offset > 0) {
            optionArray = optionArray.slice(this.state.offset);
            optionArray.unshift(<ASUIMenuBreak />)
            optionArray.unshift(<ASUIMenuAction
                onAction={() => {
                    this.setOffset(this.state.offset - this.state.limit);
                    return false;
                }}
            >... Previous ...</ASUIMenuAction>)
        }
        if(optionArray.length > this.state.limit) {
            optionArray = optionArray.slice(0, this.state.limit);
            optionArray.push(<ASUIMenuBreak />)
            optionArray.push(<ASUIMenuAction
                onAction={() => {
                    this.setOffset(this.state.offset + this.state.limit)
                    return false;
                }}
            >... Next ...</ASUIMenuAction>)
        }
        return optionArray;
    }


    /** Actions **/

    focus() {
        throw new Error("Not Implemented");
    }


    closeDropDownMenu() {
        this.props.onClose();
    }

    async setOptions(options) {
        if (typeof options === "function")
            options = options(this);
        if(options instanceof Promise) {
            this.setState({optionArray: [<ASUIMenuItem>Loading...</ASUIMenuItem>]})
            options = await options;
        }
        if (!options) {
            console.warn("Empty options returned by ", this);
            options = [<ASUIMenuItem>No Options</ASUIMenuItem>];
        }


        let optionArray = MenuOptionProcessor.processArray(options);
        let positionSelected = this.state.positionSelected, currentPosition = 0;
        optionArray = optionArray
            .filter(option => option.type !== React.Fragment)
            .map((option, i) => {

            // if(positionSelected === null && option.props.selected)
            //     positionSelected = currentPosition;

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

    setOffset(offset) {
        if(offset < 0)
            offset = 0;
        this.setState({offset})

    }

    /** Input **/

    onWheel(e) {
        // e.preventDefault();
        let offset = parseInt(this.state.offset) || 0;
        offset += e.deltaY > 0 ? 1 : -1;
        this.setOffset(offset);
    }

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
