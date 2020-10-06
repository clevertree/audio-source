import React from "react";

const unimplemented = function() { throw new Error("ProgramContext Object is unimplemented")};
const ASUIGlobalContext = React.createContext({
    addLogEntry: (text, type) =>            unimplemented,
    getKey: (key) =>                        unimplemented,
    setKey: (key, open=true) =>     unimplemented,
});

export default ASUIGlobalContext;

