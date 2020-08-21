import React from "react";

import ASUIMenuOptionListBase from "./ASUIMenuOptionListBase";

import "./ASUIMenuOptionList.css";

export default class ASUIMenuOptionList extends ASUIMenuOptionListBase {

    constructor(props) {
        super(props);
        this.cb.onWheel = e => this.onWheel(e)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);

        let forceUpdate = prevProps.options !== this.props.options;
        if(this.props.floating !== false)
            this.updateScreenPosition(forceUpdate);

        // if(this.state.optionArray)
        //     this.focus(); // Dangerous

        // this.updateOverlay();
    }

    // componentWillUnmount() {
    //     super.componentWillUnmount();
    //     this.updateOverlay();
    // }

    // componentDidMount() {
    //     super.componentDidMount();
    // }

    renderContent() {
        let optionArray = this.getFilteredOptions();

        let className = 'asui-menu-option-list';
        if (this.props.vertical)
            className += ' vertical';
        const style = {};
        if(this.props.floating !== false) {
            className += ' floating';
            if (this.props.x || this.props.y) {
                if (typeof this.props.x !== "undefined") {
                    if(this.state.overflowRight)
                        style.right = '0';
                    else
                        style.left = this.props.x;
                }
                if (typeof this.props.y !== "undefined") {
                    if(this.state.overflowBottom)
                        style.bottom = '0';
                    else
                        style.top = this.props.y;
                }
            }
        }

        const positionSelected = this.state.positionSelected;

        return <div
            style={style}
            className={className}
            onWheel={this.cb.onWheel}
            children={optionArray.map((option, i) => {
                return <div
                    key={i}
                    className={option.props.position === positionSelected ? 'selected' : null}
                    children={option}
                />
            })}
            tabIndex={0}
            onKeyDown={this.cb.onKeyDown}
            ref={this.ref.container}
        />;
    }

    /** Actions **/

    updateScreenPosition(forceUpdate=false) {
        if(!this.ref.container.current)
            return;
        const div = this.ref.container.current;
        const rect = div.getBoundingClientRect();
        // console.log(rect, this.props.clientPosition);
        if(forceUpdate || (!this.state.overflowRight && rect.right > window.innerWidth))
            this.setState({overflowRight: rect.right > window.innerWidth})
        if(forceUpdate || (!this.state.overflowBottom && rect.bottom > window.innerHeight))
            this.setState({overflowBottom: rect.bottom > window.innerHeight})
        // console.log(rect.right, window.innerWidth, rect.bottom, window.innerHeight)
    }


    focus() {
        if(this.ref.container.current)
            this.ref.container.current.focus({ preventScroll: true });
        else
            console.warn('this.divRef.current was ', this.ref.container.current);
    }


    /** Menu Overlay **/

    // updateOverlay() {
    //     const overlay = this.getOverlay();
    //     if(!overlay)
    //         return;
    //
    //     const isOpen = overlay.getOpenMenuCount() > 0;
    //     // const isOpen = this.getOverlayContainerElm().querySelectorAll('.asui-dropdown-container').length > 0;
    //     // console.log('isOpen', isOpen, overlay.openMenus);
    //     overlay.toggleOverlay(isOpen);
    // }




}


