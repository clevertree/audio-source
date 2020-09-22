import React from 'react';
import ReactDOM from 'react-dom';
// import './index.css';
import * as serviceWorker from './serviceWorker';
// eslint-disable-next-line no-unused-vars
import {IndexRouter} from "./server";
// import {ASComposer} from "./composer";

ReactDOM.render(<IndexRouter />, document.getElementById('root'));
// ReactDOM.render(<ASComposer />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if(navigator && navigator.serviceWorker)
serviceWorker.unregister();
