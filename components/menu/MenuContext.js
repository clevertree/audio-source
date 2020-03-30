import React from "react";

const unimplemented = function() { throw new Error("MenuContext Object is unimplemented")};
const MenuContext = React.createContext({
    openMenu: (options) =>                      unimplemented,
    closeMenus: (butThese=[]) =>            unimplemented,
    closeAllMenus: () =>                        unimplemented,
    isHoverEnabled: () =>                       unimplemented,
    removeDropDownMenu: (openMenuItem) =>       unimplemented,
    addDropDownMenu: (openMenuItem) =>          unimplemented,
});



// {
//     openMenu: null,
//         closeAllMenus: null,
//     openOverlay: null,
//     closeOverlay: null,
//     openMenuItems: null,
// }
export default MenuContext;
