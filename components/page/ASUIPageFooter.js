import * as React from "react";

import "./assets/ASUIPage.css";

export default class ASUIPageFooter extends React.Component {
    render() {
        const links = this.props.links;
        return (
            <div className="asui-page-footer" >
                {links ? <div className="links">
                    {links.map(([href, title], i) => {
                        const props = {
                            href
                        };
                        if(this.props.currentPath === href)
                            props.className = 'selected';
                        return <a key={i} {...props}>{title}</a>
                    } )}
                </div> : null}
                <div className="text">
                    Created by <a href="https://github.com/clevertree/" target="_blank" rel="noopener noreferrer">Ari Asulin</a>
                </div>
            </div>
        );
    }


}
