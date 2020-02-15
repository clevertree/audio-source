import React from 'react';


/** Icon **/
class Icon extends React.Component {
    constructor(props = {}) {
        super(props, {});
    }

    render() {
        // console.log('Icon', this.props);
        const Image = require('react-native').Image;
        // const React = require('react');
        return React.createElement(Image, this.props);
    }

    static createIcon(iconName) {
        let props = {};
        switch(iconName) {
            case 'menu':        props.source = require('../../assets/img/icon/ui-icon-menu.png'); break;
            case 'play':        props.source = require('../../assets/img/icon/ui-icon-play.png'); break;
            case 'pause':       props.source = require('../../assets/img/icon/ui-icon-pause.png'); break;
            case 'stop':        props.source = require('../../assets/img/icon/ui-icon-stop.png'); break;
            case 'next':        props.source = require('../../assets/img/icon/ui-icon-next.png'); break;
            case 'file-save':   props.source = require('../../assets/img/icon/ui-icon-file-save.png'); break;
            case 'file-load':   props.source = require('../../assets/img/icon/ui-icon-file-load.png'); break;
            default: console.error("Unknown icon: " + iconName); break;
        }
        return this.createElement(iconName, null, props);
    }
}

export default Icon;
