import logo from './logo.svg';
import cards from './cards.gif';
import './AppRoom.css';
import React, { createRef, FC, useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { socket, makeid } from '.';

const suits = ["clubs", "diamonds", "hearts", "spades"]
const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace']

interface CardProps {
  suit: number, //heart, dim, club, spade
  num: number, //2 to Ace
  hidden: boolean,
  selected:boolean,
  handleClick: () => void,
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

  const hiddenCard = require("./sprites/back.png")

  return (
    <img src={props.hidden ? hiddenCard : cardImages[props.suit][props.num]} alt={cardName} 
    className={props.hidden ? "card-hidden" : props.selected ? "card-selected" : "card"} onClick={props.handleClick}/>
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
    if (card < 0) return 0
    return Math.floor(card/13)
  }

  const getNumber = (card:number) => {
    if (card < 0) return 0
    return card%13
  }

  return (
    <div className='flex-display'>
      {props.cardLst.map((val, i) => 
        <Card 
          suit={getSuit(val)} 
          num={getNumber(val)} 
          hidden={val < 0} 
          selected={props.selLst[i]} 
          handleClick={() => props.handleClickCard(i)}
          key={i}
        />
      )}
      <button type="button" onClick={props.handleClickSubmit}>
        Confirm!
      </button>
    </div>
  );
}

export const MiddleHand:FC<HandProps> = (props) => {
  const getSuit = (card:number) => {
    return Math.floor(card/13)
  }

  const getNumber = (card:number) => {
    return card%13
  }

  return (
    <div className='flex-middle-cards'>
      {props.cardLst.map((val, i) => 
        <Card 
          suit={getSuit(val)} 
          num={getNumber(val)} 
          hidden={val < 0} 
          selected={props.selLst[i]} 
          handleClick={() => props.handleClickCard(i)}
          key={i}
        />
      )}
    </div>
  );
}


interface OthHandProps {
  numCards: number
  side: number //1 for left, 2 for top, 3 for right
  partner: boolean
}

export const OthHand:FC<OthHandProps> = (props) => {
  return (
    <div className={
      (props.side === 1) ? 
        ((props.partner) ? "flex-other-hand-1-partner" : "flex-other-hand-1") : 
        (props.side === 2) ? (props.partner) ? "flex-other-hand-2-partner" : "flex-other-hand-2"
        : (props.partner) ? "flex-other-hand-3-partner" : "flex-other-hand-3"
    }>
      {Array(props.numCards).fill(69420).map((val, i) => 
        <Card 
          suit={0} 
          num={0} 
          hidden={true} 
          selected={false} 
          handleClick={() => {}}
          key={i + props.side*13}
        />
      )}
    </div>
  );
}

export const OthHandSide:FC<OthHandProps> = (props) => {
  return (
    <div className={
      (props.side === 1) ? 
        ((props.partner) ? "flex-other-hand-1-partner" : "flex-other-hand-1") : 
        (props.side === 2) ? (props.partner) ? "flex-other-hand-2-partner" : "flex-other-hand-2"
        : (props.partner) ? "flex-other-hand-3-partner" : "flex-other-hand-3"
    }>
      {Array(props.numCards).fill(69420).map((val, i) => 
        <img src={require("./sprites/back_rot.png")} alt={"Empty Card"} 
        className={"card-hidden-rot"}/>
      )}
    </div>
  );
}

interface InfoTableProps {
  setsWon: number
  partner: boolean
  breakTrump: boolean
  trump:number
  playerPos: number //0,1,2,3 clockwise starting from the botttom.
  name:string
}

export const InfoTable:FC<InfoTableProps> = (props) => {
  const suits = ["Clubs", "Diamonds", "Hearts", "Spades"]
  return (
    <div className={"info-table-" + props.playerPos}>
      <p className='info-text'>{"Name: " + props.name}</p>
      <p className='info-text'>{"Sets Won: " + props.setsWon}</p>
      <p className='info-text'>{(props.playerPos === 0) ? "" : "Partner: " + ((props.partner) ? "Yes" : "Not revealed/No")}</p>
      <p className='info-text'>{(props.playerPos === 0) ? "The current trump is: " + suits[props.trump] : ""}</p>
      <p className='info-text'>{(props.playerPos === 0) ? (props.breakTrump) ? "Trump has been broken" : "Trump has not been broken" : ""}</p>
    </div>
  );
}

interface SideBarProps {
  sendMessage: () => void
  sendBid: () => void
  startGame: () => void
  startGameBool: boolean
  allowBid: boolean
  messages: [string, string][]
  roomCode:string
  messageRef: React.RefObject<HTMLInputElement>
  bidRef: React.RefObject<HTMLSelectElement>
  biddingPhase: boolean
}

export const SideBar:FC<SideBarProps> = (props) =>{  
  const bidSuits = ["Club", "Diamond", "Heart", "Spade", "No Trump"]
  const getString = (id:number)=>{
    if (props.biddingPhase) {
      if (id === 0) return "Pass"
      return Math.ceil(id/5) + " " + bidSuits[(id-1) % 5]
    }
    else {
      const getSuit = (card:number) => {
        if (card < 0) return 0
        return Math.floor(card/13)
      }
    
      const getNumber = (card:number) => {
        if (card < 0) return 0
        return card%13
      }
      return numbers[getNumber(id)] + " of " + suits[getSuit(id)]
    }
  }

  const uniqueMessages:[string,string][] = []
  for (var i = 0; i < props.messages.length; ++i){
    const message = props.messages[i]
    if (uniqueMessages.length === 0){
      uniqueMessages.push(message)
    }
    else if (uniqueMessages[uniqueMessages.length-1][1] !== message[1]){
      uniqueMessages.push(message)
    }
  }

  return (
    <div className='sidebar'>
      <div className='sidebar-title'>
        {"Room Code: " + props.roomCode}
      </div>
      <div className='sidebar-message-log'>
        {uniqueMessages.map((val, i) => 
          <div className={'sidebar-message-' + (i%2)}> {val[0]} </div>
        )}
      </div>
      <div className='flex-row'>
        <input id = "message" placeholder="Message" inputMode="text" className='sidebar-text' ref={props.messageRef}/>
        <button onClick={props.sendMessage} className='sidebar-button'>
          Send!
        </button>
      </div>
      <div className='flex-row'>
        <select id="bid" className='sidebar-dropdown' ref={props.bidRef}>
          <option value={-1} disabled selected hidden>Bid</option>    
          {[...Array(props.biddingPhase ? 36 : 52).keys()].map((val, i) => 
            <option value={i}>{getString(i)}</option>
          )}
        </select>
        <button onClick={props.sendBid} className='sidebar-button' disabled={!props.allowBid}>
          {props.biddingPhase ? "Sumbit Bid!" : "Select Partner!"}
        </button>
      </div>
      <button onClick={props.startGame} className='sidebar-button' disabled={!props.startGameBool}>
        Start Game!
      </button>
    </div>
  )
}




type cardSelected = boolean

interface AppRoomProps{
  roomCode: string;
  name: string;
  id: number;
  sideMessages: [string,string][];
  addMessage: (message:string, token:string) => void
}

/* I know that this is very bad coding practice, but bear with me here. All the functions that have to do with 
 * the main game be situated here. To toggle between sections, just search the word `PAGEBREAK`*/
const AppRoom:FC<AppRoomProps> = (props) => {
  const messageRef = createRef<HTMLInputElement>()
  const bidRef = createRef<HTMLSelectElement>()
  /** PAGEBREAK Functions that have to do with initializing the players cards **/
  var [playerNum, setPlayerNum] = useState<number>((props.id+1)%4) 

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

  // TODO: ensure 4 points reshuffle
  const genCards = () => {
    const getPoints = (cards: number[]) => {
      var numPoints = 0
      var suitCounts = [0,0,0,0]
      for (var i = 0; i < cards.length; ++i){
        suitCounts[Math.floor(cards[i]/13)] += 1
        //J to A points
        numPoints += Math.max((cards[i])%13-8, 0)
      }

      // Suit Points
      for (var i = 0; i < suitCounts.length; ++i){
        numPoints += Math.max((suitCounts[i])-4, 0)
      }
      return numPoints
    }

    console.log("generating cards!")
    var allCards = Array.from(Array(52).keys())
    var cardList1 = allCards.slice(0,13)
    var cardList2 = allCards.slice(13,26)
    var cardList3 = allCards.slice(26,39)
    var cardList4 = allCards.slice(39,52)
    var noReshuffle = false
    while (!noReshuffle){
      noReshuffle = true
      allCards = shuffle(allCards)

      cardList1 = allCards.slice(0,13)
      cardList2 = allCards.slice(13,26)
      cardList3 = allCards.slice(26,39)
      cardList4 = allCards.slice(39,52)

      cardList1 = cardList1.sort((a, b) => a - b)
      cardList2 = cardList2.sort((a, b) => a - b)
      cardList3 = cardList3.sort((a, b) => a - b)
      cardList4 = cardList4.sort((a, b) => a - b)

      if (getPoints(cardList1) < 5) noReshuffle = false
      if (getPoints(cardList2) < 5) noReshuffle = false
      if (getPoints(cardList3) < 5) noReshuffle = false
      if (getPoints(cardList4) < 5) noReshuffle = false
    } 

    return [cardList1, cardList2, cardList3, cardList4]
  }

  const [breakTrump, setBreakTrump] = useState<boolean> (false)

  const trump = 3

  /** States and Functions which have to do with the user's hand **/
  const [cardList, setCardList] = useState<number[]>(
    Array(13).fill(-1)
    //[...cardInitList]
  )

  const [bidList, setBidList] = useState<number[][]>(
    [[]]
  )
  
  const [selLst, setSelLst] = useState<cardSelected[]>(
    Array(cardList.length).fill(false)
  )

  const [numCards, setNumCards] = useState<number>(13)

  const updateSelected = (cardNum: number) => {
    // If neg, we treat it as remove 1 
    if (cardNum < 0){
      setSelLst((prev) => {
        for (var i in prev){
          prev[i] = false
        }
        prev.splice(0,1)
        return [...prev]
      })
    }

    setSelLst((prev) => {
      for (var i in prev){
        prev[i] = false
      }
      prev[cardNum] = true
      return [...prev]
    })
  }
  
  const handleClickCard = (index:number) => {
    updateSelected(index)
  }

  const checkValidCard = (cardToPlay:number, trump:number, breakTrump:boolean, firstCard:number, hand:number[]) => {
    // We define the params as follows:
    // cardToPlay: the card which we wish to check the legality of.
    // trump: the trump suit 
    // breakTrump: whether the trump has been broken yet or not. 
    // firstCard: the firstCard played. If the current player is to play the next card, this value will be negative

    const cardToPlaySuit = Math.floor(cardToPlay/13)

    if (firstCard < 0){
      //current player is to play the next card
      if (breakTrump) return true
      else {
        return (cardToPlaySuit !== trump)
      }
    }
    else{
      const firstCardSuit = Math.floor(firstCard/13)
      if (cardToPlaySuit === firstCardSuit) return true
      else{
        //the suit is different! Check for other cards in the hand which are legal. 
        for (var i = 0; i < hand.length; ++i){
          if (Math.floor(hand[i]/13) === firstCardSuit) return false
        } 
        return true
      }
    }
  }

  // This function removes the selected card, if any, and outputs the card num of the removed card. 
  // TODO this function will have to be changed to communicate with the server
  const handleClickSubmit = () => {
    var selected = -1
    for (var i = 0; i < selLst.length; ++i){
      if (selLst[i]) selected = i
    }

    if (selected === -1){
      // eslint-disable-next-line no-restricted-globals
      confirm("Please Select a Card!")
      return -1
    }
    else if (!checkValidCard(cardList[selected], trump, breakTrump, -1, cardList)){
      // eslint-disable-next-line no-restricted-globals
      confirm("This card is not legal to play!")
      return -1
    }
    else {
      const cardRemoved = cardList[selected]

      setCardList((prev) => {
        if (prev.length === numCards){
          prev.splice(selected, 1)
          setNumCards((prev) =>{ return prev-1})
          updateSelected(-1)
          return [...prev]
        }
        return prev        
      })
      
      return cardRemoved
    }
  }

  /** The other players info. Again, this will need to be updated when you start building the server. **/
  var partner = 2;

  const [midCardList, setMidCardList] = useState<number[]>(
    [12,25,38,51]
    //[...cardInitList]
  )

  /** Side Bar OnClick functions.**/
  const [canBid, setCanBid] = useState<boolean> (true) //change to false later

  const [roomPeople, setRoomPeople] = useState<[string, number, string][]> (
    [['', 0, ''], ['', 1, ''], ['', 2, ''], ['', 3, '']]
  ) 

  const sendMessage = () => {
    const message = messageRef.current?.value 
    const token = makeid(16)
    if (message !== null && message !== undefined) {
      socket.emit("message-send", message, props.roomCode, token)
      props.addMessage(message, token)
    }
    
    //set the message thing to like nothing or sth
    //alternatively find a way to tokenize the messages to prevent multiple sendings of the same thing. 
  }

  const sendBid = () => {

  }

  const startGame = () => {

  }

  useEffect(() => {
    const message = props.name + " has joined the room!"
    const token = makeid(16)
    socket.emit("update-room-people", props.roomCode)
    socket.emit("message-send", message, props.roomCode, token)
    props.addMessage(message, token)
  }, [playerNum])

  socket.on("provide-people-name", (roomInfo) => {
    setRoomPeople((prev) => {
      return roomInfo
    })

    for (var i = 0; i < 4; ++i){
      if (roomInfo[i][2] === socket.id){
        const playerNum = i
        setPlayerNum((prev) => {
          return playerNum
        })
      }
    }
  })
  

  /** PAGEBREAK return statement **/
  return (
    <div>
      <Hand 
        cardLst={cardList}
        selLst={selLst}
        playerNum={playerNum}
        handleClickCard={handleClickCard}
        handleClickSubmit={handleClickSubmit}
      />
      <OthHand side={2} numCards={13} partner={partner === 2}/>
      <OthHandSide side={1} numCards={13}  partner={partner === 1}/>
      <OthHandSide side={3} numCards={13}  partner={partner === 3}/>
      <MiddleHand 
        cardLst={midCardList}
        selLst={[false,false,false,false]}
        playerNum={playerNum}
        handleClickCard={() => {}}
        handleClickSubmit={() => {return 69420}}
      />
      <InfoTable setsWon={5} partner={true} breakTrump={false} trump={trump} playerPos={0} name={props.name}/>
      <InfoTable setsWon={5} partner={partner === 1} breakTrump={false} trump={trump} playerPos={1} name={roomPeople[(playerNum+1)%4][0]}/>
      <InfoTable setsWon={5} partner={partner === 2} breakTrump={false} trump={trump} playerPos={2} name={roomPeople[(playerNum+2)%4][0]}/>
      <InfoTable setsWon={5} partner={partner === 3} breakTrump={false} trump={trump} playerPos={3} name={roomPeople[(playerNum+3)%4][0]}/>
      <SideBar sendMessage={sendMessage} sendBid={sendBid} startGame={startGame} startGameBool={false}
      allowBid={canBid} messages={props.sideMessages} roomCode={props.roomCode} messageRef={messageRef} bidRef={bidRef} 
      biddingPhase={true}/>
    </div>
  )
}


export default AppRoom;
