import * as React from "react";
import PropTypes from 'prop-types';
import {ASUIContextMenu} from "../../components";


// TODO: ASCTrackRowContainer
export default class ASCTrackBase extends React.Component {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_MEASURES_PER_SEGMENT = 4;
    static DEFAULT_BEATS_PER_MEASURE = 4;
    static DEFAULT_MAX_SEGMENTS = 6;
    static DEFAULT_MIN_SEGMENTS = 4;

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        // selectedIndices: PropTypes.array.isRequired,
        composer: PropTypes.object.isRequired,
        trackName: PropTypes.string.isRequired,
        selected: PropTypes.bool.isRequired,

    };


    constructor(props) {
        super(props);
        // console.log('ASCTrackBase.constructor', props);

        if(!props.composer)
            throw new Error("Invalid composer");
        // const trackState = props.composer.state.activeTracks[this.props.trackName] || {};
        this.state = {
            rowOffset:      0,
            cursorOffset:   0,
            selectedIndices: [],
            startPosition: 0,
            songPosition: 0,

            menuOpen: false,
            menuOptions: null,
            clientPosition: null,
        };
        this.cb = {
            toggleViewMode: e => this.toggleViewMode(e),
            renderMenuViewOptions: () => this.renderMenuViewOptions(),
            renderMenuSetQuantization: () => this.renderMenuSetQuantization(),
            renderMenuSetRowLength: () => this.renderMenuSetRowLength(),
            // formatDuration: durationTicks => this.formatTrackDuration(durationTicks)
        }

        this.ref = {
            rowContainer: React.createRef()
        }
        this.destination = null;
        this.renderStats = {};
    }

    componentDidMount() {
        this.updateRenderingStats();
    }


    renderContextMenu() {
        if(!this.state.menuOpen)
            return null;
        return <ASUIContextMenu
                x={this.state.clientPosition[0]}
                y={this.state.clientPosition[1]}
                key="dropdown"
                options={this.state.menuOptions}
                vertical={true}
                onClose={e => this.closeContextMenu(e)}
            />;
    }
}

