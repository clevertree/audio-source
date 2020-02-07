(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    const {
        ASUIDiv,
        ASUIComponent,
        ASUIIcon
    } = require('../../common/ui/asui-component.js');
    // const {ASUIInputButton} = require('../../common/ui/asui-input-button.js');
    const {ASUIMenu} = require('../../common/ui/asui-menu.js');


    class ASPHeader extends ASUIComponent {

        render() {
            return this.props.portrait ? this.renderPortrait() : this.renderLandscape();
        }

        renderLandscape() {
            let menuContent = this.props.menuContent;
            if(typeof menuContent === "function")
                menuContent = menuContent(this);
            return menuContent;
        }

        renderPortrait() {
            return [
                /** Menu Button **/
                ASUIMenu.cSME('asp-menu-button',
                    ASUIIcon.createIcon('menu'),
                    this.props.menuContent
                ),

                /** Title Text **/
                ASUIDiv.cE({onclick: e => this.restart(), key: 'asp-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
            ]
        }


    }
    if(isBrowser)
        customElements.define('asp-header', ASPHeader);



    /** Export this script **/
    thisModule.exports = {
        ASPHeader,
        // ASPHeaderContainer
    };


}).apply(null, (function() {
    const thisScriptPath = 'player/ui/asp-header.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
