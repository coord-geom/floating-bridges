const io = require('socket.io')(3000,{
  cors:{
    origin:["http://localhost:8080","http://localhost:3000","http://localhost:3001"]
  }
})

const roomPeople = new Map();

io.on('connection', socket => {
  console.log(socket.id)

  socket.on('join-room', (room, joinTrue, name, id) => {
    if (joinTrue) {
      socket.join(room)

      console.log("I am calling this from the top of joinroom")

      var peopleName = []
      for (var i = 0; i < 4; ++i){
        peopleName.push(['', i, ''])
      }
      if (roomPeople.get(room) !== undefined){
        peopleName = roomPeople.get(room).slice(0,4)
      }
      peopleName[id] = [name, id, socket.id]
      roomPeople.set(room, peopleName)
      console.log("Calling from join room; roomPeoples is:")
      //console.log(roomPeople)

      console.log(peopleName)
      socket.to(room).emit("provide-people-name", roomPeople.get(room))
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
    console.log(io.sockets.adapter.rooms)
    console.log(room)
    console.log("This is from get-people-room; out is: ")
    console.log(out)
    const numPeople = (out === null || out === undefined) ? 0 : out.size 

    socket.emit("return-people-room", numPeople, name, room)
  })

  socket.on("update-room-people", (room) => {
    console.log("update people called")
    socket.to(room).emit("provide-people-name", roomPeople.get(room))
  })

  socket.on("message-send", (message, room, name) => {
    console.log("message-recieve")
    console.log(io.sockets.adapter.rooms)
    socket.to(room).emit("message-recieve", message, name)
  })
})