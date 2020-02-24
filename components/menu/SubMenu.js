import {Menu} from "./Menu";
import PropTypes from 'prop-types';


class SubMenu extends Menu {
    constructor(props) {
        super(props);
    }


    toggleMenu() {
        if(!this.state.open) {
            this.setState({open: true});

        } else {
            const stick = !this.state.stick;
            this.setState({stick, open:stick});
        }
    }

    openMenu(e, options) {
        console.log(e.type);
        this.setState({
            open: true,
            stick: e && e.type === 'click' ? !this.state.stick : this.state.stick,
            options
        })
    }

    getEventProps() {
        return Object.assign({
            onMouseLeave: this.onInputEventCallback,
            onMouseEnter: this.onInputEventCallback,
        }, super.getEventProps());
    }

    onInputEvent(e) {
        // console.log(e.type, e);
        // const persistEvent = {
        //     clientX: e.clientX,
        //     clientY: e.clientY,
        //     target: e.target,
        // };

        switch (e.type) {

            case 'mouseenter':
            case 'mouseover':
                clearTimeout(this.mouseTimeout);
                if(this.state.open !== true) {
                    this.mouseTimeout = setTimeout(te => {
                        this.setState({open: true});
                        this.doMenuAction(e)
                    }, 100);
                }
                break;

            case 'mouseleave':
            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(te => {
                    if (!this.state.stick && this.state.open) {
                        this.setState({open: false});
                    }
                }, 400);
                break;

            default:
                super.onInputEvent(e);

        }
    }

}

export default SubMenu;

// creating default props
SubMenu.defaultProps = {
    arrow:          '►',
    vertical:       false,
};

// validating prop types
SubMenu.propTypes = Menu.propTypes;
