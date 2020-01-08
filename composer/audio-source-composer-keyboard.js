(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    // if(isBrowser) // Hack for browsers
    //     window.require = thisRequire;
    class AudioSourceComposerKeyboard {
        constructor() {
        }


        getKeyboardLayout(layoutName=null) {
            switch(layoutName) {
                default:
                case '2octave':
                    return {
                        '@':'C#4',  '#':'D#4',  '%':'F#4', '^':'G#4',   '&':'A#4',  '*':'C#3',  ')':'D#3',
                        'Q':'C4',   'W':'D4',   'E':'E4',   'R':'F4',   'T':'G4',   'Y':'A4',   'U':'B4',   'I':'C3',   'O':'D3',   'P':'E3',
                        'S':'C#3',  'D':'D#3',  'G':'F#3',  'H':'G#3',  'J':'A#3',  'L':'C#4',  ':':'D#4',
                        'Z':'C3',   'X':'D3',   'C':'E3',   'V':'F3',   'B':'G3',   'N':'A3',   'M':'B3', '<':'C4', '>':'D4', '?':'E4',

                        '2':'C#2', '3':'D#2', '5':'F#2', '6':'G#2', '7':'A#2', '9':'C#3', '0':'D#3',
                        'q':'C2', 'w':'D2', 'e':'E2', 'r':'F2', 't':'G2', 'y':'A2', 'u':'B2', 'i':'C3', 'o':'D3', 'p':'E3',
                        's':'C#1', 'd':'D#1', 'g':'F#1', 'h':'G#1', 'j':'A#1', 'l':'C#2', ';':'D#2',
                        'z':'C1', 'x':'D1', 'c':'E1', 'v':'F1', 'b':'G1', 'n':'A1', 'm':'B1', ',':'C2', '.':'D2', '/':'E2',
                    };

                case '4octave':
                    return {
                        // '1':'C4', '2':'C#4', '3':'D4', '4':'D#4', '5':'E4', '6':'F4', '7':'F#4', '8': 'G4', '9':'G#4', '0':'A4', "-":'A#4', "=":'B4', // TODO special commands?
                        'Q':'C6', 'W':'C#6', 'E':'D6', 'R':'D#6', 'T':'E6', 'Y':'F6', 'U':'F#6', 'I': 'G6', 'O':'G#6', 'P':'A6', "{":'A#6', "}":'B6',
                        'A':'C5', 'S':'C#5', 'D':'D5', 'F':'D#5', 'G':'E5', 'H':'F5', 'J':'F#5', 'K': 'G5', 'L':'G#5', ':':'A5', '"': 'A#5',
                        'Z':'C4', 'X':'C#4', 'C':'D4', 'V':'D#4', 'B':'E4', 'N':'F4', 'M':'F#4', '<': 'G4', '>':'G#4', '?':'A4',


                        'q':'C3', 'w':'C#3', 'e':'D3', 'r':'D#3', 't':'E3', 'y':'F3', 'u':'F#3', 'i': 'G3', 'o':'G#3', 'p':'A3', "[":'A#3', "]":'B3',
                        'a':'C2', 's':'C#2', 'd':'D2', 'f':'D#2', 'g':'E2', 'h':'F2', 'j':'F#2', 'k': 'G2', 'l':'G#2', ';':'A2', "'":'A#2',
                        'z':'C1', 'x':'C#1', 'c':'D1', 'v':'D#1', 'b':'E1', 'n':'F1', 'm':'F#1', ',': 'G1', '.':'G#1', '/':'A1',
                    };
            }
        }

        getKeyboardCommand(key, octave = 3, layoutName = null) {
            if (!Number.isInteger(octave))
                throw new Error("Octave value must be an integer");
            const keyboardLayout = this.getKeyboardLayout(layoutName);
            if (typeof keyboardLayout[key] === 'undefined')
                return null;
            // const octave = parseInt(this.editor.tracker.fieldTrackerOctave.value) || 1;
            let command = keyboardLayout[key];
            for (let i = 6; i >= 1; i--)
                command = command.replace(i, octave + i - 1);
            return command;
        }

    }


    /** Export this script **/
    thisModule.exports = {
        AudioSourceComposerKeyboard,
    };

}).apply(null, (function() {
    const thisScriptPath = 'composer/audio-source-composer-keyboard.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());