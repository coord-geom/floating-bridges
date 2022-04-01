import logo from './logo.svg';
import cards from './cards.gif';
import './JoinRoomScreen.css';
import React, { FC, useState } from "react"
import ReactDOM from "react-dom"

import { socket } from '.';
import { createRef } from 'react';
import { InputType } from 'zlib';

interface JoinRoomProps{
  setInfor: (room: String, name:String, id:number) => void;
}

const JoinRoom:FC<JoinRoomProps> = (props) => {  
  const roomCodeRef = createRef<HTMLInputElement>()
  const nameRef = createRef<HTMLInputElement>()

  const submitForm = () => {
    const roomCode = roomCodeRef.current?.value
    const name = nameRef.current?.value

    var roomServer = ""

    if (roomCode == null){
      // eslint-disable-next-line no-restricted-globals
      confirm("No Room Code Was Entered!")
      return;
    }
    else if (roomCode.length !== 4) {
      // eslint-disable-next-line no-restricted-globals
      confirm("Room Code Should be Of Length 4")
      return;
    }
    else {
      for (var i =  0; i < 4; ++i){
        if (!(/[a-zA-Z]/).test(roomCode[i])) {
          // eslint-disable-next-line no-restricted-globals
          confirm("Room Code Should Only Contain Letters")
          return;
        }
      }
      roomServer = roomCode.toUpperCase()
    }

    if (name == null){
      // eslint-disable-next-line no-restricted-globals
      confirm("Please Enter a Name!")
      return;
    }
    else if (name.length === 0) {
      // eslint-disable-next-line no-restricted-globals
      confirm("Please Enter a Name!")
      return;
    }
    else{
      socket.emit("get-people-room", roomServer, name)
    }
  }
  // TODO change the placeholder text thing to something funnier
  return (
    <div className='all-div'>
      <div className="flex-main">
        <div className='flex-row'>
          <p className='text-p'>Room Code:</p>
          <input id = "roomCode" ref = {roomCodeRef} placeholder="XYZW" inputMode="text" className='text-input' />
        </div>
        <div className='flex-row'>
          <p className='text-p'>Name:</p>
          <input id = "name" ref = {nameRef} placeholder="amogus" inputMode="text" className='text-input'/>
        </div>
        <button className='text-button' onClick={submitForm}>Submit</button>
      </div>
      <div className='text-title'>
        <p className='text-long'>Hewwo welcome to me Bridge Game!!!!!!!!!</p>
      </div>
    </div>
  )
}


export default JoinRoom;
