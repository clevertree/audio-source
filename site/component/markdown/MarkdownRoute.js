import PropTypes from "prop-types";
import {
    Route,
} from "react-router-dom";
import MarkdownPage from "./MarkdownPage";
import React from "react";


export default class MarkdownRoute extends Route {
    /** Property validation **/
    static propTypes = {
        file: PropTypes.string.isRequired,
    };


    render() {
        return <MarkdownPage {...this.props} />;
    }
}


