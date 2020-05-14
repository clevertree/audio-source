import React from 'react';
import {
    Switch,
    Route,
    BrowserRouter
} from "react-router-dom";

import {ASPlayer} from '../player';
import {ASComposer} from "../composer/";
import SongProxyWebViewClient from "../song/proxy/SongProxyWebViewClient";
import HomePage from "../site/HomePage";
import DownloadsPage from "../site/DownloadsPage";
import AboutPage from "../site/AboutPage";
import ComposerPage from "../site/ComposerPage";
import ContactPage from "../site/ContactPage";
// import MenuOverlayContainer from "../components/menu/MenuOverlayContainer";


export default class IndexRouter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // menuOpen: true,
            // menuOptions: null
        };

        // setTimeout(e => this.toggleMenu(), 200);
    }


    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route
                        path={['/blank', '/proxy']}
                        render={() => <SongProxyWebViewClient/>} />
                    <Route
                        path={['/player', '/p']}
                        render={p => <ASPlayer {...p}/>} />
                    <Route
                        path={['/composer', '/c']}
                        render={p => <ComposerPage {...p}/>} />
                    <Route path={['/both', '/b']}>
                        <ASComposer/>
                        <ASPlayer/>
                    </Route>
                    <Route
                        path={'/about'}
                        render={p => <AboutPage {...p}/>} />
                    <Route
                        path={'/contact'}
                        render={p => <ContactPage {...p}/>} />
                    <Route
                        path={'/downloads'}
                        render={(p) => <DownloadsPage {...p}/>} />
                    <Route path="/"
                        render={(props) => {
                            switch(props.location.search) {
                                case '?blank':
                                case '?proxy':
                                    return <SongProxyWebViewClient/>;
                                default:
                                    return <HomePage {...props}/>;
                            }
                        }}
                    />
                </Switch>
            </BrowserRouter>
        );
    }

}

