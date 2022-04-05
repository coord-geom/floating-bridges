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
  const [playerData, setPlayerData] = useState<roomStatePublic> (
    {
      roomState: 0,
      bid: [-1,-1],
      partners: [-1,-1],
      cardsPlayed: Array(4).fill(-1),
      setsWon: Array(4).fill(0)
    }
  )
  const [bgNum, setBgNum] = useState<number>(Math.floor(3*Math.random()))

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
  

  const afterJoinRoom = (room:string) => () => {
    socket.emit('join-room', room, true, name, id)
    socket.emit("update-room-people", room)
    setBgNum((prev) => {
      return Math.floor(3*Math.random())
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
  })

  socket.on("message-recieve", (message, token) => {
    addMessage(message, token)
  })

  socket.on("send-data", (roomState) => {
    console.log("send-data")
    setPlayerData((prev) => {
      console.log(roomState)
      return roomState
    })
  })

  socket.on("send-cards", (cards) => {
    console.log(cards)
    setCardList((prev) => {
      return cards
    })
  })

  useEffect(() => {
    setSideMessages((prev) => {
      const message = prevToken[0]
      const token = prevToken[1]
      prev.push([message, token])
      return [...prev]
    })
  }, [prevToken])


  // Actual Game Stuff
  const [cardList, setCardList] = useState<number[]>(
    Array(13).fill(-1)
  )
  
  const updateCardLst = (cardLstAppRoom:number[]) => {
    console.log(cardList)
    setCardList((prev) => {
      return cardLstAppRoom
    })
  }


  
  if (inDisplayRuns){
    return <DisplayRuns infor={gamePlayInfo} onCLickNew={newGame} onClickReturn={setDisplayRuns(false)} />
  }
  else if (!inRoom){ 
    return <JoinRoom setInfor={setInfor} setDisplayRuns={setDisplayRuns(true)}/>
  }
  else {
    return <AppRoom roomCode={roomCode} name={name} id={id} sideMessages={sideMessages} 
    addMessage={addMessage} leaveRoom={exitRoom} playerData={playerData} cardLst={cardList
    } updateCardLst={updateCardLst} bgNum={bgNum} />
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
