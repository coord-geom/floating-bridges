import React, { FC, useState } from "react"
import ReactDOM from 'react-dom';
import './index.css';
import AppRoom, { roomStatePublic } from './AppRoom';
import JoinRoom from './JoinRoomScreen';
import DisplayRuns, { roundInfo } from './DisplayRunScreen';
import reportWebVitals from './reportWebVitals';
import {io} from 'socket.io-client'
import { useEffect } from "react";
import dataJson from './game_data.json';

export const socket = io('http://localhost:3000') //the webpage which the server is hosted on

export const makeid = (length:number) => {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
 return result;
}


function MainComponent() {
  const [inRoom, setInRoom] = useState<boolean> (false)
  const [inDisplayRuns, setInDisplayRuns] = useState<boolean> (false)
  const [roomCode, setRoomCode] = useState<string> ("")
  const [name, setName] = useState<string> ("")
  const [id, setId] = useState<number> (-1)
  const [sideMessages, setSideMessages] = useState<[string,string][]> (
    []
  ) 
  const [partnerRevealed, setPartnerRevealed] = useState<boolean> (false)

  const [playerData, setPlayerData] = useState<roomStatePublic> (
    {
      roomState: 0,
      bid: [-1,-1],
      partners: [-1,-1],
      cardsPlayed: Array(4).fill(-1),
      setsWon: Array(4).fill(0),
      cardsRemaining: Array(4).fill(13)
    }
  )
  
  const resetPlayerDataToDefault = () => {
    setPlayerData((prev) => {
      return {
        roomState: 0,
        bid: [-1,-1],
        partners: [-1,-1],
        cardsPlayed: Array(4).fill(-1),
        setsWon: Array(4).fill(0),
        cardsRemaining: Array(4).fill(13)
      }
    })
    setInfor("", "", -1)
  }

  const setPlayerDataWith = (playerData:roomStatePublic) => {
    setPlayerData((prev) => {
      return playerData
    })
  }

  const [bgNum, setBgNum] = useState<number>(Math.floor(4*Math.random()))

  const [prevToken, setPrevToken] = useState<[string, string]>(["", ""])
  
  const getNewGame = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const allGames = dataJson.games
      return allGames[Math.floor( (allGames.length)*Math.random() )]
    }
    catch (e) {
      return 
    }
  }

  const [gamePlayInfo, setGamePlayInfo] = useState<roundInfo>(
    getNewGame()
  )

  // Actual Game Stuff
  const [cardList, setCardList] = useState<number[]>(
    Array(13).fill(-1)
  )
  
  const updateCardLst = (cardLstAppRoom:number[]) => {
    console.log(cardLstAppRoom)
    setCardList((prev) => {
      return cardLstAppRoom
    })
  }
  // card list and sel list

  //cardlist not needed

  /**
   *  useEffect(() => {
    props.updateCardLst(cardList)
  }, [cardList])
   */

  const [selLst, setSelLst] = useState<boolean[]>(
    Array(cardList.length).fill(false)
  )

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
  
  const [numCards, setNumCards] = useState<number>(cardList.length)

  const [breakTrump, setBreakTrump] = useState<boolean> (false)

  const trump = playerData.bid[1]
  
  const handleClickCard = (index:number) => {
    updateSelected(index)
  }

  const checkValidCard = (cardToPlay:number, trump:number, breakTrump:boolean, firstCard:number, hand:number[]) => {
    // We define the params as follows:
    // cardToPlay: the card which we wish to check the legality of.
    // trump: the trump suit 
    // breakTrump: whether the trump has been broken yet or not. 
    // firstCard: the firstCard played. If the current player is to play the next card, this value will be negative

    console.log(hand)

    const cardToPlaySuit = Math.floor(cardToPlay/13)

    if (firstCard < 0){
      //current player is to play the next card
      if (breakTrump) return true
      else {
        //check if hand is all trumps
        for (var i = 0; i < hand.length; ++i){
          if (Math.floor(hand[i]/13) !== trump) return (cardToPlaySuit !== trump)
        }

        return true
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
    var firstCard = -1
    for (var i = 0; i < selLst.length; ++i){
      if (selLst[i]) selected = i
      if (playerData.cardsPlayed[(id + i) % 4] !== -1 && firstCard === -1) firstCard = playerData.cardsPlayed[(id + i) % 4]
    }

    if (selected === -1){
      // eslint-disable-next-line no-restricted-globals
      confirm("Please Select a Card!")
      return -1
    }
    else if (!checkValidCard(cardList[selected], trump, breakTrump, firstCard, cardList)){
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

      const addMessageAndUpdate = (currPlayer:number, state:roomStatePublic, breakTrump:boolean, partnerRevealed:boolean, 
        message?:string, token?:string) => {
        setPlayerDataWith(state)
        setCurrBidderPlayerWith((currPlayer)%4)
        setBreakTrump((prev) => {
          return (prev || breakTrump)
        })
        setPartnerRevealed((prev) => {
          return (prev || partnerRevealed)
        })
        if(message !== undefined && token !== undefined){
          addMessage(message, token)
        }
      }

      socket.emit('play-card', cardRemoved, id, roomCode, addMessageAndUpdate)
      
      return cardRemoved
    }
  }

  const [currBidderPlayer, setCurrBidderPlayer] = useState<number> (
    -1
  ) //change to false later
  const setCurrBidderPlayerWith = (id: number) => {
    setCurrBidderPlayer((prev) => {
      return id
    })
  }


  // SOCKET.IO STUFF
  const afterJoinRoom = (room:string) => () => {
    socket.emit('join-room', room, true, name, id)
    socket.emit("update-room-people", room)
    setBgNum((prev) => {
      return Math.floor(4*Math.random())
    })
  }

  const exitRoom = () => {  
    const roomTemp = roomCode
    const idExit = id
    const message =  name + " has left the room!"
    const token = makeid(16)
    socket.emit("message-send", message, roomTemp, token)
    socket.emit('leave-room', roomTemp, idExit)
    setRoomCode((prev) => {
      return ""
    })
    setName((prev) => {
      return ""
    })
    setId((prev) => {
      return -1
    })
    setInRoom((prev) => {
      return false
    })
    setSideMessages((prev) => {
      return []
    })
  }

  const setInfor = (room: string, name:string, id:number) => {
    setRoomCode((prev) => {
      return room
    })
    setName((prev) => {
      return name
    })
    setId((prev) => {
      return id
    })
    setInRoom((prev) => {
      return true
    })
    //declare xxx has join da room
  }

  const newGame = () => {
    setGamePlayInfo((prev) => {
      return getNewGame()
    })
  }

  const setDisplayRuns = (bool:boolean) => () => {
    console.log(bool)
    setInDisplayRuns((prev) => {
      return bool
    })
  }

  useEffect(() => {
    afterJoinRoom(roomCode)()
  }, [inRoom, roomCode, name, id])

  const disconnect = () => {
    setInRoom((prev) => {
      return false
    })
  }

  const addMessage = (message:string, token:string) => {
    setPrevToken((prev) => {
      return [message, token]
    })
  }
  

  useEffect(() => {
    socket.on("return-people-room", (numPeople, name, room) => {
      if (numPeople >= 4){
        // eslint-disable-next-line no-restricted-globals
        confirm("There are already 4 people in the room!")
        return;
      }
      else {
        setInfor(room, name, numPeople)
      }
      
    } )

    socket.on("message-recieve", (message, token) => {
      addMessage(message, token)
    })
  
    socket.on("send-data", (roomState) => {
      setPlayerData((prev) => {
        //console.log(roomState)
        return roomState
      })
    })
  
    socket.on("send-cards", (cards) => {
      console.log(cards)
      setCurrBidderPlayer(0)
      setCardList((prev) => {
        return cards
      })
    })

    socket.on("get-player", (player) => {
      setCurrBidderPlayer(player)
    })

    socket.on("send-card", (player, hasTrump, partnerRevealed) => {
      setCurrBidderPlayerWith((player)%4)
      setBreakTrump((prev) => {
        return (prev || hasTrump)
      })
      setPartnerRevealed((prev) => {
        return (prev || partnerRevealed)
      })
    })
  })

  const startGame = () => {
    const setData = (roomState:roomStatePublic, cards:number[]) => {
      setCurrBidderPlayer(0)
      console.log(roomState)
      console.log(cards)
      setCardList((prev) => {
        return cards
      })

      setPlayerData((prev) => {
        console.log(roomState)
        console.log("updating Room State")
        return roomState
      })
    }

    socket.emit("start-game", roomCode, setData)
  }

  useEffect(() => {
    setSideMessages((prev) => {
      const message = prevToken[0]
      const token = prevToken[1]
      prev.push([message, token])

      const uniqueMessages:[string,string][] = []
      for (var i = 0; i < prev.length; ++i){
        const message = prev[i]
        if (uniqueMessages.length === 0){
          uniqueMessages.push(message)
        }
        else if (uniqueMessages[uniqueMessages.length-1][1] !== message[1]){
          uniqueMessages.push(message)
        }
      }

      return uniqueMessages
    })
  }, [prevToken])
 

  















  
  if (inDisplayRuns){
    return <DisplayRuns infor={gamePlayInfo} onCLickNew={newGame} onClickReturn={setDisplayRuns(false)} />
  }
  else if (!inRoom){ 
    return <JoinRoom setInfor={setInfor} setDisplayRuns={setDisplayRuns(true)}/>
  }
  else {
    return <AppRoom roomCode={roomCode} name={name} id={id} sideMessages={sideMessages}
    addMessage={addMessage} leaveRoom={exitRoom} playerData={playerData} 
    updateCardLst={updateCardLst} bgNum={bgNum} startGame={startGame} cardList={cardList} selLst={selLst} 
    handleClickCard={handleClickCard} handleClickSubmit={handleClickSubmit} trump={trump} currBidderPlayer={currBidderPlayer}
    setPlayerDataWith={setPlayerDataWith} setCurrBidderPlayerWith={setCurrBidderPlayerWith} breakTrump={breakTrump}
    partnerRevealed={partnerRevealed}/>
  }
}


ReactDOM.render(
  <React.StrictMode>
    <MainComponent />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
