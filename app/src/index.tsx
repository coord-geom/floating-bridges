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
  const [roomCode, setRoomCode] = useState<string> ("")
  const [name, setName] = useState<string> ("")
  const [id, setId] = useState<number> (-1)
  const [sideMessages, setSideMessages] = useState<string[]> (
    []
  ) 
  

  const afterJoinRoom = (room:string) => {
    console.log("am calling join-room")
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

  useEffect(() => {
    afterJoinRoom(roomCode)
  }, [inRoom, roomCode, name, id])

  const disconnect = () => {
    setInRoom((prev) => {
      return false
    })
  }
  

  useEffect(() => {
    socket.on("return-people-room", (numPeople, name, room) => {
      console.log("I am calling from return people room")
      console.log("num people is: " + numPeople)
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

  socket.on("message-recieve", (message, name) => {
    console.log("got to this point")
    setSideMessages((prev) => {
      const messageOut = (name === null) ? message : message + " - " + name
      if (prev[prev.length-1] !== messageOut){
        prev.push(messageOut)
        console.log(prev)
      }
      return [...prev]
    })
  })

  if (!inRoom){ 
    return <JoinRoom setInfor={setInfor}/>
  }
  else {
    return <AppRoom roomCode={roomCode} name={name} id={id} sideMessages={sideMessages}/>
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
