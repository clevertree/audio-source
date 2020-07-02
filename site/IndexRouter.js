import React from 'react';
import {
    Switch,
    Route,
    BrowserRouter
} from "react-router-dom";

import {ASPlayer} from '../player';
import {ASComposer} from "../composer/";
import {MarkdownRoute} from "./component";

import SongProxyWebViewClient from "../song/proxy/SongProxyWebViewClient";
import DemoPage from "./pages/DemoPage";


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
                    <Route path={'/composer'}>
                        <ASComposer/>
                    </Route>
                    <Route path={['/both', '/b']}>
                        <ASComposer/>
                        <ASPlayer/>
                    </Route>

                    <Route component={DemoPage}                 path={'/demo'}/>
                    <Route component={SongProxyWebViewClient}   path={['/blank', '/proxy']} />
                    <Route component={ASPlayer}                 path={['/player', '/p']}/>

                    <MarkdownRoute file={require("./pages/About.md")} path={'/about'}/>
                    <MarkdownRoute file={require("./pages/Contact.md")} path={'/contact'}/>
                    <MarkdownRoute file={require("./pages/Downloads.md")} path={'/downloads'}/>
                    <MarkdownRoute file={require("./pages/Homepage.md")} path={'/'}/>

                    <Route path="/"
                        render={(props) => {
                            switch(props.location.search) {
                                case '?blank':
                                case '?proxy':
                                    return <SongProxyWebViewClient/>;
                                default:
                                    return null;
                            }
                        }}
                    />
                </Switch>
            </BrowserRouter>
        );
    }

}

