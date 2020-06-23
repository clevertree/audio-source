import * as React from "react";

export default class DropDownOptionProcessor {

    static processArray(options) {
        let optionArray = [];
        recursiveMap(options, option => {
            optionArray.push(option);
        })
        return optionArray;
    }
}

function recursiveMap(children, fn) {
    return React.Children.map(children, child => {
        if (!React.isValidElement(child)) {
            return child;
        }

        if (child.props.children) {
            child = React.cloneElement(child, {
                children: recursiveMap(child.props.children, fn)
            });
        }

        return fn(child);
    });
}
