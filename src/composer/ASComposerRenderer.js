import React from "react";

import ASComposerRendererBase from "./ASComposerRendererBase";
import {ASUIContextMenuContainer, ASUIIcon, ASUIMenuDropDown} from "../components";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";
import ASComposerSongProgramsPanel from "./panel/ASComposerSongProgramsPanel";
import "./assets/ASComposer.css"

export default class ASComposerRenderer extends ASComposerRendererBase {


    renderContainer() {
        return (
            <div className={"audio-source-composer"
            + ((this.state.fullscreen || this.props.fullscreen) ? ' fullscreen' : '')
            + (this.state.portrait ? ' portrait' : ' landscape')}
                 ref={this.ref.container}>
                <ASUIContextMenuContainer
                    ref={this.ref.menu.contextContainer}
                    portrait={this.state.portrait}
                    composer={this}
                >
                    <div
                        className="asc-container">
                        {this.renderHeader()}
                        <div className="asc-content-container">
                            {this.state.portrait ? this.renderSongPanelPortrait() : this.renderSongPanelLandscape()}
                            {this.renderTracks()}
                            {this.state.showModal ? this.renderModals() : null}
                        </div>
                        {this.renderFooter()}
                    </div>
                </ASUIContextMenuContainer>
            </div>
        );
    }

    renderHeader() {
        const state = this.state;
        const title = this.song.data.title;
        if (state.portrait)
            return (
                <div className="asc-header-container">
                    <div className="asc-title-text">{title}</div>
                    <ASUIMenuDropDown
                        arrow={false}
                        className="asc-menu-button-toggle"
                        options={this.cb.renderRootMenu}
                    >
                        <ASUIIcon source="menu" size="large"/>
                    </ASUIMenuDropDown>
                </div>
            );

        return (
            <div className="asc-header-container">
                <div key="title" className="asc-title-text">{title}</div>
                <div className="asc-menu-container">
                    {this.cb.renderRootMenu()}
                </div>
            </div>
        );
    }

    renderFooter() {
        const state = this.state;
        return (
            <div key="footer" className="asc-footer-container">
                <div className={`asc-status-text ${state.statusType}`}>{state.statusText}</div>
                <div className="asc-version-text">{state.version}</div>
            </div>
        );
    }

    renderSongPanelPortrait() {
        return <>
            <ASComposerSongPanel composer={this} ref={this.ref.panelSong} />
            <div className="asui-panel-container-horizontal">
                <ASComposerTrackPanel composer={this} ref={this.ref.panelTrack} />
            </div>
            <ASComposerSongProgramsPanel composer={this} ref={this.ref.panelProgram}/>
        </>
    }

    renderSongPanelLandscape() {
        return <>
            <ASComposerSongPanel composer={this} ref={this.ref.panelSong} />

            <br className="asui-track-panel-break"/>
            <ASComposerTrackPanel composer={this} ref={this.ref.panelTrack} />
            <br className="asui-track-panel-break"/>
            <ASComposerSongProgramsPanel composer={this} ref={this.ref.panelProgram}/>
            <br />
        </>

    }

}

