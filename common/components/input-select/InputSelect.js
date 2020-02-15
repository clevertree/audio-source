import Div from "../div/Div";
import Menu from "../menu/Menu";

class InputSelect extends Div {
    constructor(props) {
        super(props);
        // this.setValue(defaultValue, valueTitle);
        // this.actionCallback = actionCallback;
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

    getOption(value, title=null, props={}) {
        if(value === this.state.value && title !== null && this.state.title === null)
            this.state.title = title;
        title = title || value;
        return Menu.createElement(props, title, null, async e => {
            this.setValue(value, title);
            await this.onChange(e);
        });
    }

    getOptGroup(title, content, props={}) {
        return Menu.createElement(props, title, content);
    }


    /** @override **/
    render() {
        return this.menu = Menu.createElement({vertical: true}, this.state.title, this.getChildren());
    }

    static createInputSelect(props, optionContent, actionCallback, defaultValue = null, valueTitle=null) {
        return this.createElement(props, null, {
            optionContent: () => optionContent(this),            // TODO: , () => optionContent(this)
            actionCallback,
            defaultValue,
            valueTitle,
        });
    }
}


/** Export this script **/
export default InputSelect;
