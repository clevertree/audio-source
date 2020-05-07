import React from "react";
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIIcon} from "../../components";
import PropTypes from 'prop-types';
import ASUIMenuOverlayContainer from "../../components/menu/overlay/ASUIMenuOverlayContainer";

export class ASComposerContainer extends React.Component {
    /** Property validation **/
    static propTypes = {
        children: PropTypes.any.isRequired,
        portrait: PropTypes.bool.isRequired
    };


    render() {
        const state = this.props.composer.state;
        return (
            <div className={["asc-container", state.portrait ? 'portrait' : 'landscape'].join(' ')}>
                <ASUIMenuOverlayContainer
                    isActive={this.props.portrait}
                >
                    {this.renderHeader()}
                    {this.props.children}
                    {this.renderFooter()}
                </ASUIMenuOverlayContainer>
            </div>
        );
    }

    renderHeader() {
        if (this.props.portrait)
            return [
                <div key="title" className="asp-title-text">{this.props.title}</div>,
                <ASUIMenuDropDown
                    key="menu-button"
                    arrow={false}
                    className="asp-menu-button-toggle"
                    options={this.props.menuContent}
                >
                    <ASUIIcon source="menu"/>
                </ASUIMenuDropDown>,
                this.props.children
            ];

        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent();

        return [
            <div key="title" className="asp-title-text">{this.props.title}</div>,
            <div className="asp-menu-container">
                {menuContent}
            </div>
        ];
    }

    renderFooter() {
        const state = this.props.composer.state;
        return (
            <div key="footer" className="asp-footer-container">
                <div className="asp-status-text">{state.status}</div>
                <div className="asp-version-text"
                     ref={this.footerVersionText}
                >{state.version}</div>
            </div>
        );
    }
}
