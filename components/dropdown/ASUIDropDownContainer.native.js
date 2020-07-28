import React from "react";
import {View} from "react-native";

import ASUIDropDownContext from "../ASUIDropDownContext";
import ASUIDropDownContainerBase from "./ASUIDropDownContainerBase";

export default class ASUIDropDownContainer extends ASUIDropDownContainerBase {

    renderDropDownContainer() {
        const optionArray = this.state.optionArray;
        return <ASUIDropDownContext.Provider
            value={{overlay:this.getOverlay(), parentDropDown:this}}>
            <View
                children={optionArray}
                ref={this.ref.container}
                />
        </ASUIDropDownContext.Provider>

    }


}
