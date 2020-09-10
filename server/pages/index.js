import DemoPage from "./DemoPage";

import HomePage from "./HomePage.md";
import AboutPage from "./AboutPage.md";
import DownloadsPage from "./DownloadsPage.md";
import ContactPage from "./ContactPage.md";

const pageList = [

/** Object,         Path            Title           Header      Footer **/
    [HomePage,      '/home',        'Home',         true,       true],
    [AboutPage,     '/about',       'About',        true,       false],
    [DemoPage,      '/demo',        'Demo',         true,       false],
    [DownloadsPage, '/downloads',   'Downloads',    true,       false],
    [ContactPage,   '/contact',     'Contact',      false,      true],

]

export {
    pageList,
}
