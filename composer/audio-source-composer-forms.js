class AudioSourceComposerForms extends HTMLElement {
    constructor() {
        super();
    }
    // get gridStatus() { return this.editor.status.grid; }

    connectedCallback() {
        this.editor = this.getRootNode().host;
        this.render();
    }

    // get renderElement() {
    //     return this.editor.elements.forms;
    //     // const selector = 'div.composer-forms';
    //     // let renderElement = this.editor.shadowDOM.querySelector(selector);
    //     // if(!renderElement)
    //     //     throw new Error(`Element not found: ${selector}`);
    //     // return renderElement;
    // }

    // get grid() { return this.song.grid; } // Grid associated with menu

    onInput(e, form) {
        if (e.defaultPrevented)
            return;
        if(!form && e.target instanceof Node && !this.contains(e.target))
            return;

        switch (e.type) {
            case 'submit':
                e.preventDefault();
                this.onSubmit(e, form);
                break;
            case 'change':
            case 'blur':
                if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type))
                    this.onSubmit(e, form);
                break;
        }

    }

    onSubmit(e, form) {
        if(!form)
            form = e.target.form || e.target;
        const command = form.getAttribute('data-action');
        // const cursorCellIndex = this.editor.cursorCellIndex;
        const currentGroup = this.editor.currentGroup;
        // const selectedIndicies = this.editor.status.selectedIndicies;
        const selectedIndices = this.editor.tracker.selectedIndicies;
        // const selectedPauseIndices = this.editor.selectedPauseIndicies;
        const selectedRange = this.editor.selectedRange;

        switch (command) {
            case 'instrument:add':
                this.editor.status.currentInstrumentID = this.editor.renderer.addInstrument(form.elements['instrumentURL'].value);
                // this.editor.update();
                break;


            case 'song:load-from-file':
                this.editor.loadSongFromFileInput(form['file']);
                break;

            case 'song:edit':
                this.editor.renderer.replaceDataPath('beatsPerMinute', form['beats-per-minute'].value);
                this.editor.renderer.replaceDataPath('beatsPerMeasure', form['beats-per-measure'].value);
                break;

            case 'song:play':
                if(this.editor.renderer.isPlaybackActive())
                    this.editor.renderer.stopAllPlayback();
                else
                    this.editor.renderer.play();
                break;
            case 'song:pause':
                this.editor.renderer.stopAllPlayback();
                // this.editor.renderer.pause();
                break;

            case 'song:resume':
                this.editor.renderer.play(this.editor.renderer.seekPosition);
                break;

            case 'song:playback':
                console.log(e.target);
                break;

            case 'song:volume':
                this.editor.renderer.setVolume(parseInt(form['volume'].value));
                break;

            case 'song:add-instrument':
                const instrumentURL = form['instrumentURL'].value;
                form['instrumentURL'].value = '';
                if(confirm(`Add Instrument to Song?\nURL: ${instrumentURL}`)) {
                    this.editor.renderer.addInstrument(instrumentURL);
                    this.render();
                } else {
                    console.info("Add instrument canceled");
                }
//                     this.fieldAddInstrumentInstrument.value = '';
                break;

            case 'song:set-title':
                this.editor.renderer.setSongTitle(form['title'].value);
                break;

            case 'song:set-version':
                this.editor.renderer.setSongVersion(form['version'].value);
                break;

            case 'toggle:control-song':
                this.classList.toggle('hide-control-song');
                break;

            case 'toggle:control-tracker':
                this.classList.toggle('hide-control-tracker');
                break;

            case 'toggle:control-tracker':
                this.classList.toggle('hide-control-tracker');
                break;

            default:
                console.warn("Unhandled " + e.type + ": ", command);
                break;
        }
        // } catch (e) {
        //     this.onError(e);
        // }
    }

    // ${this.renderEditorMenuLoadFromMemory()}
    render() {
        const renderer = this.editor.renderer;
        const songData = this.editor.getSongData();
        // let tabIndex = 2;
        this.innerHTML =
            `
            <div class="form-section-container">
                <div class="form-section-divide">
                    <form action="#" class="form-song-toggle" data-action="toggle:control-song">
                        <button name="toggle" class="themed" title="Show/Hide Song Controls">
                            <div>Song</div>
                        </button>
                    </form>
                </div>               
                
                <div class="form-section control-song">
                    <div class="form-section-header">Playback Controls</div>
                    <form action="#" class="form-song-play" data-action="song:play">
                        <button type="submit" name="play" class="themed">Play</button>
                    </form>
                    <form action="#" class="form-song-pause show-on-song-playing" data-action="song:pause">
                        <button type="submit" name="pause" class="themed">Pause</button>
                    </form>
                    <form action="#" class="form-song-resume show-on-song-paused" data-action="song:resume">
                        <button type="submit" name="resume" class="themed">Resume</button>
                    </form>
                </div>
                                             
                
                <div class="form-section control-song">
                    <div class="form-section-header">Volume</div>
                    <form action="#" class="form-song-volume submit-on-change" data-action="song:volume">
                        <div class="volume-container">
                            <input name="volume" type="range" min="1" max="100" value="${renderer ? renderer.getVolume() : 0}" class="themed">
                        </div>
                    </form>
                </div>
                
                <div class="form-section control-song">
                    <div class="form-section-header">Load</div>
                    <form name="form-load-file" action="#" class="form-load-file submit-on-change" data-action="song:load-from-file">
                        <label>
                            <div class="input-style">File</div>
                            <input type="file" name="file" accept=".json,.mid,.midi" style="display: none" />
                        </label>
                    </form>
                </div>
                              
                                             
                
                <div class="form-section control-song">
                    <div class="form-section-header">Song Title</div>
                    <form action="#" class="form-song-title submit-on-change" data-action="song:set-title">
                        <input name="title" type="text" class="themed" value="${songData.title}" />
                    </form>
                </div>     
                
                <div class="form-section control-song">
                    <div class="form-section-header">Version</div>
                    <form action="#" class="form-song-version submit-on-change" data-action="song:set-version">
                        <input name="version" type="text" class="themed" value="${songData.version}" />
                    </form>
                </div>                
                 
                
                <div class="form-section control-song">
                    <div class="form-section-header">Add Instrument</div>                    
                    <form class="form-add-instrument submit-on-change" data-action="instrument:add">
                        <select name="instrumentURL" class="themed">
                            <option value="">Select Instrument</option>
                            ${this.renderEditorFormOptions('instruments-available')}
                        </select>
                    </form>
                </div>
                 
                <div style="clear: both;" class="control-song"></div>
                 
            </div> 
        `;
        this.update();
    }


// <div class="form-section control-tracker">
//         <div class="form-section-header">Sel Range</div>
// <form class="form-selected-range submit-on-change" data-action="grid:selected">
//         <input name="rangeStart" placeholder="N/A" />-<!--
//                  --><input name="rangeEnd" placeholder="N/A" />
//         </form>
//         </div>
// <div class="form-section">
//         <div class="form-section-header">Modify Row</div>
// <form action="#" class="form-row-insert" data-action="row:insert">
//         <button name="insert" disabled="disabled" class="themed">+</button>
//         </form>
//         <form action="#" class="form-row-delete" data-action="row:delete">
//         <button name="delete" disabled="disabled" class="themed">-</button>
//         </form>
//         <form action="#" class="form-row-duplicate" data-action="row:duplicate">
//         <button name="duplicate" disabled="disabled" class="themed">Duplicate</button>
//         </form>
//         </div>
//

    update() {
    }



    renderEditorFormOptions(optionType, selectCallback) {
        let optionsHTML = '';
        this.editor.values.getValues(optionType, function (value, label, html='') {
            const selected = selectCallback ? selectCallback(value) : false;
            optionsHTML += `<option value="${value}" ${selected ? ` selected="selected"` : ''}${html}>${label}</option>`;
        });
        return optionsHTML;
    }

//     renderEditorMenuLoadFromMemory() {
//         return '';
//         const songGUIDs = JSON.parse(localStorage.getItem('share-song-saved-list') || '[]');
// //         console.log("Loading songData list from memory: ", songGUIDs);
//
//         let menuItemsHTML = '';
//         for(let i=0; i<songGUIDs.length; i++) {
//             const songGUID = songGUIDs[i];
//             let songDataString = localStorage.getItem('song:' + songGUID);
//             const song = JSON.parse(songDataString);
//             if(song) {
//                 menuItemsHTML +=
//                     `<li>
//                     <a data-action="load:memory" data-guid="${songGUID}">${song.name || "unnamed"}</a>
//                 </li>`;
//             } else {
//                 console.error("Song GUID not found: " + songGUID);
//             }
//         }
//
//         return `
//         <ul class="menu">
//             ${menuItemsHTML}
//         </ul>
//     `;
//     }


// <br/>
// <label class="row-label">Group:</label>
// <form action="#" class="form-song-bpm" data-command="song:edit">
//         <select name="beats-per-minute" title="Beats per minute" disabled>
// <optgroup label="Beats per minute">
//         ${this.getValues('beats-per-minute', (value, label, selected) =>
// `<option value="${value}" ${selected ? ` selected="selected"` : ''}>${label}</option>`)}
//     </optgroup>
// </select>
// <select name="beats-per-measure" title="Beats per measure" disabled>
// <optgroup label="Beats per measure">
//         ${this.getValues('beats-per-measure', (value, label, selected) =>
// `<option value="${value}" ${selected ? ` selected="selected"` : ''}>${label}</option>`)}
//     </optgroup>
// </select>
// </form>

}
customElements.define('asc-forms', AudioSourceComposerForms);
