import {
    Song,
    SongValues,
    Storage,
    Keyboard,
    Library}          from "../song";
import ActiveTrackState from "./track/state/ActiveTrackState";
import ASComposerPlayback from "./ASComposerPlayback";

export default class ASComposerInput extends ASComposerPlayback {
    constructor(props) {
        super(props);
        this.onResizeCallback = e => this.onResize(e);
        this.onUnloadCallback = e => this.saveState(e);
    }

    componentDidMount() {
        this.onResize();
        window.addEventListener('unload', this.onUnloadCallback);
        window.addEventListener('resize', this.onResizeCallback);
    }

    componentWillUnmount() {
        window.removeEventListener('unload', this.onUnloadCallback);
        window.removeEventListener('resize', this.onResizeCallback);
    }



    /** Input **/

    onInput(e) {
        // console.log(e.type);
        if (e.defaultPrevented)
            return;

        switch (e.type) {
            case 'focus':
                break;

            // case 'click':
            //     this.closeAllMenus(true);
            //     break;

            case 'dragover':
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                break;

            case 'drop':
                e.stopPropagation();
                e.preventDefault();
                let files = e.dataTransfer.files; // Array of all files
                this.loadSongFromFileInput(files[0]);
                break;

            case 'midimessage':
                // console.log("MIDI", e.data, e);
                switch (e.data[0]) {
                    case 144:   // Note On
                        // TODO: refactor
                        e.preventDefault();
                        throw new Error("TODO: Implement");
                        // const midiImport = new MIDIImport();
                        // let newMIDICommand = midiImport.getCommandFromMIDINote(e.data[1]);
                        // let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                        // console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                        // this.instructionInsertOrUpdate(e, newMIDICommand);
                        // this.playSelectedInstructions(e);
                        // this.focus();
                    case 128:   // Note Off
                        // TODO: turn off playing note, optionally set duration of note
                        break;

                    default:
                        break;
                }
                break;

            default:
                throw new Error("Unhandled type: " + e.type);
        }

    }


}
