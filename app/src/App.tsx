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
  selected:boolean,
  handleClick: () => void,
  key: number, //position number
  total: number
}

export const Card: FC<CardProps> = (props) => {
  //const path = "./sprites/" + numbers[props.num] + "_of_" + suits[props.suit] + ".png"
  const cardName = numbers[props.num] + " of " + suits[props.suit]

  const cardImages = [[require("./sprites/2_of_clubs.png"), require("./sprites/3_of_clubs.png"), require("./sprites/4_of_clubs.png"), require("./sprites/5_of_clubs.png"), require("./sprites/6_of_clubs.png"), require("./sprites/7_of_clubs.png"), require("./sprites/8_of_clubs.png"), require("./sprites/9_of_clubs.png"), require("./sprites/10_of_clubs.png"), require("./sprites/jack_of_clubs2.png"), require("./sprites/queen_of_clubs2.png"), require("./sprites/king_of_clubs2.png"), require("./sprites/ace_of_clubs.png")]
                    , [require("./sprites/2_of_diamonds.png"), require("./sprites/3_of_diamonds.png"), require("./sprites/4_of_diamonds.png"), require("./sprites/5_of_diamonds.png"), require("./sprites/6_of_diamonds.png"), require("./sprites/7_of_diamonds.png"), require("./sprites/8_of_diamonds.png"), require("./sprites/9_of_diamonds.png"), require("./sprites/10_of_diamonds.png"), require("./sprites/jack_of_diamonds2.png"), require("./sprites/queen_of_diamonds2.png"), require("./sprites/king_of_diamonds2.png"), require("./sprites/ace_of_diamonds.png")]
                    , [require("./sprites/2_of_hearts.png"), require("./sprites/3_of_hearts.png"), require("./sprites/4_of_hearts.png"), require("./sprites/5_of_hearts.png"), require("./sprites/6_of_hearts.png"), require("./sprites/7_of_hearts.png"), require("./sprites/8_of_hearts.png"), require("./sprites/9_of_hearts.png"), require("./sprites/10_of_hearts.png"), require("./sprites/jack_of_hearts2.png"), require("./sprites/queen_of_hearts2.png"), require("./sprites/king_of_hearts2.png"), require("./sprites/ace_of_hearts.png")]
                    , [require("./sprites/2_of_spades.png"), require("./sprites/3_of_spades.png"), require("./sprites/4_of_spades.png"), require("./sprites/5_of_spades.png"), require("./sprites/6_of_spades.png"), require("./sprites/7_of_spades.png"), require("./sprites/8_of_spades.png"), require("./sprites/9_of_spades.png"), require("./sprites/10_of_spades.png"), require("./sprites/jack_of_spades2.png"), require("./sprites/queen_of_spades2.png"), require("./sprites/king_of_spades2.png"), require("./sprites/ace_of_spades2.png")]]

  return (
    <img src={cardImages[props.suit][props.num]} alt={cardName} 
    className={props.selected ? "card-selected" : "card"} onClick={props.handleClick}/>
  );
  
}

interface HandProps {
  cardLst: number[]
}

type cardSelected = boolean

export const Hand:FC<HandProps> = (props) => {
  const [hand, setHand] = useState<cardSelected[]>(
    Array(props.cardLst.length).fill(false)
  )

  const updateSelected = (cardNum: number) => {
    setHand((prev) => {
      for (var i in prev){
        prev[i] = false
      }
      prev[cardNum] = true
      return [...prev]
    })
  }
  
  const handleClick = (index:number) => {
    console.log("Card " + index + " was clicked!!")
    updateSelected(index)
    console.log(hand)
  }

  const getSuit = (card:number) => {
    return Math.floor(card/13)
  }

  const getNumber = (card:number) => {
    return card%13
  }

  return (
    <div className='flex'>
      {hand.map((val, i) => 
        <Card 
          suit={getSuit(props.cardLst[i])} 
          num={getNumber(props.cardLst[i])} 
          hidden={false} 
          selected={val} 
          handleClick={() => handleClick(i)}
          key={i}
          total={props.cardLst.length}
        />
      )}
    </div>
  );
}

function App() {
  const shuffle = (array:number[]) => {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }

  var allCards = Array.from(Array(52).keys())
  allCards = shuffle(allCards)
  var cardList1 = allCards.slice(0,13)
  var cardList2 = allCards.slice(13,26)
  var cardList3 = allCards.slice(26,39)
  var cardList4 = allCards.slice(39,52)
  cardList1 = cardList1.sort((a, b) => a - b)
  cardList2 = cardList2.sort((a, b) => a - b)
  cardList3 = cardList3.sort((a, b) => a - b)
  cardList4 = cardList4.sort((a, b) => a - b)

  console.log(cardList1)
  console.log(cardList2)
  console.log(cardList3)
  console.log(cardList4)

  /**\
 * <Hand 
        cardLst={cardList2}
      />
      <Hand 
        cardLst={cardList3}
      />
      <Hand 
        cardLst={cardList4}
      />
 */

  return (
    <div className='flex-display'>
      <Hand 
        cardLst={cardList1}
      />
    </div>
  )
}


export default App;
