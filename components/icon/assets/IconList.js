export default class IconList {
    getSource(sourceName) {
        if(icons[sourceName])
            return icons[sourceName];
        throw new Error("Unknown icon: " + sourceName + "\n Icon list: " + Object.keys(icons).join(', '));
    }
}

const icons = {
    'menu':                    require('./img/menu.icon.png'),
    'play':                    require('./img/play.icon.png'),
    'pause':                   require('./img/pause.icon.png'),
    'stop':                    require('./img/stop.icon.png'),
    'next':                    require('./img/next.icon.png'),
    'file-save':               require('./img/file-save.icon.png'),
    'file-load':               require('./img/file-load.icon.png'),


    'insert':                  require('./img/insert.icon.png'),
    'remove':                  require('./img/remove.icon.png'),

    'config':                  require('./img/config.icon.png'),
    'source':                  require('./img/source.icon.png'),

    'menu-sample':             require('./img/menu-sample.icon.png'),
    'menu-effect-envelope':    require('./img/menu-effect-envelope.icon.png'),
}
