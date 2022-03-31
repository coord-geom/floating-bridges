import logo from './logo.svg';
import cards from './cards.gif';
import './JoinRoomScreen.css';
import React, { FC, useState } from "react"
import ReactDOM from "react-dom"

function JoinRoom() {  
  const submitForm = () => {

  }
  // TODO change the placeholder text thing to something funnier
  return (
    <div className='all-div'>
      <div className="flex-main">
        <div className='flex-row'>
          <p className='text-p'>Room Code:</p>
          <input id = "roomCode" placeholder="XYZW" inputMode="text" className='text-input' />
        </div>
        <div className='flex-row'>
          <p className='text-p'>Name:</p>
          <input id = "name" placeholder="amogus" inputMode="text" className='text-input'/>
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
