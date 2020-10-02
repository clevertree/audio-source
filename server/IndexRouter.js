import React from 'react';
import {
    Switch,
    Route,
    Redirect,
    BrowserRouter
} from "react-router-dom";

import {ASPlayer} from '../player';
import {ASComposer} from "../composer/";

import SongProxyWebViewClient from "../song/proxy/SongProxyWebViewClient";

import {pageList as defaultPageList, themeName as defaultThemeName} from "./pages";
import ASUIPageMarkdown from "../components/markdown/ASUIPageMarkdown";

export default class IndexRouter extends React.Component {

    render() {
        const pageList = this.props.pageList || defaultPageList;
        const themeName = this.props.themeName || defaultThemeName;
        const pageProps = {
            pageList,
            themeName
        }
        return (
            <BrowserRouter>
                <Switch>
                    <Route path={'/composer'} >
                        {props => <ASComposer fullscreen {...props} {...pageProps} />}
                    </Route>
                    <Route component={SongProxyWebViewClient}   path={['/blank', '/proxy']} />
                    <Route component={ASPlayer}                 path={['/player', '/p']}/>

                    {pageList.map(([page, path], i) => {
                        if (typeof page === "string")
                            return <Route path={path} key={i}>
                                {props => <ASUIPageMarkdown file={page} updateLinkTargets {...props} {...pageProps} />}
                            </Route>;
                        if (page.prototype instanceof React.Component) {
                            const Page = page;
                            return <Route path={path} key={i}>
                                {props => <Page {...props} {...pageProps} />}
                            </Route>;
                        }
                        throw new Error("Invalid page type: " + typeof page);
                    })}

                    <Route path="/"
                        render={(props) => {
                            switch(props.location.search) {
                                case '?blank':
                                case '?proxy':
                                    return <SongProxyWebViewClient/>;
                                default:
                                    if(isInStandaloneMode) {
                                        return <ASComposer fullscreen {...props} {...pageProps} />;
                                    }
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

const isInStandaloneMode =
    (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');
