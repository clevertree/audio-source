import React from "react";
import PropTypes from 'prop-types';
import Button from "./Button";
import {Menu} from "../menu";

class MenuButton extends React.Component {
    constructor(props) {
        super(props);
        this.refMenu = React.createRef();
    }
    render() {
        return (
            <Button onAction={e => this.refMenu.current.toggleMenu(e)}>
                <Menu
                    arrow={this.props.arrow}
                    vertical={true}
                    openOnHover={false}
                    ref={this.refMenu}
                    options={this.props.options}
                    children={this.props.children}
                />
            </Button>
        );
    }
}

/** Default props **/
MenuButton.defaultProps = {
    arrow: '▼',
    // vertical: true,
    // openOnHover: false,
    // disabled: false,
};

/** Validate props **/
MenuButton.propTypes = {
    options: PropTypes.any.isRequired,
    // onAction: PropTypes.func.isRequired,
};


export default MenuButton;
