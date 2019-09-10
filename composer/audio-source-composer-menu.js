class AudioSourceComposerMenu extends HTMLElement {
    constructor() {
        super();

        // Default action sticks the menu, and opens the submenu if there is one
        this.action = null;
        this.populate = null; // function() { this.dispatchEvent(new CustomEvent('open')); };
        this.mouseTimeout = null;
        this.caption = null
    }


    // get caption()             { return this.getAttribute('caption'); }
    // set caption(captionElm)    {
    //     this.captionElm = captionElm;
    //     // captionElm ? this.setAttribute('caption', captionElm) : this.removeAttribute('caption');
    //     this.render();
    // }

    get key()             { return this.getAttribute('key'); }
    set key(keyName)    {
        this.setAttribute('key', keyName);
        this.render();
    }

    get disabled()             { return this.getAttribute('disabled') == 'true'; }
    set disabled(disabled)    {
        disabled ? this.setAttribute('disabled', 'true') : this.removeAttribute('disabled');
        // this.render();
    }


    get hasBreak()             { return this.getAttribute('hasBreak'); }
    set hasBreak(hasBreak)    {
        this.setAttribute('hasBreak', hasBreak);
        this.render();
    }


    get editor() {
        const editor = this.closest('div.asc-container').parentNode.host;
        if(!editor)
            throw new Error("Editor not found");
        return editor;
    }



    // get isSubMenu() { return this.closest('dropdown-container'); }
    //
    // set onopen(callback) {
    //     this.addEventListener('open', callback);
    // }

    connectedCallback() {
        // this.editor = this.getRootNode().host;
        const captionAttr = this.getAttribute('caption');
        if(captionAttr)
            this.caption = captionAttr;

        this.addEventListener('mouseenter', this.onInputEvent);
        this.addEventListener('mouseleave', this.onInputEvent);
        this.addEventListener('click', this.onInputEvent);
        this.addEventListener('change', this.onInputEvent);
        this.addEventListener('keydown', this.onInputEvent);
        this.render();
    }

    disconnectedCallback() {
        this.removeEventListener('mouseenter', this.onInputEvent);
        this.removeEventListener('mouseleave', this.onInputEvent);
        this.removeEventListener('click', this.onInputEvent);
        this.removeEventListener('change', this.onInputEvent);
        this.removeEventListener('keydown', this.onInputEvent);
    }



    onInputEvent(e) {
        if(!this.contains(e.target))
            return;
        const menuElm = e.target.closest('asc-menu');
        if(this !== menuElm)
            return; // console.info("Ignoring submenu action", this, menuElm);

//                 console.log(e.type, this);
        switch(e.type) {
            case 'mouseenter':
                clearTimeout(this.mouseTimeout);

                if(this.hasSubMenu) {
                    this.renderSubMenu(e);
                }
                break;

            case 'mouseleave':
                if(!this.classList.contains('stick')) {
                    clearTimeout(this.mouseTimeout);
                    this.mouseTimeout = setTimeout(e => {
                        this.clearSubMenu();
                    }, 200);
                }
                break;
            case 'click':
                if(e.defaultPrevented)
                    return;

                if(this.hasAction) {
                    e.preventDefault();
                    this.doAction(e);
                } else if(this.hasSubMenu) {
                    e.preventDefault();
                    this.toggleSubMenu(e);
                } else {
                    return console.warn("Menu has no submenu or action: ", this);
                }
                break;

            case 'keydown':
                if(e.defaultPrevented)
                    return;
                e.preventDefault();

                const containerElm = this.getSubMenuContainer();
                const selectedMenuElm = containerElm
                    .querySelector('asc-menu.selected') || containerElm.firstElementChild;
                if(!selectedMenuElm)
                    throw new Error("No selected menu item found");

                let keyEvent = e.key;
                switch (keyEvent) {
                    case 'Escape':
                    case 'Backspace':
                        this.closeMenu(e);
                        break;

                    case 'Enter':
                        if(selectedMenuElm.hasAction) {
                            selectedMenuElm.doAction(e);
                        } else if(selectedMenuElm.hasSubMenu) {
                            selectedMenuElm.toggleSubMenu(e);
                        } else {
                            return console.warn("Menu has no submenu or action: ", selectedMenuElm);
                        }

                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        if(selectedMenuElm.hasSubMenu) {
                            selectedMenuElm.toggleSubMenu(e);
                        } else {
                            return console.warn("Menu has no submenu: ", selectedMenuElm);
                        }
                        break;

                    case 'ArrowLeft':
                        this.closeMenu(e);
                        break;

                    case 'ArrowDown':
                        this.selectNextSubMenuItem();
                        break;

                    case 'ArrowUp':
                        this.selectPreviousSubMenuItem();
                        break;

                }
                break;
        }

        // if(target.classList.contains('open')) {
        //     target.dispatchEvent(new CustomEvent('open'));
        // } else {
        //     this.clearSubMenu();
        // }
    }

    get hasAction() {
        return !!this.action;
    }

    doAction(e) {
        if(!this.hasAction)
            throw new Error("No .action callback set");

        e.menuElement = this;
        this.action(e);
        this.closeAllMenus();
    }

    get hasSubMenu() {
        return !!this.populate;
    }

    toggleSubMenu(e) {
        if(this.classList.contains('open'))
            this.clearSubMenu(e);
        else
            this.renderSubMenu(e);

    }

    clearSubMenu(e) {
        // this.querySelectorAll('asc-menu')
        //     .forEach(menuItem => menuItem.parentNode.removeChild(menuItem));
        this.classList.remove('open');
        let containerElm = this.getSubMenuContainer();
        containerElm.innerHTML = '';
    }

    renderSubMenu(e) {
        if(!this.populate)
            throw new Error("Menu has no .populate callback");

        let containerElm = this.getSubMenuContainer();
        this.classList.add('open');

        e.menuElement = this;
        this.populate(e);

        containerElm.focus();
        const subMenuElms = containerElm.querySelectorAll('asc-menu:not([disabled])');
        if(subMenuElms[0])
            subMenuElms[0].classList.add('selected');

        // this.selectNextSubMenuItem();
    }

    getSubMenuContainer() {
        let containerElm = this.querySelector('.dropdown-container');
        if (!containerElm) {
            containerElm = document.createElement('div');
            containerElm.classList.add('dropdown-container');
            containerElm.setAttribute('tabindex', '0');
            this.appendChild(containerElm);
        }
        return containerElm;
    }

    getOrCreateSubMenu(key, caption=null) {
        key = key.toString();

        let containerElm = this.getSubMenuContainer();

        for(let i=0; i<containerElm.childNodes.length; i++) {
            const childNode = containerElm.childNodes[i];
            if(childNode.matches('asc-menu')) {
                if(childNode.key === key) {
                    return childNode;
                }
            }
        }

        const childNode = document.createElement('asc-menu');
        childNode.key = key;
        if(caption)
            childNode.caption = caption;
        containerElm.appendChild(childNode);
        return childNode;
    }
    // }

    selectNextSubMenuItem() {
        const containerElm = this.getSubMenuContainer();
        const currentMenuElm = containerElm.querySelector('asc-menu.selected');
        containerElm.querySelectorAll('asc-menu.selected')
            .forEach(menuElm => menuElm.classList.remove('selected'));
        // let selectedItem = currentItem && currentItem.nextElementSibling ? currentItem.nextElementSibling : containerElm.firstElementChild;

        const subMenuElms = containerElm.querySelectorAll('asc-menu:not([disabled])');
        let currentIndex = [].indexOf.call(subMenuElms, currentMenuElm);
        let selectedItem = currentIndex > -1 && currentIndex < subMenuElms.length - 1 ? subMenuElms[currentIndex + 1] : subMenuElms[0];
        selectedItem.classList.add('selected');
//         console.log("selectNextSubMenuItem", currentItem, selectedItem);
    }

    selectPreviousSubMenuItem() {
        const containerElm = this.getSubMenuContainer();
        const currentMenuElm = containerElm.querySelector('asc-menu.selected');
        containerElm.querySelectorAll('asc-menu.selected')
            .forEach(menuElm => menuElm.classList.remove('selected'));

        const subMenuElms = containerElm.querySelectorAll('asc-menu:not([disabled])');
        let currentIndex = [].indexOf.call(subMenuElms, currentMenuElm);
        let selectedItem = currentIndex > 0 ? subMenuElms[currentIndex - 1] : subMenuElms[subMenuElms.length - 1];
        // let selectedItem = currentItem && currentItem.previousElementSibling ? currentItem.previousElementSibling : containerElm.lastElementChild;
        selectedItem.classList.add('selected');
//         console.log("selectNextSubMenuItem", currentItem, selectedItem);
    }

    openContextMenu(e, targetElement=null) {
        targetElement = targetElement || e.target;
        const rect = targetElement.getBoundingClientRect();
        let containerElm = this.getSubMenuContainer();
        const containerRect = this.editor.getBoundingClientRect();
        let x = rect.x + rect.width - containerRect.x;
        let y = rect.y + rect.height - containerRect.y;
        this.clearSubMenu();
        this.renderSubMenu(e);
        // this.classList.add('stick');


        console.info("Context menu ", targetElement, containerElm, x, y);

        containerElm.classList.add('open-context-menu');
        this.classList.add('open', 'stick');

        containerElm.style.left = x + 'px';
        containerElm.style.top = y + 'px';

        // containerElm.focus();

        // this.selectNextSubMenuItem();
    }

    closeAllMenus() {
        let parentMenu = this;
        while(parentMenu.parentElement && parentMenu.parentElement.closest('asc-menu')) {
            parentMenu = parentMenu.parentElement.closest('asc-menu');
        }
        parentMenu.parentElement.querySelectorAll(`asc-menu.open,asc-menu.stick`)
            .forEach(menuElm => menuElm.classList.remove('open', 'stick'))
//         console.trace("Clear all menus ");
    }

    closeMenu(e) {
        // this.classList.remove('open');
        this.clearSubMenu(e);
        let parentMenu = this.parentElement.closest('asc-menu');
        this.querySelectorAll(`asc-menu.open,asc-menu.stick`)
            .forEach(menuElm => menuElm.classList.remove('open', 'stick'));
        if(parentMenu && parentMenu !== this)
            parentMenu.renderSubMenu(e);
    }

    render() {
        const titleElm = this.caption === null ? this.key : this.caption;
        if(titleElm) {
            let textDiv = this.querySelector('div');
            if (!textDiv) {
                textDiv = document.createElement('div');
                textDiv.classList.add('caption');
                this.firstElementChild ? this.insertBefore(textDiv, this.firstElementChild) : this.appendChild(textDiv);
            }
            textDiv.innerHTML = '';
            if(typeof titleElm === "string")
                textDiv.innerHTML = titleElm;
            else
                textDiv.appendChild(titleElm); // .replace('►', '<span class="arrow"></span>');

        }
        if(this.hasBreak) {
            let hrSpan = this.querySelector('hr');
            if (!hrSpan) {
                hrSpan = document.createElement('hr');
                this.firstElementChild ? this.insertBefore(hrSpan, this.firstElementChild) : this.appendChild(hrSpan);
            }
        }
    }
}


// customElements.define('music-song-menu', MusicEditorMenuElement);
customElements.define('asc-menu', AudioSourceComposerMenu);


