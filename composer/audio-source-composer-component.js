import React, { Component } from 'react'

export class AudioSourceComposerComponent extends Component {

    constructor(props) {
        super(props);
        this.addActiveClass= this.addActiveClass.bind(this);
        this.state = {
            active: false,
        };
    }
    toggleClass() {
        const currentState = this.state.active;
        this.setState({ active: !currentState });
    };

    render() {
        return null;
    }
}