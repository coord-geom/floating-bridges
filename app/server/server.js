const io = require('socket.io')(3000,{
  cors:{
    origin:["http://localhost:8080","http://localhost:3000","http://localhost:3001","http://localhost:3002","http://localhost:3003"]
  }
})

const roomPeople = new Map();
/**
 *  This is a Map of json objects directing from a room id to objects of the following form
 *  {
      people: [],                   // 4 elements of the following form: [name, roomID, socketID]
      roomState: 0,                 // 0 for not started; 1 for bidding; 2 for playing
      hand: [],                     // the hand given to players. Inits when roomState gets set to 1.
      bids: [],                     // collection of all bids 
      bid: [0, 0],                  // suit, bid
      partners: [0, 0],             // The 2 ids of the people who are partners. 
      cardsPlayed: [-1,-1,-1,-1],   // Cards Player 
      roundStarter: -1,             // Id of the player that starts the round
      setsWon: [0, 0, 0, 0],        // Number of sets won for each player
      trumpBroken: false            // Whether the trump is broken
    }
 */

const messageTokens = [];

io.on('connection', socket => {
  console.log("User " + socket.id + " has connected")

  socket.on('join-room', (room, joinTrue, name, id) => {
    if (room === ""){
    }
    else if (joinTrue) {
      socket.join(room)

      var peopleName = {
        people: [],
        roomState: 0, //0 for not started; 1 for bidding; 2 for partner; 3 for game
        hand: [],
        bids: [],
        bid: [0, 0], //suit, bid
        partners: [0, 0],
        cardsPlayed: [-1,-1,-1,-1],
        roundStarter: -1,
        setsWon: [0, 0, 0, 0],
        trumpBroken: false
      }
      var peopleNamePeople = []

      for (var i = 0; i < 4; ++i){
        peopleNamePeople.push(['', i, ''])
      }
      if (roomPeople.get(room) !== undefined){
        peopleName = roomPeople.get(room)
        peopleNamePeople = peopleName.people.slice(0,4)
      }
      peopleNamePeople[id] = [name, id, socket.id]
      peopleName.people = peopleNamePeople
      roomPeople.set(room, peopleName)
      //console.log("Calling from join room; roomPeoples is:")
      //console.log(roomPeople)

      console.log("peopleName is: " + JSON.stringify(peopleName))
      console.log("peopleName.people is: " + JSON.stringify(peopleNamePeople))
      console.log("roomPeople is: " + JSON.stringify(roomPeople))
      console.log(room)
      socket.to(room).emit("provide-people-name", roomPeople.get(room)?.people)
    }
  })

  // TODO: change these
  socket.on('leave-room', (room, joinTrue, name, id) => {
    if (joinTrue) {
      socket.join(room)

      console.log("I am calling this from the top of joinroom")

      var peopleName = []
      for (var i = 0; i < 4; ++i){
        peopleName.push(['', i])
      }
      if (roomPeople.get(room) !== undefined){
        peopleName = roomPeople.get(room)
      }
      peopleName[id] = [name, id]
      roomPeople.set(room, peopleName, socket.id)
      console.log("Calling from join room; roomPeoples is:")
      console.log(roomPeople)
      console.log(peopleName)
      socket.to(room).emit("provide-people-name", roomPeople.get(room))
    }
  }) 


  socket.on("get-people-room", (room, name) => {
    const out = io.sockets.adapter.rooms.get(room)
    //console.log(io.sockets.adapter.rooms)
    //console.log(room)
    //console.log("This is from get-people-room; out is: ")
    //console.log(out)
    const numPeople = (out === null || out === undefined) ? 0 : out.size 

    socket.emit("return-people-room", numPeople, name, room)
  })

  socket.on("update-room-people", (room) => {
    //console.log("update people called")
    //console.log(room)
    socket.to(room).emit("provide-people-name", roomPeople.get(room)?.people)
  })

  socket.on("message-send", (message, room, token) => {
    if (!messageTokens.includes(token)){
      //console.log("Message token is:" + token)
      socket.to(room).emit("message-recieve", message, token)
    }
  })
})