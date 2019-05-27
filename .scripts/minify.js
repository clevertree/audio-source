const minify = require('minify');
const fs = require('fs');

(async () => {
    const minified = '(function(){'
        + await minify('../editor/audio-source-editor-element.js')
        + await minify('../editor/audio-source-editor-forms.js')
        + await minify('../editor/audio-source-editor-grid.js')
        + await minify('../editor/audio-source-editor-instruments.js')
        + await minify('../editor/audio-source-editor-keyboard.js')
        + await minify('../editor/audio-source-editor-menu.js')
        + await minify('../editor/audio-source-editor-values.js')
        + await minify('../editor/audio-source-editor-websocket.js')

        + await minify('../common/audio-source-libraries.js')
        + await minify('../common/audio-source-renderer.js')
        + await minify('../common/audio-source-storage.js')

        + '})();';

    await writeToFile('../editor/audio-source-editor.min.js', minified);
    console.log(minified);
})();

async function writeToFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, function(err) {
            if(err)     reject(err);
            else        resolve();
        });
    });
}