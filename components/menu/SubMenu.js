import {Menu} from "./Menu";
// import PropTypes from 'prop-types';


class SubMenu extends Menu {

    getEventProps() {
        return Object.assign({
            onMouseEnter: this.onInputEventCallback,
        }, super.getEventProps());
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
