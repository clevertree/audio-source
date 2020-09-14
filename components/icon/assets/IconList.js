export default class IconList {
    getSource(sourceName) {
        if(icons[sourceName])
            return icons[sourceName];
        throw new Error("Unknown icon: " + sourceName + "\n Icon list: " + Object.keys(icons).join(', '));
    }
}

const icons = {
    'close':                    require('./img/close.icon.png'),

    'menu':                     require('./img/menu.icon.png'),
    'play':                     require('./img/play.icon.png'),
    'pause':                    require('./img/pause.icon.png'),
    'stop':                     require('./img/stop.icon.png'),
    'next':                     require('./img/next.icon.png'),
    'file-save':                require('./img/file-save.icon.png'),
    'file-load':                require('./img/file-load.icon.png'),


    'insert':                   require('./img/insert.icon.png'),
    'remove':                   require('./img/remove.icon.png'),

    'config':                   require('./img/config.icon.png'),
    'source':                   require('./img/source.icon.png'),

    'lfo-parameter':            require('./img/effect-envelope.icon.png'),

    'effect-envelope':          require('./img/effect-envelope.icon.png'),

    'instrument-oscillator':    require('./img/instrument-oscillator.icon.png'),
    'instrument-audiobuffer':   require('./img/instrument-audiobuffer.icon.png'),

    'file-song':                require('./img/file-song.icon.png'),

}
