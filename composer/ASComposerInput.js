import ASComposerPlayback from "./ASComposerPlayback";

export default class ASComposerInput extends ASComposerPlayback {
    constructor(props) {
        super(props);
        this.cb.onResizeCallback = e => this.onResize(e);
        this.cb.onUnloadCallback = e => this.saveState(e);
    }

    componentDidMount() {
        setTimeout(() => this.onResize(), 100);
        window.addEventListener('unload', this.cb.onUnloadCallback);
        window.addEventListener('resize', this.cb.onResizeCallback);
    }

    componentWillUnmount() {
        window.removeEventListener('unload', this.cb.onUnloadCallback);
        window.removeEventListener('resize', this.cb.onResizeCallback);
    }




    /** Portrait Mode **/

    onResize() {
        if(!this.ref.container.current)
            return console.warn("containerElm not found");
        const containerElm = this.ref.container.current.getContainerElement();
        // TODO: detect mobile as portrait excluding horizontal ipad
        let {width, height} = containerElm.getBoundingClientRect();
        if(window && window.innerHeight < height)
            height = window.innerHeight;
        const aspectRatio = width / height;
        let portrait = aspectRatio < 8/13; // Near golden ratio
        if(width <= 800)
            portrait = true;
        // console.log("Setting portrait mode to ", portrait, ". Aspect ratio: ", aspectRatio, containerElm, box);
        if(!this.state.portrait === portrait) {
            this.setState({portrait});
        }
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
