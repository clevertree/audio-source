import React from "react";

export default class PromptManager {

    /** Prompt **/

    static async openPromptDialog(message, defaultValue='') {
        return window.prompt(message, defaultValue);
    }

    static async openConfirmDialog(message) {
        return window.confirm(message);
    }
}
