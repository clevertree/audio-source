import * as React from "react";
import {StyleSheet, Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {ASUIDropDownContainer} from "../../../../components/menu/";


class ASCTrackInstructionParameter extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        vertical: true
    };

    /** Property validation **/
    static propTypes = {
        options: PropTypes.any.isRequired,
        trackerInstruction: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            onContextMenu: (e) => this.onContextMenu(e),
            onKeyDown: (e) => this.onKeyDown(e),
            // onMouseInput: e => this.onMouseInput(e),
        };
    }

    render() {
        const styleView = [styles.parameterView];
        if(this.props.type)
            styleView.push(styles[this.props.type + 'View'])

        const styleText = [styles.parameterText];
        if(this.props.type)
            styleText.push(styles[this.props.type + 'Text'])

        return <View
            style={styleView}
            // onClick={this.cb.onMouseInput}
            onKeyDown={this.cb.onKeyDown}
            onContextMenu={this.cb.onContextMenu}
            title={this.props.title}
            // tabIndex={0}
        >
            {textify(this.props.children, {style: styleText})}
            <ASUIDropDownContainer
                ref={this.dropdown}
                options={this.props.options}
                vertical={this.props.vertical}
                />
        </View>;
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }


    /** User Input **/


    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case 'ContextMenu':
                e.preventDefault();
                this.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    // onMouseInput(e) {
    //     console.log(e.type);
    //     if(e.defaultPrevented)
    //         return;
    //     e.preventDefault();
    //
    //     switch(e.type) {
    //         case 'click':
    //             if(e.button === 0)
    //                 this.selectInstruction();
    //             else if(e.button === 1)
    //                 throw new Error("Unimplemented middle button");
    //             else if(e.button === 2)
    //                 this.toggleMenu();
    //             else
    //                 throw new Error("Unknown mouse button");
    //
    //             break;
    //         default:
    //             throw new Error("Unknown Mouse event: " + e.type);
    //     }
    // }

    onContextMenu(e) {
        if(e.defaultPrevented || e.shiftKey)
            return;
        e.preventDefault();
        this.toggleMenu();
    }


    onMouseEnter(e) {
        this.toggleMenu();
    }

    selectInstruction() {
        this.props.trackerInstruction.selectInstruction();
    }

}

export default ASCTrackInstructionParameter;


const styles = StyleSheet.create({

    parameterView: {
        borderLeftWidth: 1,
        borderLeftColor: '#AAA',
        paddingLeft: 2,
        paddingRight: 2
    },

    parameterText: {
    },

    commandView: {
        borderLeftWidth: 0,
        paddingLeft: 0,
    },

    velocityView: {
    },

    durationView: {
    },

    commandText: {
        color: 'darkred',
    },

    velocityText: {
        color: 'green',
    },

    durationText: {
        color: 'purple',
    }
});

function textify(content, props={}) {
    return typeof content !== "object" ? <Text children={content} {...props}/> : content;
}
