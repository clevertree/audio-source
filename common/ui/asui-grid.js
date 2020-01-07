{
    const thisScriptPath = 'common/ui/asui-grid.js';
    const isRN = typeof document === 'undefined';
    const thisModule = isRN ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const require =  isRN ? window.require : customElements.get('audio-source-loader').getRequire(thisModule);


    const {ASUIDiv} = require('asui-component.js');

    /** Required Modules **/

// customElements.define('music-song-menu', MusicEditorMenuElement);


    /** Grid **/

    class ASUIGrid extends ASUIDiv {
    }

    customElements.define('asui-grid', ASUIGrid);

    /** Grid Row **/


    class ASUIGridRow extends ASUIDiv {
    }

    customElements.define('asuig-row', ASUIGridRow);


    /** Export this script **/
    thisModule.exports = {
        ASUIGrid,
        ASUIGridRow,
    };
}