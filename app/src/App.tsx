import logo from './logo.svg';
import cards from './cards.gif';
import './App.css';
import React, { FC, useState } from "react"
import ReactDOM from "react-dom"

const suits = ["clubs", "diamonds", "hearts", "spades"]
const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace']

interface CardProps {
  suit: number, //heart, dim, club, spade
  num: number, //2 to Ace
  hidden: boolean,
  position?: number,
  total?: number
}

export const Card: FC<CardProps> = (props) => {
  const path = "./sprites/" + numbers[props.num] + "_of_" + suits[props.suit] + ".png"
  console.log(encodeURI(path))
  const cardName = numbers[props.num] + " of " + suits[props.suit]

  const handleClick = () => {

  }

  return (
    <button onClick={handleClick}>
      <img src={require(encodeURI(path))} alt={cardName} className='card'/>
    </button>
  );
  
}


function App() {
  return (
    <div>
      <Card suit={2} num={12} hidden={false}/>
    </div>
  );
}

export default App;
