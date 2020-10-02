import * as React from "react";
import PropTypes from "prop-types";
import ASUIPageContainer from "../page/ASUIPageContainer";
import ASUIMarkdown from "./ASUIMarkdown";


export default class ASUIPageMarkdown extends React.Component {
    /** Property validation **/
    static propTypes = {
        file: PropTypes.string.isRequired,
    };


    constructor(props) {
        super(props);
        this.state = {
            content: null
        }
        // console.log('props', props);
    }

    componentDidMount() {
        const filePath = this.props.file;
        fetch(filePath).then((response) => response.text()).then((content) => {
            this.setState({ content })
        })
    }

    render() {
        if(this.props.updateLinkTargets)
            setTimeout(updateLinkTargets, 1000);
        return (
            <ASUIPageContainer {...this.props}>
                <ASUIMarkdown
                    trim={false}>
                    {this.state.content || "Loading " + this.props.file}
                </ASUIMarkdown>
            </ASUIPageContainer>
        );
    }
}


function updateLinkTargets() {
    var all_links = document.querySelectorAll('a');
    for (var i = 0; i < all_links.length; i++){
        var a = all_links[i];
        if(a.hostname != document.location.hostname) {
            a.rel = 'noopener';
            a.target = '_blank';
            // console.log("Link is external: ", a);
        }
    }
}
