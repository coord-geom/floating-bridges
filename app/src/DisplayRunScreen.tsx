import logo from './logo.svg';
import cards from './cards.gif';
import './DisplayRunScreen.css';
import React, { FC, useState } from "react"
import ReactDOM from "react-dom"

import { socket } from '.';
import { createRef } from 'react';
import { InputType } from 'zlib';

export interface roundInfo {
  bids: number[]     // -1 for pass, 5*(bid) + suit
  partner: {
    card: number     // Similarly defined as above
    id: number       // The id of the player who the ml calls. We label the players 
  }                  // 0 to 3 from the beginning of the game
  plays: [
    {
      cards: number[]
      start: number
      win: number
      desc: string   // EG: "Round: 1\nPlayer 2 starts\nPlayer 1 wins."
    }
  ]
  winners:[number, number]
}

interface DisplayRunsProps{
  infor: roundInfo
  onCLick: () => void
}

const DisplayRuns:FC<DisplayRunsProps> = (props) => {  
  
  // TODO change the placeholder text thing to something funnier
  return (
    <div className='all-div'>
      <div className="flex-main">
        <div className='flex-row-join'>
          <p className='text-p'>Room Code:</p>
          <input id = "roomCode" ref = {roomCodeRef} placeholder="XYZW" inputMode="text" className='text-input' />
        </div>
        <div className='flex-row-join'>
          <p className='text-p'>Name:</p>
          <input id = "name" ref = {nameRef} placeholder="amogus" inputMode="text" className='text-input'/>
        </div>
        <button className='text-button' onClick={submitForm}>Submit</button>
      </div>
      <div className='text-title'>
        <p className='text-long'>Hewwo welcome to me Bridge Game nya~~~</p>
      </div>
    </div>
  )
}


export default DisplayRuns;
