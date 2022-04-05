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
    className={props.hidden ? "card-hidden" : props.selected ? "card-selected" : "card"} 
    onClick={props.hidden ? () => {} : props.handleClick}/>
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
      <p className='info-text'>{(props.playerPos === 0) ? "The current trump is: " + ((props.trump === -1) ? "" : suits[props.trump]) : ""}</p>
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
  leaveRoom: () => void
  leaveBool: boolean
}

export const SideBar:FC<SideBarProps> = (props) => {  
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
      <div className='flex-row'>
      <button onClick={props.startGame} className='sidebar-button' disabled={!props.startGameBool}>
        Start Game!
      </button>
      <button onClick={props.leaveRoom} className='sidebar-button' disabled={!props.leaveBool}>
        Leave Room!
      </button>
      </div>
      
    </div>
  )
}




type cardSelected = boolean

export interface roomStatePublic {
  roomState: number 
  bid: [number,number]
  partners: [number, number]
  cardsPlayed: number[]
  setsWon: number[]
}

interface AppRoomProps{
  roomCode: string;
  name: string;
  id: number;
  sideMessages: [string,string][];
  addMessage: (message:string, token:string) => void
  leaveRoom: () => void

  //stuff to aid the main game :(
  playerData: roomStatePublic
  cardLst: number[]
  updateCardLst: (updateCardLst: number[]) => void
  bgNum: number
}

/* I know that this is very bad coding practice, but bear with me here. All the functions that have to do with 
 * the main game be situated here. To toggle between sections, just search the word `PAGEBREAK`*/
const AppRoom:FC<AppRoomProps> = (props) => {
  const messageRef = createRef<HTMLInputElement>()
  const bidRef = createRef<HTMLSelectElement>()
  /** PAGEBREAK Functions that have to do with initializing the players cards **/
  var [playerNum, setPlayerNum] = useState<number>((props.id+1)%4) 

  const [breakTrump, setBreakTrump] = useState<boolean> (false)

  const trump = props.playerData.bid[0]

  /** States and Functions which have to do with the user's hand **/
  const [cardList, setCardList] = useState<number[]>(
    props.cardLst
    //[...cardInitList]
  )

  const [bidList, setBidList] = useState<number[][]>(
    [[]]
  )
  
  const [selLst, setSelLst] = useState<cardSelected[]>(
    Array(cardList.length).fill(false)
  )

  const [numCards, setNumCards] = useState<number>(props.cardLst.length)

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

  useEffect(() => {
    props.updateCardLst(cardList)
  }, [cardList])

  /** The other players info. Again, this will need to be updated when you start building the server. **/
  const [partner, setPartner] = useState<number>(
    -1
    //[...cardInitList]
    //partner - playerNumber mod 4
  )
  
  const getPartner = () => {
    if (playerNum === props.playerData.partners[0] || playerNum === props.playerData.partners[1]){
      for (var i = 0; i < 4; ++i){
        if ((i === props.playerData.partners[0] || i === props.playerData.partners[1]) && i !== playerNum){
          return (4 + i - playerNum)%4 
        }
      }
    }
    else {
      for (var i = 0; i < 4; ++i){
        if (i === props.playerData.partners[0] || i === props.playerData.partners[1] || i === playerNum) continue
        else {
          return (4 + i - playerNum)%4 
        }
      }
    }
    return -1
  }

  const [midCardList, setMidCardList] = useState<number[]>(
    props.playerData.cardsPlayed
    //[...cardInitList]
  )

  /** Side Bar OnClick functions.**/
  const [canBid, setCanBid] = useState<boolean> (
    (props.playerData.roomState === 1) || (props.playerData.roomState === 2)
  ) //change to false later

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
  }

  const sendBid = () => {

  }

  const startGame = () => {
    socket.emit("start-game", props.roomCode)
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

  const backgroundImages = [require("./sprites/gameBG1.png"), require("./sprites/gameBG2.png"), require("./sprites/gameBG3.png")]
  return (
    <div className='blackBG'>
      <img className='background-image-dim' src={backgroundImages[props.bgNum]} alt="backgroundImage" />
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
      <InfoTable setsWon={props.playerData.setsWon[playerNum]}       partner={true} breakTrump={false} trump={trump} playerPos={0} 
            name={props.name}/>
      <InfoTable setsWon={props.playerData.setsWon[(playerNum+1)%4]} partner={partner === 1} breakTrump={false} trump={trump} playerPos={1} 
            name={roomPeople[(playerNum+1)%4][0]}/>
      <InfoTable setsWon={props.playerData.setsWon[(playerNum+2)%4]} partner={partner === 2} breakTrump={false} trump={trump} playerPos={2} 
            name={roomPeople[(playerNum+2)%4][0]}/>
      <InfoTable setsWon={props.playerData.setsWon[(playerNum+3)%4]} partner={partner === 3} breakTrump={false} trump={trump} playerPos={3} 
            name={roomPeople[(playerNum+3)%4][0]}/>
      <SideBar sendMessage={sendMessage} sendBid={sendBid} startGame={startGame} startGameBool={roomPeople[3][2] !== "" && playerNum === 0}
      allowBid={canBid} messages={props.sideMessages} roomCode={props.roomCode} messageRef={messageRef} bidRef={bidRef} 
      biddingPhase={true} leaveRoom={props.leaveRoom} leaveBool={props.playerData.roomState === 0}/>
    </div>
  )
}


export default AppRoom;
