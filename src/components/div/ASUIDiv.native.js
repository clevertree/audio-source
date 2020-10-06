import React from 'react';

import {Text, View} from 'react-native';

/** Div **/
export default class ASUIDiv extends React.Component {

    /** @deprecated **/
    render() {
        return <View {...this.props}>{textify(this.props.children)}</View>;
    }
}


function textify(content, props={}) {
    return typeof content !== "object" ? <Text children={content} {...props}/> : content;
}
