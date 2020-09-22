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


