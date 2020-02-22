import React from "react";
import PropTypes from 'prop-types';
import Button from "./Button";
import {SubMenu} from "../menu";

class SubMenuButton extends React.Component {
    constructor(props) {
        super(props);
        this.refMenu = React.createRef();
    }
    render() {
        return (
            <Button onAction={e => this.refMenu.current.toggleMenu(e)}>
                <SubMenu
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
SubMenuButton.defaultProps = {
    arrow: '▼',
    // vertical: true,
    // openOnHover: false,
    // disabled: false,
};

/** Validate props **/
SubMenuButton.propTypes = {
    options: PropTypes.any.isRequired,
    // onAction: PropTypes.func.isRequired,
};


export default SubMenuButton;
