import {Menu} from "./Menu";


class SubMenu extends Menu {
    constructor(props) {
        super(props);
        this.state.open = false;
    }


    toggleMenu() {
        if(!this.state.open) {
            this.setState({open: true});

        } else {
            const stick = !this.state.stick;
            this.setState({stick, open:stick});
        }
    }

    closeMenu(e) {
        if(this.state.open !== false) {
            this.setState({open: false});
        }
    }

    openMenu(e) {
        if(this.state.open !== true) {
            this.setState({open: true});
            this.doMenuAction(e)
        }
        // await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
        // this.closeAllMenusButThis();
    }

    getEventProps() {
        return Object.assign({
            onMouseLeave: this.onInputEventCallback,
            onMouseEnter: this.onInputEventCallback,
        }, super.getEventProps());
    }

    onInputEvent(e) {
        // console.log(e.type, e);

        switch (e.type) {

            case 'mouseenter':
            case 'mouseover':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    this.openMenu();
                }, 100);
                break;

            case 'mouseleave':
            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    if (!this.state.stick) {
                        this.closeMenu();
                    }
                }, 400);
                break;

            default:
                super.onInputEvent(e);

        }
    }

}

export default SubMenu;
