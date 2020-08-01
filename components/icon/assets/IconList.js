export default class IconList {
    getSource(sourceName) {
        switch (sourceName) {
            case 'menu':                    return require('./img/menu.icon.png');
            case 'play':                    return require('./img/play.icon.png');
            case 'pause':                   return require('./img/pause.icon.png');
            case 'stop':                    return require('./img/stop.icon.png');
            case 'next':                    return require('./img/next.icon.png');
            case 'file-save':               return require('./img/file-save.icon.png');
            case 'file-load':               return require('./img/file-load.icon.png');


            case 'insert':                  return require('./img/insert.icon.png');
            case 'remove':                  return require('./img/remove.icon.png');

            case 'config':                  return require('./img/config.icon.png');
            case 'source':                  return require('./img/source.icon.png');

            case 'menu-sample':             return require('./img/menu-sample.icon.png');
            case 'menu-effect-envelope':    return require('./img/menu-effect-envelope.icon.png');

            default:
                throw new Error("Unknown icon: " + sourceName);
        }
    }
}
