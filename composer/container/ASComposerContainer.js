import React from "react";
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIDiv, ASUIIcon} from "../../components";
import PropTypes from 'prop-types';
import ASUIMenuOverlayContainer from "../../components/menu/ASUIMenuOverlayContainer.native";
import {View} from "react-native";

export class ASComposerContainer extends React.Component {
    /** Property validation **/
    static propTypes = {
        children: PropTypes.any.required,
        portrait: PropTypes.bool.required
    };


    render() {
        return (
            <div className={["asc-container", this.state.portrait ? 'portrait' : 'landscape'].join(' ')}>
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
        return (
            <div key="footer" className="asp-footer-container">
                <div className="asp-status-text">{this.state.status}</div>
                <div className="asp-version-text"
                     ref={this.footerVersionText}
                >{this.state.version}</div>
            </div>
        );
    }
}
