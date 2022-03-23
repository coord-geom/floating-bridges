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
  selLst: boolean[]
  playerNum: number
  handleClickCard: (index:number) => void
  handleClickSubmit: () => number  
}

export const Hand:FC<HandProps> = (props) => {
  const getSuit = (card:number) => {
    return Math.floor(card/13)
  }

  const getNumber = (card:number) => {
    return card%13
  }

  return (
    <div className='flex'>
      {props.selLst.map((val, i) => 
        <Card 
          suit={getSuit(props.cardLst[i])} 
          num={getNumber(props.cardLst[i])} 
          hidden={false} 
          selected={val} 
          handleClick={() => props.handleClickCard(i)}
          key={i}
          total={props.cardLst.length}
        />
      )}
      <button type="button" onClick={props.handleClickSubmit}>
        Confirm!
      </button>
    </div>
  );
}


/*** Some functions and global variables that I need to set such that it isnt initalized 
 * like every fucking time a click happens ***/
/**************************************************************************************************/
type cardSelected = boolean

var playerNum = 1 //TODO should be const: change when establishing multiplayer

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

const genCards = () => {
  console.log("generating cards!")
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

  /*console.log(cardList1)
  console.log(cardList2)
  console.log(cardList3)
  console.log(cardList4)*/

  return [cardList1, cardList2, cardList3, cardList4]
}

const cardInitList = genCards()[playerNum]
var cardList = [...cardInitList]
/**************************************************************************************************/

function App() {
  const [selLst, setSelLst] = useState<cardSelected[]>(
    Array(cardList.length).fill(false)
  )

  const updateSelected = (cardNum: number) => {
    setSelLst((prev) => {
      for (var i in prev){
        prev[i] = false
      }
      prev[cardNum] = true
      return [...prev]
    })
  }
  
  const handleClickCard = (index:number) => {
    console.log("Card " + index + " was clicked!!")
    updateSelected(index)
    console.log(selLst)
    console.log(cardInitList)
  }

  // This function removes the selected card, if any, and outputs the card num of the removed card. 
  // TODO this function will have to be changed to check for the legality of the card removed. 
  // TODO this function will have to be changed to communicate with the server
  const handleClickSubmit = () => {
    var selected = -1
    for (var i = 0; i < selLst.length; ++i){
      if (selLst[i]) selected = i
    }

    if (selected === -1){
      // eslint-disable-next-line no-restricted-globals
      const hahaWhatsThisIJustWannaSuppressTheWarningLmfao = confirm("Please Select a Card!")
      return -1
    }
    else {
      const cardRemoved = cardList[selected]
      
      var cardLstNew = []
      for (var i = 0; i < cardList.length; ++i){
        if (i!=selected){
          cardLstNew.push(cardList[i])
        }
      }
      cardList = cardLstNew
      
      console.log(cardList)
      return cardRemoved
    }
  }



  return (
    <div className='flex-display'>
      <Hand 
        cardLst={cardList}
        selLst={selLst}
        playerNum={playerNum}
        handleClickCard={handleClickCard}
        handleClickSubmit={handleClickSubmit}
      />
    </div>
  )
}


export default App;
