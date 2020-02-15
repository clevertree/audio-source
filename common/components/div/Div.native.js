import React from 'react';
import {View, Animated} from 'react-native';

/** Div **/
class Div extends React.Component {

    render() {
        return React.createElement(View, this.props, super.renderReactNative());
    }
}

export default Div;
