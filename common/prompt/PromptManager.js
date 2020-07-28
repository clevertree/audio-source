
export default class PromptManager {

    /** Prompt **/

    static async openPromptDialog(message, defaultValue='') {
        console.log('openPromptDialog', message, defaultValue);
        return window.prompt(message, defaultValue);
    }

    static async openConfirmDialog(message) {
        return window.confirm(message);
    }
}
