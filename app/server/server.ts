import socketIO from 'socket.io'


interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const io = new socketIO.Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(3000, {
  cors:{
    origin:["http://localhost:3001", "http://localhost:3000"]
  }
});

io.on('connection', socket => {
  console.log(socket.id)
})