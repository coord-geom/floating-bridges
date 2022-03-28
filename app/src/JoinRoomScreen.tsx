import logo from './logo.svg';
import cards from './cards.gif';
import './JoinRoomScreen.css';
import React, { FC, useState } from "react"
import ReactDOM from "react-dom"
import {io} from 'socket.io-client'

function JoinRoom() {
  const [text, setText] = useState<string>(
    ""
  )
  const socket = io('http://localhost:3000') //the webpage which the server is hosted on



  return (
    <div>
      
    </div>
  )
}


export default JoinRoom;
