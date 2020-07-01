import * as React from "react";
import {PageContainer, Markdown} from "./component";

import PATH_README from '../README.md'

export default class AboutPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            readme: null
        }
    }

    componentWillMount() {
        fetch(PATH_README).then((response) => response.text()).then((content) => {
            this.setState({ readme: content })
        })
    }

    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <Markdown
                    trim={false}>
                    {this.state.readme || "Loading Readme..."}
                </Markdown>
            </PageContainer>
        );
    }
}


