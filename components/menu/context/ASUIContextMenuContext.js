import React from "react";

const unimplemented = function() { throw new Error("MenuContext Object is unimplemented")};
const ASUIContextMenuContext = React.createContext({
    overlay: {
        openContextMenu: (options) =>               unimplemented,
    },
    parentMenu: null
});

export default ASUIContextMenuContext;
