

export default class GlobalStyle {
    static fontSize = 18;

    static getDefaultTextStyle() {
        return {
            fontSize: this.fontSize
        }
    }


    static setTextFontSize(newFontSize) {
        this.fontSize = newFontSize;
    }
}
