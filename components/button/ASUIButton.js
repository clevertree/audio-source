import React from "react";
import PropTypes from 'prop-types';

import ASUIMenuContext from "../menu/ASUIMenuContext";
import ASUIButtonBase from "./ASUIButtonBase.native";

export default class ASUIButton extends ASUIButtonBase {
    /** Context **/
    static contextType = ASUIMenuContext;

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };


    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    getOverlay() { return this.context.overlay; }



    /** Actions **/

    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = this.props.onAction(e, this);
        if (result !== false)
            this.closeAllDropDownMenus();
    }


}

