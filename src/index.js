import React from 'react';
import ReactDOM from 'react-dom';
// import './index.css';
import * as serviceWorker from './serviceWorker';
// eslint-disable-next-line no-unused-vars
import {IndexRouter} from "./server";
import RemotePresetLibrary from "./song/library/RemotePresetLibrary";
// import {ASComposer} from "./composer";

ReactDOM.render(<IndexRouter />, document.getElementById('root'));
// ReactDOM.render(<ASComposer />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if(navigator && navigator.serviceWorker)
serviceWorker.unregister();


const url = 'https://files.audiosource.io/samples/';
RemotePresetLibrary.addRemoteLibrary(`${url}gm/Acoustic/Acoustic.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/Aspirin/Aspirin.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/Chaos/Chaos.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/FluidR3/FluidR3.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/GeneralUserGS/GeneralUserGS.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/Gibson/Gibson.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/JCLive/JCLive.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/LesPaul/LesPaul.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/LK/LK.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/SBAWE32/SBAWE32.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/SBLive/SBLive.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/Soul/Soul.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/SoundBlasterOld/SoundBlasterOld.library.json`);
RemotePresetLibrary.addRemoteLibrary(`${url}gm/Stratocaster/Stratocaster.library.json`);