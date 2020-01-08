{
    const thisScriptPath = 'common/ui/asui-menu.js';
    const isRN = typeof document === 'undefined';
    const thisModule = isRN ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const require =  isRN ? window.require : customElements.get('audio-source-loader').getRequire(thisModule);

    /** Required Modules **/
    const {
        ASUIDiv,
        ASUIComponent,
        ASUITouchableHighlight
    } = require('asui-component.js');

    class ASUIMenu extends ASUIComponent {

        constructor(props = {}) {
            super(props, {
                offset: 0,
                maxLength: 20,
                optionCount: 0,
                open: false,
                stick: false,
            });
            // this.props.stick = false;
            // this.props.open = false;
            // this.action = actionCallback;
            // this.addEventHandler('mouseover', this.onInputEvent);
            // this.addEventHandler('mouseout', this.onInputEvent);
            // this.addEventHandler('mouseout', e => this.onInputEvent(e), document);
            // this.addEventHandler('click', this.onInputEvent);
            // this.addEventHandler('change', this.onInputEvent);
            // this.addEventHandler('keydown', this.onInputEvent);
        }

        // getAttributeMap() {
        //     return {
        //         class: 'class',
        //         stick: 'stick',
        //         open: 'open',
        //         // vertical: 'vertical',
        //     }
        // }

        // static getDefaultProps() {
        //     const callback = e => this.onInputEvent(e);
        //     return {
        //         onKeyDown: callback,
        //         onChange: callback,
        //         onMouseOut: callback,
        //         onMouseOver: callback,
        //         onPress: callback,
        //         onPressIn: callback,
        //         onPressOut: callback,
        //     };
        // }
        // async setTitle(newTitle) {
        //     this.state.menuContent = newTitle;
        //     if(this.menuContent)
        //         await this.menuContent.setState({content: newTitle});
        //     else
        //         await this.setState({title});
        // }

        connectedCallback() {
            super.connectedCallback();
            ['mouseover', 'mouseout', 'click', 'change', 'keydown']
                .forEach(eventName => this.addEventListener(eventName, this.onInputEvent));
        }

        disconnectedCallback() {
            super.disconnectedCallback();
            ['mouseover', 'mouseout', 'click', 'change', 'keydown']
                .forEach(eventName => this.removeEventListener(eventName, this.onInputEvent));
        }

        renderBrowser() {
            let arrow = false;
            if(this.props.dropDownContent && typeof this.props.vertical === "undefined" && typeof this.props.arrow === "undefined")
                arrow = true;
            let children = this.getChildren();
            if(typeof children === "function")
                children = children(this);
            const content = [
                ASUITouchableHighlight.cE({
                    class: this.state.stick ? 'stick' : null
                }, [
                    this.menuContent = (typeof children === "string" ? ASUIDiv.createElement('title', children) : null),
                    this.props.arrow ? ASUIDiv.createElement('arrow', this.props.vertical ? '▼' : '►') : null,
                ]),
                !this.state.open ? null : ASUIDiv.cE({
                    class: 'dropdown' + (this.props.vertical ? ' vertical' : ''),
                    onWheel: e => this.onInputEvent(e)
                }, this.props.dropDownContent),
                // this.props.hasBreak ? ASUIDiv.createElement('break') : null,
            ];

            // this.dropdown.addEventHandler('wheel', e => this.onInputEvent(e));
            console.log('ASUIMenu', content);
            return content;
        }

        renderReactNative() {
            const {Slider} = require('@react-native-community/slider');
            throw new Slider;
        }

        render() {
            return isRN ? this.renderReactNative() : this.renderBrowser();
        }

        renderOptions(offset=0, length=20) {
            let i=0;
            const contentList = [];
            this.eachContent(this.props.dropDownContent, (content) => {
                if(i < offset);
                else if(contentList.length < length)
                    contentList.push(content);
                i++;
            });
            if(offset > length) {
                this.eachContent(this.props.dropDownContent, (content) => {
                    if (contentList.length < length)
                        contentList.push(content);
                });
            }
            if(offset + length < i) {
                const left = i - (offset + length);
                contentList.push(ASUIMenu.createElement({}, `${left} items left`))
            }
            // while(contentList.length < length && offset > contentList.length)
            //     contentList.push(ASUIMenu.createElement({}, '-'));
            this.state.optionCount = i;
            return contentList;
        }

        async toggleSubMenu(e) {
            const open = !this.state.stick;
            let parentMenu = this;
            while(parentMenu) {
                await parentMenu.setState({stick:open});
                parentMenu = parentMenu.parentNode.closest('asui-menu');
            }
            await this.open();
        }

        async close() {
            if(this.state.open !== false) {
                this.setState({open: false, stick:false});
                // await this.dropdown.setContent(null);
            }
        }
        async open() {
            if(this.state.open !== true) {
                this.setState({open: true});
                // await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
            }
            this.closeAllMenusButThis();
        }

        async openContextMenu(e) {
            this.setProps({
                style: {
                    left: e.clientX,
                    top: e.clientY
                }
            });
            await this.open();
        }

        closeAllMenus(includeStickMenus=false) {
            const root = this.getRootNode() || document;
            root.querySelectorAll(includeStickMenus ? 'asui-menu[open]:not([stick])' : 'asui-menu[open]')
                .forEach(menu => menu.close())
        }

        closeAllMenusButThis() {
            const root = this.getRootNode() || document;
            root.querySelectorAll('asui-menu[open]:not([stick])')
                .forEach(menu => {
                    if(menu !== this
                        && !menu.contains(this)
                        && !this.contains(menu))
                        menu.close()
                })
        }

        onInputEvent(e) {
            // const menuElm = e.target.closest('asui-menu');
            // if (this !== menuElm)
            //     return; // console.info("Ignoring submenu action", this, menuElm);

            // console.log(e.type, this);
            switch (e.type) {
                case 'mouseover':
                    clearTimeout(this.mouseTimeout);
                    this.mouseTimeout = setTimeout(e => {
                        this.open();
                    }, 100);
                    break;

                case 'mouseout':
                    if(!this.state.stick) {
                        clearTimeout(this.mouseTimeout);
                        this.mouseTimeout = setTimeout(e => {
                            this.close();
                        }, 400);
                    }
                    break;

                case 'click':
                    if (e.defaultPrevented)
                        return;
                    e.preventDefault();

                    if (this.action) {
                        this.action(e, this);
                        this.closeAllMenus();
                    } else {
                        this.toggleSubMenu(e);
                    }
                    break;

                case 'keydown':
                    if (e.defaultPrevented)
                        return;
                    e.preventDefault();

                    const containerElm = this.containerElm;
                    const selectedMenuElm = containerElm
                        .querySelector('asui-menu.selected') || containerElm.firstElementChild;
                    if (!selectedMenuElm)
                        throw new Error("No selected menu item found");

                    let keyEvent = e.key;
                    switch (keyEvent) {
                        case 'Escape':
                        case 'Backspace':
                            this.closeMenu(e);
                            break;

                        case 'Enter':
                            if (selectedMenuElm.hasAction) {
                                selectedMenuElm.doAction(e);
                            } else if (selectedMenuElm.hasSubMenu) {
                                selectedMenuElm.toggleSubMenu(e);
                            } else {
                                return console.warn("Menu has no submenu or action: ", selectedMenuElm);
                            }

                            break;

                        // ctrlKey && metaKey skips a measure. shiftKey selects a range
                        case 'ArrowRight':
                            if (selectedMenuElm.hasSubMenu) {
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

                case 'wheel':
                    if(e.defaultPrevented)
                        break;
                    e.preventDefault();
                    let offset = this.state.offset;
                    if(e.deltaY < 0) offset--; else offset++;
                    if(this.state.optionCount) {
                        if (offset > this.state.optionCount)
                            offset = 0;
                        else if (offset < 0)
                            offset = this.state.optionCount;
                    }
                    this.setState({offset});
//                     console.log(e);
                    break;
            }

            // if(target.classList.contains('open')) {
            //     target.dispatchEvent(new CustomEvent('open'));
            // } else {
            //     this.clearSubMenu();
            // }
        }
        static createMenuElement(props, children=null, dropDownContent=null) {
            return this.createElement(props, children, {
                dropDownContent
            });
        }
        static cME(props, children=null, dropDownContent=null) {
            return this.createMenuElement(props, children, dropDownContent);
        }
    }
    customElements.define('asui-menu', ASUIMenu);



    /** Export this script **/
    thisModule.exports = {
        ASUIMenu,
    };
}