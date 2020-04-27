import React from "react";

const unimplemented = function() { throw new Error("MenuContext Object is unimplemented")};
const ASUIMenuContext = React.createContext({
    openMenu: (options) =>                      unimplemented,
    closeMenus: (butThese=[]) =>            unimplemented,
    closeAllMenus: () =>                        unimplemented,
    isHoverEnabled: () =>                       unimplemented,
    removeDropDownMenu: (openMenuItem) =>       unimplemented,
    addDropDownMenu: (openMenuItem) =>          unimplemented,
});

export default ASUIMenuContext;
