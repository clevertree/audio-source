import React from "react";

import ASUIDropDownContainerBase from "./ASUIDropDownContainerBase";
import "./ASUIDropDownContainer.css";


// TODO: dropdown menus should be rendered in overlay, not within clickable

export default class ASUIDropDownContainer extends ASUIDropDownContainerBase {

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
        this.updateScreenPosition();
    }
    componentWillUnmount() {
        this.getOverlay().removeCloseMenuCallback(this);
        return super.componentWillUnmount();
    }

    componentDidMount() {
        super.componentDidMount();
        const optionArray = this.state.optionArray;
        if(optionArray)
            this.focus();
    }

    renderDropDownContainer() {
        const optionArray = this.state.optionArray;
        if(!optionArray)
            return null;

        let className = 'asui-menu-dropdown';
        if (this.props.vertical)
            className += ' vertical';
        const style = {};
        if(this.props.clientPosition) {
            style.position = 'fixed';
            style.left = this.props.clientPosition[0];
            style.top = this.props.clientPosition[1];
        } else if (this.props.position) {
            style.position = this.props.position;
        }

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
            ref={this.divRef}
        />;
    }

    updateScreenPosition() {
        if(!this.divRef.current)
            return;
        const div = this.divRef.current;
        const rect = div.getBoundingClientRect();
        // console.log(rect, this.props.clientPosition);
        if(rect.right > window.innerWidth)
            div.classList.add('overflow-right');
        if(rect.bottom > window.innerHeight)
            div.classList.add('overflow-bottom');
        // console.log(rect.right, window.innerWidth, rect.bottom, window.innerHeight)
    }

    /** Actions **/

    focus() {
        if(this.divRef.current)
            this.divRef.current.focus();
        else
            console.warn('this.divRef.current was ', this.divRef.current);
    }
}


