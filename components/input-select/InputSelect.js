import Div from "../div/Div";
import Menu from "../menu/Menu";
import React from "react";

import "./assets/InputSelect.scss";

class InputSelect extends React.Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            value: props.value
        }
    }

    get value() { return this.state.value; }
    set value(newValue) { this.setValue(newValue); }

    async setValue(value, title=null) {
        this.state.title = title;
        this.state.value = value;
        if(title === null) {
            await this.resolveOptions(this.getChildren());
            if(this.state.title === null)
                console.warn('Title not found for value: ', value);
        }
        if(this.parentNode)
            this.forceUpdate();
    }

    async onChange(e) {
        await this.actionCallback(e, this.state.value, this.state.title);
    }

    async resolveOptions(content) {
        await this.eachContent(content, async (menu) => {
            if(menu instanceof Menu && menu.props.children)
                await this.resolveOptions(menu.props.children);
        });
    }

    async open() {
        await this.menu.open();
    }


    /** @override **/
    render() {
        return (
            <Div className="asui-input-select">
                <Menu
                    arrow={true}
                    vertical={true}
                    options={this.props.options}
                    title={this.props.title}
                    ref={ref => this.menu = ref}
                    >{this.state.value}</Menu>
            </Div>
        );
    }

}


/** Export this script **/
export default InputSelect;
