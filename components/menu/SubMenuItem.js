import PropTypes from 'prop-types';
import MenuItem from "./MenuItem";
// import PropTypes from 'prop-types';

class SubMenuItem extends MenuItem {

    // getEventProps() {
    //     return Object.assign({
    //         onMouseEnter: this.onInputEventCallback,
    //     }, super.getEventProps());
    // }


}

export default SubMenuItem;

// creating default props
SubMenuItem.defaultProps = {
    arrow:          '►',
    vertical:       false,
    openOnHover:    true,
};

// validating prop types
SubMenuItem.propTypes = {
    options: PropTypes.any.isRequired,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
};
