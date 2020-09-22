import React from "react";

import ASUIInputText from "./ASUIInputText";

export default class ASUIInputTextArea extends ASUIInputText {

    render() {
        const props = this.getInputProps();
        return <textarea
            {...this.props}
            {...props}
        />;
    }

}
