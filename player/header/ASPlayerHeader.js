import React from "react";
import {ASUIMenuDropDown} from "../../components/";
import {ASUIIcon} from "../../components";

export default class ASPlayerHeader extends React.Component {
    render() {
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
                </ASUIMenuDropDown>
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
}
