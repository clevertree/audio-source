import * as React from "react";
import {Markdown} from "./component";

import PageContainer from "./theme/PageContainer";

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
                <Markdown>
                    {this.state.readme || "Loading Readme..."}
                </Markdown>
            </PageContainer>
        );
    }
}


