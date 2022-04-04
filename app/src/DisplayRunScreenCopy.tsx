
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
  plays: {
    cards: number[]
    start: number
    win: number
    desc: string   // EG: "Round: 1\nPlayer 2 starts\nPlayer 1 wins."
  }[]
  winners:[number, number]
}

const suits = ["clubs", "diamonds", "hearts", "spades"]
const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace']

interface CardProps {
  suit: number, //heart, dim, club, spade
  num: number, //2 to Ace
  key: number, //position number
}

export const Card: FC<CardProps> = (props) => {
  //const path = "./sprites/" + numbers[props.num] + "_of_" + suits[props.suit] + ".png"
  const cardName = numbers[props.num] + " of " + suits[props.suit]

  const clubs    = [require("./sprites/2_of_clubs.png"), require("./sprites/3_of_clubs.png"), require("./sprites/4_of_clubs.png"), require("./sprites/5_of_clubs.png"), require("./sprites/6_of_clubs.png"), require("./sprites/7_of_clubs.png"), require("./sprites/8_of_clubs.png"), require("./sprites/9_of_clubs.png"), require("./sprites/10_of_clubs.png"), require("./sprites/jack_of_clubs2.png"), require("./sprites/queen_of_clubs2.png"), require("./sprites/king_of_clubs2.png"), require("./sprites/ace_of_clubs.png")]
  const diamonds = [require("./sprites/2_of_diamonds.png"), require("./sprites/3_of_diamonds.png"), require("./sprites/4_of_diamonds.png"), require("./sprites/5_of_diamonds.png"), require("./sprites/6_of_diamonds.png"), require("./sprites/7_of_diamonds.png"), require("./sprites/8_of_diamonds.png"), require("./sprites/9_of_diamonds.png"), require("./sprites/10_of_diamonds.png"), require("./sprites/jack_of_diamonds2.png"), require("./sprites/queen_of_diamonds2.png"), require("./sprites/king_of_diamonds2.png"), require("./sprites/ace_of_diamonds.png")]
  const hearts   = [require("./sprites/2_of_hearts.png"), require("./sprites/3_of_hearts.png"), require("./sprites/4_of_hearts.png"), require("./sprites/5_of_hearts.png"), require("./sprites/6_of_hearts.png"), require("./sprites/7_of_hearts.png"), require("./sprites/8_of_hearts.png"), require("./sprites/9_of_hearts.png"), require("./sprites/10_of_hearts.png"), require("./sprites/jack_of_hearts2.png"), require("./sprites/queen_of_hearts2.png"), require("./sprites/king_of_hearts2.png"), require("./sprites/ace_of_hearts.png")]
  const spades   = [require("./sprites/2_of_spades.png"), require("./sprites/3_of_spades.png"), require("./sprites/4_of_spades.png"), require("./sprites/5_of_spades.png"), require("./sprites/6_of_spades.png"), require("./sprites/7_of_spades.png"), require("./sprites/8_of_spades.png"), require("./sprites/9_of_spades.png"), require("./sprites/10_of_spades.png"), require("./sprites/jack_of_spades2.png"), require("./sprites/queen_of_spades2.png"), require("./sprites/king_of_spades2.png"), require("./sprites/ace_of_spades2.png")]

  const cardImages = [clubs, diamonds, hearts, spades]

  return (
    <img src={cardImages[props.suit][props.num]} alt={cardName} 
    className={"card-display"} />
  );
  
}

interface DisplayCellProps{
  infoType: number //String or image
  cardNum?: number
  text?: string
  theme: string
}

const DisplayCell:FC<DisplayCellProps> = (props) => {
  const getSuit = (card:number) => {
    if (card < 0) return 0
    return Math.floor(card/13)
  }
  const getNumber = (card:number) => {
    if (card < 0) return 0
    return card%13
  }

  if (props.infoType === 1 && props.cardNum !== undefined){ //card
    return (
      <div className={props.theme}>
        <Card key={props.cardNum} suit={getSuit(props.cardNum)} num={getNumber(props.cardNum)} />
      </div>
    )
  }
  else if (props.text !== undefined){
    return (
      <div className={props.theme}>
        <p className='p'>{props.text}</p>
      </div>
    )
  } else{
    return (
      <div className={props.theme}>
      </div>
    )
  }
}

interface DisplayRowProps {
  rowData: DisplayCellProps[]
}


const DisplayRow:FC<DisplayRowProps> = (props) => {

  return (
    <div className='flex-row-display'>
      {
        props.rowData.map((val, i) => 
          <DisplayCell 
            infoType={val.infoType} 
            theme={val.theme}
            cardNum={val.cardNum}
            text={val.text}
          />
        )
      }
    </div>
  )
}

interface DisplayRunsProps{
  infor: roundInfo
  onCLickNew: () => void
  onClickReturn: () => void
}

const DisplayRuns:FC<DisplayRunsProps> = (props) => {  
  
  const bids       = props.infor.bids
  const winnerId   = (bids.length)%4
  const winningBid = bids[bids.length-1] % 5
  const partner    = props.infor.partner
  const plays      = props.infor.plays  
  const winners    = props.infor.winners
  

  var data:DisplayCellProps[][] = []

  // Column Headers
  data.push([])
  for (var i = 0; i < 4; ++i){
    data[data.length-1].push(
      {
        infoType: 0,
        theme: "box-partner-not",
        text: "Player " + (i+1)
      }
    )
  }
  data[data.length-1].push(
    {
      infoType: 0,
      theme: "box-partner-not",
      text: "-"
    }
  )

  // Bids
  const bidSuits = ["Club", "Diamond", "Heart", "Spade", "No Trump"]
  const getBidString = (id:number)=>{
    if (id === -1) return "-"
    return Math.ceil((id + 1)/5) + " " + bidSuits[(id) % 5]
  }

  //Adding additional buffer so stuff is nice
  while (bids.length%4 !== 0){
    bids.push(-2)
  }

  for (var i = 0; i < bids.length; ++i){
    if (i%4 === 0){
      data.push([])
    }
    if (bids[i] === -2) {
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-bidding-extra",
          text: ""
        }
      )
    }
    else {
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-bidding",
          text: getBidString(bids[i])
        }
      )
    }
    if (i%4 === 3){
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-bidding",
          text: "Bidding Phase"
        }
      )
    }
  }

  // Calling Partner
  data.push([])
  for (var i = 0; i < 4; ++i){
    if (i === partner.id){
      data[data.length-1].push(
        {
          infoType: 1,
          theme: "box-partner",
          cardNum: partner.card
        }
      )
    } 
    else if (i === winnerId){
      console.log(winnerId)
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-partner",
          text: ""
        }
      )
    }
    else {
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-partner-not",
          text: ""
        }
      )
    }
  }
  data[data.length-1].push(
    {
      infoType: 0,
      theme: "box-partner",
      text: "Partner Call"
    }
  )

  // Playing
  const setsWon = [0,0,0,0]
  var startPlayer = (winningBid === 4) ? winnerId : (winnerId+1)%4
  for (var i = 0; i < plays.length; ++i){
    const round = plays[i]
    setsWon[round.win]+=1
    data.push([])
    for (var j = 0; j < 4; ++j){
      const index = (4-startPlayer+j)%4
      if (index === round.win){
        data[data.length-1].push(
          {
            infoType: 1,
            theme: "box-card-win",
            cardNum: round.cards[index]
          }
        )
      } 
      else if (index === round.start){
        data[data.length-1].push(
          {
            infoType: 1,
            theme: "box-card-start",
            cardNum: round.cards[index]
          }
        )
      }
      else {
        data[data.length-1].push(
          {
            infoType: 1,
            theme: "box-card-norm",
            cardNum: round.cards[index]
          }
        )
      }
    }
    data[data.length-1].push(
      {
        infoType: 0,
        theme: "box-card-norm",
        text: round.desc
      }
    )
    startPlayer = round.win
  }

  // Results
  data.push([])
  for (var i = 0; i < 4; ++i){
    data[data.length-1].push(
      {
        infoType: 0,
        theme: "box-end-win",
        text: setsWon[i] + " sets Won!"
      }
    )
  }
  data[data.length-1].push(
    {
      infoType: 0,
      theme: "box-end-win",
      text: "Results"
    }
  )

  data.push([])
  for (var i = 0; i < 4; ++i){
    if (i === winners[0] || i === winners[1]){
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-end-win",
          text: "Player " + (i+1) + " wins"
        }
      )
    } 
    else {
      data[data.length-1].push(
        {
          infoType: 0,
          theme: "box-end-lose",
          text: ""
        }
      )
    }
  }
  data[data.length-1].push(
    {
      infoType: 0,
      theme: "box-end-win",
      text: "Results"
    }
  )


  return (
    <div className='all-div-display'>
      <div className='text-title-display'>
        <p className='display-title'>Simulate AI!</p>
        <button onClick={props.onCLickNew} className="display-button"> Run New Game! </button>
        <button onClick={props.onClickReturn} className="display-button"> Back! </button>
      </div>
      <div className='flex-main-display'>
        {
          data.map((val, i) => 
            <DisplayRow rowData={val}/>
          )
        }
      </div>
    </div>
  )
}


export default DisplayRuns;
