import React from "react";
import {ASUIIcon ,ASUIMenuDropDown, ASUIContextMenuContainer} from "../../components/";

import "./assets/ASComposerContainer.css";

export default class ASComposerContainer extends React.Component {
    /** Property validation **/
    static propTypes = {
        // children: PropTypes.any.isRequired,
        // portrait: PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.ref = {
            menuContextContainer: React.createRef(),
            container: React.createRef(),
            menu: {
                file: React.createRef(),
                edit: React.createRef(),
                track: React.createRef(),
                program: React.createRef(),
                view: React.createRef(),
                // playback: React.createRef(),
            }
        }
    }

    getContainerElement() {
        return this.ref.container.current;
    }


    render() {
        const state = this.props.composer.state;
        return (
            <div className={"audio-source-composer"
                + (state.fullscreen ? ' fullscreen' : '')
                + (state.portrait ? ' portrait' : ' landscape')}
                ref={this.ref.container}>
                <ASUIContextMenuContainer
                    ref={this.ref.menuContextContainer}
                    portrait={state.portrait}
                    composer={this.props.composer}
                >
                    <div
                        className="asc-container">
                        {this.renderHeader()}
                        {this.renderContent()}
                        {this.renderFooter()}
                    </div>
                </ASUIContextMenuContainer>
            </div>
        );
    }

    renderContent() {
        return (
            <div className="asc-content-container">
                {this.props.children}
            </div>
        );
    }

    renderHeader() {
        const state = this.props.composer.state;
        const title = this.props.composer.song.data.title;
        if (state.portrait)
            return (
                <div className="asc-header-container">
                    <div className="asc-title-text">{title}</div>
                    <ASUIMenuDropDown
                        arrow={false}
                        className="asc-menu-button-toggle"
                        options={() => this.props.composer.renderRootMenu(this.ref.menu)}
                    >
                        <ASUIIcon source="menu" size="large"/>
                    </ASUIMenuDropDown>
                </div>
            );

        return (
            <div className="asc-header-container">
                <div key="title" className="asc-title-text">{title}</div>
                <div className="asc-menu-container">
                    {this.props.composer.renderRootMenu(this.ref.menu)}
                </div>
            </div>
        );
    }

    renderFooter() {
        const state = this.props.composer.state;
        return (
            <div key="footer" className="asc-footer-container">
                <div className={`asc-status-text ${state.statusType}`}>{state.statusText}</div>
                <div className="asc-version-text">{state.version}</div>
            </div>
        );
    }

    /** Actions **/

    openMenuByKey(menuName) {
        const composer = this.props.composer;
        if(composer.state.portrait) {
            let options = composer.renderMenuByKey(menuName);
            /** @var {ASUIContextMenuContainer} **/
            const menuContextContainer = this.ref.menuContextContainer.current;
            menuContextContainer.openMenu(options);
            return;
        }
        const menu = this.ref.menu[menuName];
        console.log('menu', menu);
        if(!menu)
            throw new Error("Menu not found: " + menu);
        if(!menu.current)
            throw new Error("Menu not rendered: " + menu);
        menu.current.openDropDownMenu();
    }

    /** Input **/
}
