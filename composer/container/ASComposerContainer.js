import React from "react";
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIIcon} from "../../components";
import ASUIMenuOverlayContainer from "../../components/menu/overlay/ASUIMenuOverlayContainer";

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
            container: React.createRef(),
            menu: {
                file: React.createRef(),
                edit: React.createRef(),
                track: React.createRef(),
                program: React.createRef(),
                view: React.createRef(),
            }
        }
    }

    getContainerElement() {
        return this.ref.container.current;
    }


    render() {
        const state = this.props.composer.state;
        return (
            <div className={"asc-container"
                + (state.fullscreen ? ' fullscreen' : '')
                + (state.portrait ? ' portrait' : ' landscape')}
                ref={this.ref.container}>
                <ASUIMenuOverlayContainer
                    isActive={state.portrait}
                >
                    {this.renderHeader()}
                    {this.renderContent()}
                    {this.renderFooter()}
                </ASUIMenuOverlayContainer>
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
        if (state.portrait)
            return (
                <div className="asc-header-container">
                    <div className="asc-title-text">{state.title}</div>
                    <ASUIMenuDropDown
                        arrow={false}
                        className="asc-menu-button-toggle"
                        options={() => this.props.composer.renderRootMenu(this.ref.menu)}
                    >
                        <ASUIIcon source="menu"/>
                    </ASUIMenuDropDown>
                </div>
            );

        return (
            <div className="asc-header-container">
                <div key="title" className="asc-title-text">{state.title}</div>
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

    openMenu(menuName) {
        const menu = this.ref.menu[menuName];
        if(!menu)
            throw new Error("Menu not found: " + menu);
        if(!menu.current)
            throw new Error("Menu not rendered: " + menu);
        menu.current.openDropDown();
    }

    /** Input **/
}
