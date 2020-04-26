throw new Error("DEPRECIATED");

const babel = require("@babel/core");
var uglify = require("uglify-js");
const minify = require('minify');
const fs = require('fs');

(async () => {
    const babelOptions = {
        "presets": ["@babel/preset-es2015", ],
        "plugins": ["transform-async-functions"]
    };

    const convert = async (filePath) => {
        // const bableCode = await babel.transformFileAsync(filePath, babelOptions);
        // let code = bableCode.code;
        // let uglifyCode = uglify.minify(code);
        // code = uglifyCode.code;
        let code = await minify(filePath);
        return code;
    };

    const minified = '(function(){'
        + await convert('composer/audio-source-composer-element.js')
        + await convert('composer/ascui-track.js')
        // + await convert('composer/audio-source-composer-programs.js')
        + await convert('composer/audio-source-composer-keyboard.js')
        // + await convert('composer/audio-source-composer-menu.js')
        + await convert('composer/audio-source-composer-actions.js')

        + await convert('common/ASUIComponent.js')
        + await convert('common/audio-source-utilities.js')
        + await convert('common/Values.js')
        + await convert('common/Library.js')
        + await convert('common/Song.js')
        + await convert('common/Storage.js')
        + await convert('file/MIDIFile.js')

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
