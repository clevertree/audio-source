import React from "react";

import "./ASUIDropDownContainer.css";
import ASUIDropDownContainerBase from "./ASUIDropDownContainerBase";

export default class ASUIDropDownContainer extends ASUIDropDownContainerBase {

    componentDidUpdate(prevProps, prevState, snapshot) {
        // super.componentDidUpdate(prevProps, prevState, snapshot);
        this.updateScreenPosition();
    }
    componentWillUnmount() {
        this.getOverlay().removeCloseMenuCallback(this);
    }

    renderDropDownContainer(options) {
        let className = 'asui-menu-dropdown';
        if (this.props.vertical)
            className += ' vertical';
        return <div
            className={className}
            children={options}
            ref={this.divRef}
        />;
    }

    updateScreenPosition() {
        if(!this.divRef.current)
            return;
        const div = this.divRef.current;
        const rect = div.getBoundingClientRect();
        if(rect.right > window.innerWidth)
            div.classList.add('overflow-right');
        if(rect.bottom > window.innerHeight)
            div.classList.add('overflow-bottom');
        // console.log(rect.right, window.innerWidth, rect.bottom, window.innerHeight)
    }
}


