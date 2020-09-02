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

        if(this.props.floating !== false)
            this.updateScreenPosition();

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
                    style.left = this.props.x;
                }
                if (typeof this.props.y !== "undefined") {
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

    updateScreenPosition() {
        if(!this.ref.container.current)
            return;
        const div = this.ref.container.current;
        div.classList.remove('overflow-right', 'overflow-bottom');
        const rect = div.getBoundingClientRect();
        div.classList.toggle('overflow-right', rect.right > window.innerWidth);
        div.classList.toggle('overflow-bottom', rect.bottom > window.innerHeight);
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


