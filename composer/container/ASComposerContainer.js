import React from "react";
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIIcon} from "../../components";
import ASUIMenuOverlayContainer from "../../components/menu/overlay/ASUIMenuOverlayContainer";

import "./assets/ASComposerContainer.css";

export class ASComposerContainer extends React.Component {
    /** Property validation **/
    static propTypes = {
        // children: PropTypes.any.isRequired,
        // portrait: PropTypes.bool.isRequired
    };


    render() {
        const state = this.props.composer.state;
        return (
            <div className={["asc-container", state.portrait ? 'portrait' : 'landscape'].join(' ')}>
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
                <div className="asc-header-container portrait">
                    <div className="asc-title-text">{state.title}</div>
                    <ASUIMenuDropDown
                        arrow={false}
                        className="asc-menu-button-toggle"
                        options={() => this.props.composer.renderRootMenu()}
                    >
                        <ASUIIcon source="menu"/>
                    </ASUIMenuDropDown>
                </div>
            );

        return (
            <div className="asc-header-container">
                <div key="title" className="asc-title-text">{state.title}</div>
                <div className="asc-menu-container">
                    {this.props.composer.renderRootMenu()}
                </div>
            </div>
        );
    }

    renderFooter() {
        const state = this.props.composer.state;
        return (
            <div key="footer" className="asc-footer-container">
                <div className="asc-status-text">{state.status}</div>
                <div className="asc-version-text"
                     ref={this.footerVersionText}
                >{state.version}</div>
            </div>
        );
    }
}
