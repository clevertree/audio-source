import React from "react";

const unimplemented = function() { throw new Error("ASUILogContext Object is unimplemented")};
const ASUILogContext = React.createContext({
    addLogEntry: (text, type) =>                      unimplemented,
});

export default ASUILogContext;
