
let menuCloseCallbacks = [];
class MenuManager {

    static selectNextTabItem(e) {
        const tabs = document.querySelectorAll('[tabindex]');
        let tabIndex = Array.prototype.indexOf.call(tabs, e.target);
        tabIndex++;
        tabs[tabIndex] && tabs[tabIndex].focus();
    }

    static selectPreviousTabItem(e) {
        const tabs = document.querySelectorAll('[tabindex]');
        let tabIndex = Array.prototype.indexOf.call(tabs, e.target);
        tabIndex--;
        tabs[tabIndex] && tabs[tabIndex].focus();
    }

    static addMenuCloseCallback(callback) {
        menuCloseCallbacks.push(callback);
    }
    static removeMenuCloseCallback(callback) {
        for(let i=menuCloseCallbacks.length-1; i>=0; i--) {
            if(menuCloseCallbacks[i] === callback)
                menuCloseCallbacks.splice(i, 1);
        }
    }

    static closeAllMenus(e) {
        menuCloseCallbacks.forEach(callback => callback(e));
        menuCloseCallbacks = [];
    }
}


export default MenuManager;
