const io = require('socket.io')(3000,{
  cors:{
    origin:["http://localhost:8080","http://localhost:3000","http://localhost:3001"]
  }
})

io.on('connection', socket => {
  console.log(socket.id)
})