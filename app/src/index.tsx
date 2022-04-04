import React, { FC, useState } from "react"
import ReactDOM from 'react-dom';
import './index.css';
import AppRoom from './AppRoom';
import JoinRoom from './JoinRoomScreen';
import DisplayRuns, { roundInfo } from './DisplayRunScreen';
import reportWebVitals from './reportWebVitals';
import {io} from 'socket.io-client'
import { useEffect } from "react";

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
  const [prevToken, setPrevToken] = useState<[string, string]>(["", ""])

  const genGamePlay = () => {
    var out = []
    for (var i = 0; i < 13; ++i){
      out.push({
        cards: [0, 0, 0, 0],
        start: 0,
        win: 0,
        desc: "Round " + i + "\nPlayer 1 starts\nPlayer 1 wins"
      })
    }
    return out
  }
  

  const [gamePlayInfo, setGamePlayInfo] = useState<roundInfo>(
    {
      "bids": [
          3,
          4,
          -1,
          -1,
          -1
      ],
      "partner": {
          "card": 51,
          "id": 3
      },
      "plays": [
          {
              "cards": [
                  21,
                  19,
                  48,
                  22
              ],
              "start": 0,
              "win": 3,
              "desc": "Round: 1\nPlayer 1 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  40,
                  47,
                  45,
                  43
              ],
              "start": 3,
              "win": 0,
              "desc": "Round: 2\nPlayer 4 starts\nPlayer 1 wins."
          },
          {
              "cards": [
                  18,
                  20,
                  37,
                  23
              ],
              "start": 0,
              "win": 3,
              "desc": "Round: 3\nPlayer 1 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  32,
                  29,
                  28,
                  30
              ],
              "start": 3,
              "win": 3,
              "desc": "Round: 4\nPlayer 4 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  42,
                  39,
                  49,
                  5
              ],
              "start": 3,
              "win": 1,
              "desc": "Round: 5\nPlayer 4 starts\nPlayer 2 wins."
          },
          {
              "cards": [
                  41,
                  7,
                  51,
                  44
              ],
              "start": 1,
              "win": 3,
              "desc": "Round: 6\nPlayer 2 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  1,
                  3,
                  8,
                  0
              ],
              "start": 3,
              "win": 1,
              "desc": "Round: 7\nPlayer 4 starts\nPlayer 2 wins."
          },
          {
              "cards": [
                  34,
                  27,
                  26,
                  36
              ],
              "start": 1,
              "win": 0,
              "desc": "Round: 8\nPlayer 2 starts\nPlayer 1 wins."
          },
          {
              "cards": [
                  14,
                  15,
                  6,
                  25
              ],
              "start": 0,
              "win": 3,
              "desc": "Round: 9\nPlayer 1 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  12,
                  33,
                  13,
                  2
              ],
              "start": 3,
              "win": 3,
              "desc": "Round: 10\nPlayer 4 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  50,
                  17,
                  46,
                  4
              ],
              "start": 3,
              "win": 3,
              "desc": "Round: 11\nPlayer 4 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  11,
                  24,
                  16,
                  10
              ],
              "start": 3,
              "win": 3,
              "desc": "Round: 12\nPlayer 4 starts\nPlayer 4 wins."
          },
          {
              "cards": [
                  35,
                  31,
                  38,
                  9
              ],
              "start": 3,
              "win": 1,
              "desc": "Round: 13\nPlayer 4 starts\nPlayer 2 wins."
          }
      ],
      "winners": [
          1,
          2
      ]
  }
  )
  

  const afterJoinRoom = (room:string) => () => {
    socket.emit('join-room', room, true, name, id)
    socket.emit("update-room-people", room)
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
      return {
        bids: Array.from({length: 40}, () => Math.floor(Math.random() * 15)),
        partner: {
          card: 0,   
          id: 0       
        },         
        plays: [{
          cards: [0, 1, 2, 3],
          start: 0,
          win: 1,
          desc: "Round " + 1 + "\nPlayer 1 starts\nPlayer 1 wins"
        },{
          cards: [4,5,6,7],
          start: 0,
          win: 1,
          desc: "Round " + 1 + "\nPlayer 1 starts\nPlayer 1 wins"
        },{
          cards: [8,9,10,11],
          start: 0,
          win: 1,
          desc: "Round " + 1 + "\nPlayer 1 starts\nPlayer 1 wins"
        }],
        winners:[0, 3]
      }
    })
  }

  const setDisplayRuns = (bool:boolean) => () => {
    console.log(bool)
    setInDisplayRuns((prev) => {
      return bool
    })
  }

  useEffect(() => {
    afterJoinRoom(roomCode)
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

  useEffect(() => {
    setSideMessages((prev) => {
      const message = prevToken[0]
      const token = prevToken[1]
      prev.push([message, token])
      return [...prev]
    })
  }, [prevToken])

  if (inDisplayRuns){
    return <DisplayRuns infor={gamePlayInfo} onCLickNew={newGame} onClickReturn={setDisplayRuns(false)} />
  }
  else if (!inRoom){ 
    return <JoinRoom setInfor={setInfor} setDisplayRuns={setDisplayRuns(true)}/>
  }
  else {
    return <AppRoom roomCode={roomCode} name={name} id={id} sideMessages={sideMessages} addMessage={addMessage}/>
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
