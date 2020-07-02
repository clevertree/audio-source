import React from 'react';
import {
    Switch,
    Route,
    BrowserRouter
} from "react-router-dom";

import {ASPlayer} from '../player';
import {ASComposer} from "../composer/";
import {MarkdownPage, MarkdownRoute} from "./component";

import SongProxyWebViewClient from "../song/proxy/SongProxyWebViewClient";

import {pageList} from "./pages";

export default class IndexRouter extends React.Component {

    render() {

        const pages = pageList.map(([page, path], i) => {
            if(typeof page === "string")
                return <MarkdownRoute file={page} path={path} key={i} />;
            if(page.prototype instanceof React.Component)
                return <Route component={page} path={path} key={i} />;
            throw new Error("Invalid page type: " + typeof page);
        });
        console.log(pages);

        return (
            <BrowserRouter>
                <Switch>
                    <Route component={ASComposer}               path={'/composer'} />
                    <Route component={SongProxyWebViewClient}   path={['/blank', '/proxy']} />
                    <Route component={ASPlayer}                 path={['/player', '/p']}/>

                    {pages}

                    <Route path="/"
                        render={(props) => {
                            switch(props.location.search) {
                                case '?blank':
                                case '?proxy':
                                    return <SongProxyWebViewClient/>;
                                default:
                                    const [Page, path] = pageList[0];
                                    if(typeof Page === "string")
                                        return <MarkdownPage file={Page} path={path} {...props}/>;
                                    if(Page.prototype instanceof React.Component)
                                        return <Page {...props} />;
                                    throw new Error("Invalid page type: " + typeof Page);
                            }
                        }}
                    />
                </Switch>
            </BrowserRouter>
        );
    }

}
