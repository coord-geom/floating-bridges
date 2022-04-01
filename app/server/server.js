const io = require('socket.io')(3000,{
  cors:{
    origin:["http://localhost:8080","http://localhost:3000","http://localhost:3001"]
  }
})

io.on('connection', socket => {
  console.log(socket.id)

  socket.on('join-room', (room, joinTrue) => {
    if(joinTrue){
      socket.join(room)
      console.log("Calling from join room")
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

  
})