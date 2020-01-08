(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    const {ASUIDiv} = require('./asui-component.js');

    /** Required Modules **/

// if(isBrowser)
//         customElements.define('music-song-menu', MusicEditorMenuElement);


    /** Grid **/

    class ASUIGrid extends ASUIDiv {
    }

    if(isBrowser)
        customElements.define('asui-grid', ASUIGrid);

    /** Grid Row **/


    class ASUIGridRow extends ASUIDiv {
    }

    if(isBrowser)
        customElements.define('asuig-row', ASUIGridRow);


    /** Export this script **/
    thisModule.exports = {
        ASUIGrid,
        ASUIGridRow,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-grid.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());