import React from "react";

const unimplemented = function() { throw new Error("MenuContext Object is unimplemented")};
const ASUIDropDownContext = React.createContext({
    openMenu: (options) =>                      unimplemented,
    closeMenus: (butThese=[]) =>           unimplemented,
    closeAllMenus: () =>                        unimplemented,
    isHoverEnabled: () =>                       unimplemented,
    removeDropDownMenu: (openMenuItem) =>       unimplemented,
    addDropDownMenu: (openMenuItem) =>          unimplemented,
});

export default ASUIDropDownContext;
