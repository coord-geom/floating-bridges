import React, { FC, useState } from "react"
import ReactDOM from 'react-dom';
import './index.css';
import AppRoom from './AppRoom';
import JoinRoom from './JoinRoomScreen';
import reportWebVitals from './reportWebVitals';
import {io} from 'socket.io-client'
import { useEffect } from "react";

export const socket = io('http://localhost:3000') //the webpage which the server is hosted on



function MainComponent() {
  const [inRoom, setInRoom] = useState<boolean> (false)
  const [roomCode, setRoomCode] = useState<String> ("")
  const [name, setName] = useState<String> ("")
  const [id, setId] = useState<number> (-1)

  const setInfor = (room: String, name:String, id:number) => {
    setRoomCode((prev) => {
      return room
    })
    setName((prev) => {
      return name
    })
    setInRoom((prev) => {
      return true
    })
    setId((prev) => {
      return id
    })
    socket.emit('join-room', room, true)
  }

  const disconnect = () => {
    setInRoom((prev) => {
      return false
    })
  }

  useEffect(() => {
    socket.on("return-people-room", (numPeople, name, room) =>{
      console.log("I am calling from return people room")
      console.log("num people is: " + numPeople)
      if (numPeople >= 4){
        // eslint-disable-next-line no-restricted-globals
        confirm("There are already 4 people in the room!")
        return;
      }
      else {
        setInfor(room, name, numPeople)
        console.log(name)
        console.log(room)
      }
      
    } )
  })

  if (inRoom){ //add ! when done
    return <JoinRoom setInfor={setInfor}/>
  }
  else {
    return <AppRoom />
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
