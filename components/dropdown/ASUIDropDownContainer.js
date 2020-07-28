import React from "react";

import ASUIDropDownContainerBase from "./ASUIDropDownContainerBase";
import "./ASUIDropDownContainer.css";


export default class ASUIDropDownContainer extends ASUIDropDownContainerBase {

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
        if(this.props.floating !== false)
            this.updateScreenPosition();

        // if(this.state.optionArray)
        //     this.focus(); // Dangerous

        this.updateOverlay();
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.updateOverlay();
    }

    // componentDidMount() {
    //     super.componentDidMount();
    // }

    renderDropDownContainer() {
        const optionArray = this.state.optionArray;
        if(!optionArray)
            return null;

        let className = 'asui-dropdown-container';
        if (this.props.vertical)
            className += ' vertical';
        const style = {};
        if(this.props.clientPosition) {
            style.position = 'fixed';
            style.left = this.props.clientPosition[0];
            style.top = this.props.clientPosition[1];
        }
        if(this.props.floating !== false)
            className += ' floating';

        const positionSelected = this.state.positionSelected;

        return <div
            style={style}
            className={className}
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
        const rect = div.getBoundingClientRect();
        // console.log(rect, this.props.clientPosition);
        if(rect.right > window.innerWidth)
            div.classList.add('overflow-right');
        if(rect.bottom > window.innerHeight)
            div.classList.add('overflow-bottom');
        // console.log(rect.right, window.innerWidth, rect.bottom, window.innerHeight)
    }


    focus() {
        if(this.ref.container.current)
            this.ref.container.current.focus({ preventScroll: true });
        else
            console.warn('this.divRef.current was ', this.ref.container.current);
    }


    /** Menu Overlay **/

    updateOverlay() {
        const overlay = this.getOverlay();
        if(!overlay)
            return;

        const isOpen = overlay.getOpenMenuCount() > 0;
        // const isOpen = this.getOverlayContainerElm().querySelectorAll('.asui-dropdown-container').length > 0;
        // console.log('isOpen', isOpen, overlay.openMenus);
        overlay.toggleOverlay(isOpen);
    }




}


