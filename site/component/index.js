import Paragraph from "./paragraph/Paragraph";
import Link from "./link/Link";
import ImageLink from "./link/ImageLink";
import Header from "./header/Header";
import Markdown from "./markdown/MarkDown"

const HTML = {
    P:Paragraph,
    A:Link,
    ImgA:ImageLink,
    Header
}

export {
    HTML,
    Paragraph,
    Link,
    ImageLink,
    Header,
    Markdown
}
