import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AppRoom from './AppRoom';
import JoinRoom from './JoinRoomScreen';
import reportWebVitals from './reportWebVitals';
import {io} from 'socket.io-client'

const socket = io('http://localhost:3000') //the webpage which the server is hosted on

ReactDOM.render(
  <React.StrictMode>
    <AppRoom />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
