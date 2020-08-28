import * as React from "react";
import PropTypes from 'prop-types';

import {ASUIGlobalContext} from "../../components/";


// TODO: ASCTrackRowContainer
export default class ASCTrackBase extends React.Component {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_MEASURES_PER_SEGMENT = 4;
    static DEFAULT_BEATS_PER_MEASURE = 4;
    static DEFAULT_MAX_SEGMENTS = 8;
    static DEFAULT_MIN_SEGMENTS = 4;

    /** Global Context **/
    // static contextType = ASUIGlobalContext;
    // getGlobalContext()          { return this.context; }
    // // setStatus(message)          { this.context.addLogEntry(message); }
    // // setError(message)           { this.context.addLogEntry(message, 'error'); }
    // getViewMode()               { return this.context.getViewMode(this.getTrackViewKey()); }
    // setViewMode(mode)           { return this.context.setViewMode(this.getTrackViewKey(), mode); }
    // getTrackViewKey()           { return 'track:' + this.props.trackName; }

    /** Default Properties **/
    static defaultProps = {
        // cursorOffset: 0,
        // selectedIndices: [],
        // rowOffset: 0,
        // rowLength: 16,
        // quantizationTicks: null,
        // destinationList: []
    };

    /** Property validation **/
    static propTypes = {
        selectedIndices: PropTypes.array.isRequired,
        composer: PropTypes.object.isRequired,
        trackName: PropTypes.string.isRequired,
        // trackState: PropTypes.object.isRequired
    };


    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        // const trackState = props.composer.state.activeTracks[this.props.trackName] || {};
        this.state = {
            rowOffset:      0,
            cursorOffset:   0,

            menuOpen: false,
            clientPosition: null,
        };
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            toggleViewMode: e => this.toggleViewMode(e),
            renderMenuViewOptions: () => this.renderMenuViewOptions(),
            renderMenuSetQuantization: () => this.renderMenuSetQuantization(),
            renderMenuSetSegmentLength: () => this.renderMenuSetSegmentLength(),

            onKeyDown: (e) => this.onKeyDown(e),
            onContextMenu: e => this.onContextMenu(e),
            onWheel: e => this.onWheel(e),
            // options: () => this.renderContextMenu()
        };
        this.ref = {
            rowContainer: React.createRef()
        }
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
        // console.log('ASCTrackBase.constructor', this.getTrackName(), this.state, trackState);

    }

    componentDidMount() {
        this.updateRenderingProps();
    }


}

