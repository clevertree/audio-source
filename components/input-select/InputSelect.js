import Div from "../div/Div";
import Menu from "../menu/Menu";
import React from "react";

import "./assets/InputSelect.scss";

class InputSelect extends React.Component {
    /** @deprecated **/
    constructor(props = {}) {
        super(props);
    }
    //
    // get value() { return this.state.value; }
    // set value(newValue) { this.setValue(newValue); }
    //
    // async setValue(value, title=null) {
    //     this.state.title = title;
    //     this.state.value = value;
    //     if(title === null) {
    //         await this.resolveOptions(this.getChildren());
    //         if(this.state.title === null)
    //             console.warn('Title not found for value: ', value);
    //     }
    //     if(this.parentNode)
    //         this.forceUpdate();
    // }

    async open() {
        await this.menu.open();
    }


    /** @override **/
    render() {
        let className = 'asui-input-select';
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <Div className={className}>
                <Menu
                    openOnHover={!!this.props.openOnHover}
                    arrow={!!this.props.arrow}
                    vertical={true}
                    options={this.props.options}
                    title={this.props.title}
                    ref={ref => this.menu = ref}
                    >{this.props.children}</Menu>
            </Div>
        );
    }

}


/** Export this script **/
export default InputSelect;
