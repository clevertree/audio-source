import React from "react";
import {View} from "react-native";

import ASUIMenuContext from "../ASUIMenuContext";
import ASUIDropDownContainerBase from "./ASUIDropDownContainerBase";

export default class ASUIDropDownContainer extends ASUIDropDownContainerBase {

    renderDropDownContainer() {
        const optionArray = this.state.optionArray;
        return <ASUIMenuContext.Provider
            value={{overlay:this.getOverlay(), parentDropDown:this}}>
            <View
                children={optionArray}
                ref={this.divRef}
                />
        </ASUIMenuContext.Provider>

    }


}
