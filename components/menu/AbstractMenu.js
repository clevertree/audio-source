import React from "react";

import './assets/Menu.css';

const activeSubMenus = [];
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

    addActiveSubMenu() {
        activeSubMenus.push(this);
    }
    removeActiveSubMenu() {
        for(let i=activeSubMenus.length-1; i>=0; i--) {
            if(activeSubMenus[i] === this)
                activeSubMenus.splice(i, 1);
        }
    }


    closeAllSubMenus() {
        activeSubMenus.forEach(activeMenu => activeMenu.closeMenu());
    }
}


export default AbstractMenu;
