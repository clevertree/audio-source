const minify = require('minify');
const fs = require('fs');

(async () => {
    const minified = '(function(){'
        + await minify('composer/audio-source-composer-element.js')
        + await minify('composer/audio-source-composer-forms.js')
        + await minify('composer/audio-source-composer-grid.js')
        + await minify('composer/audio-source-composer-instruments.js')
        + await minify('composer/audio-source-composer-keyboard.js')
        + await minify('composer/audio-source-composer-menu.js')
        + await minify('composer/audio-source-composer-values.js')
        + await minify('composer/audio-source-composer-websocket.js')

        + await minify('common/audio-source-libraries.js')
        + await minify('common/audio-source-renderer.js')
        + await minify('common/audio-source-storage.js')

        + '})();';

    await writeToFile('composer/audio-source-composer.min.js', minified);
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