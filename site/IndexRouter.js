import React from 'react';
import {
    Switch,
    Route,
    Redirect,
    BrowserRouter
} from "react-router-dom";

import {ASPlayer} from '../player';
import {ASComposer} from "../composer/";
import {MarkdownPage} from "./component";

import SongProxyWebViewClient from "../song/proxy/SongProxyWebViewClient";

import {pageList} from "./pages";

export default class IndexRouter extends React.Component {

    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route component={ASComposer}               path={'/composer'} />
                    <Route component={SongProxyWebViewClient}   path={['/blank', '/proxy']} />
                    <Route component={ASPlayer}                 path={['/player', '/p']}/>

                    {pageList.map(([page, path], i) => {
                        if (typeof page === "string")
                            return <Route path={path} key={i}>
                                {props => <MarkdownPage file={page} {...props} />}
                            </Route>;
                        if (page.prototype instanceof React.Component)
                            return <Route component={page} path={path} key={i}/>;
                        throw new Error("Invalid page type: " + typeof page);
                    })}

                    <Route path="/"
                        render={(props) => {
                            switch(props.location.search) {
                                case '?blank':
                                case '?proxy':
                                    return <SongProxyWebViewClient/>;
                                default:
                                    const homePage = pageList[0][1];
                                    return  <Redirect  to={homePage} />
                            }
                        }}
                    />
                </Switch>
            </BrowserRouter>
        );
    }

}
