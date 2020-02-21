import React from "react";

import './assets/Menu.scss';

class AbstractMenu extends React.Component {

    doMenuAction() { throw new Error("Implement") }


    selectNextTabItem(e) {
        const tabs = document.querySelectorAll('[tabindex]');
        let tabIndex = Array.prototype.indexOf.call(tabs, e.target);
        tabIndex++;
        tabs[tabIndex] && tabs[tabIndex].focus();
    }

    selectPreviousTabItem(e) {
        const tabs = document.querySelectorAll('[tabindex]');
        let tabIndex = Array.prototype.indexOf.call(tabs, e.target);
        tabIndex--;
        tabs[tabIndex] && tabs[tabIndex].focus();
    }

}


export default AbstractMenu;
