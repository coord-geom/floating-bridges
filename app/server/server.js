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
      roomState: 0,                 // 0 for not started; 1 for bidding; 2 for partner; 3 for playing
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

const makeid = (length) => {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
 return result;
}

const getStringBid = (id)=>{
  const bidSuits = ["Club", "Diamond", "Heart", "Spade", "No Trump"]
  if (id === 0) return "Pass"
  return Math.ceil(id/5) + " " + bidSuits[(id-1) % 5]
  
}

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
        bid: [-1,-1],
        bids: [], //suit, bid
        partners: [-1, -1],
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

  socket.on('leave-room', (room, id) => {
    socket.leave(room)
    
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
    for (var i = id; i < 4; ++i){
      if (i < 3){
        peopleNamePeople[i][0] = peopleNamePeople[i+1][0]
        peopleNamePeople[i][1] = id
        peopleNamePeople[i][2] = peopleNamePeople[i+1][2]
      } else {
        peopleNamePeople[i] = ['', i, '']
      }
      console.log(peopleNamePeople)
    }
    peopleName.people = peopleNamePeople
    roomPeople.set(room, peopleName)
    //console.log("Calling from join room; roomPeoples is:")
    //console.log(roomPeople)

    console.log("peopleName is: " + JSON.stringify(peopleName))
    console.log("peopleName.people is: " + JSON.stringify(peopleNamePeople))
    console.log("roomPeople is: " + JSON.stringify(roomPeople))
    console.log(room)
    socket.to(room).emit("provide-people-name", roomPeople.get(room)?.people)
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

  socket.on("start-game", (room, setData) => {
    const shuffle = (array) => {
      let currentIndex = array.length,  randomIndex;
  
      // While there remain elements to shuffle...
      while (currentIndex !== 0) {
  
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
  
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }
  
      return array;
    }
  
    const genCards = () => {
      const getPoints = (cards) => {
        var numPoints = 0
        var suitCounts = [0,0,0,0]
        for (var i = 0; i < cards.length; ++i){
          suitCounts[Math.floor(cards[i]/13)] += 1
          //J to A points
          numPoints += Math.max((cards[i])%13-8, 0)
        }
  
        // Suit Points
        for (var i = 0; i < suitCounts.length; ++i){
          numPoints += Math.max((suitCounts[i])-4, 0)
        }
        return numPoints
      }
  
      console.log("generating cards!")
      var allCards = Array.from(Array(52).keys())
      var cardList1 = allCards.slice(0,13)
      var cardList2 = allCards.slice(13,26)
      var cardList3 = allCards.slice(26,39)
      var cardList4 = allCards.slice(39,52)
      var noReshuffle = false
      while (!noReshuffle){
        noReshuffle = true
        allCards = shuffle(allCards)
  
        cardList1 = allCards.slice(0,13)
        cardList2 = allCards.slice(13,26)
        cardList3 = allCards.slice(26,39)
        cardList4 = allCards.slice(39,52)
  
        cardList1 = cardList1.sort((a, b) => a - b)
        cardList2 = cardList2.sort((a, b) => a - b)
        cardList3 = cardList3.sort((a, b) => a - b)
        cardList4 = cardList4.sort((a, b) => a - b)
  
        if (getPoints(cardList1) < 5) noReshuffle = false
        if (getPoints(cardList2) < 5) noReshuffle = false
        if (getPoints(cardList3) < 5) noReshuffle = false
        if (getPoints(cardList4) < 5) noReshuffle = false
      } 
  
      return [cardList1, cardList2, cardList3, cardList4]
    }

    roomPeople.get(room).roomState   = 1
    const allCards = genCards()


    const roomStateExport = {
      roomState: roomPeople.get(room).roomState,
      bid: roomPeople.get(room).bid,
      partners: roomPeople.get(room).partners,
      cardsPlayed: roomPeople.get(room).cardsPlayed,
      setsWon: roomPeople.get(room).setsWon
    } 

    
    
    console.log(roomStateExport)
    socket.in(room).emit("send-data", roomStateExport)
    setData(roomStateExport, allCards[0])

    for (var i = 0; i < 4; ++i){
      if (i === 0) {
        continue
      }
      console.log(roomPeople.get(room).people[i][2])
      console.log(allCards[i])
      console.log(roomPeople)
      socket.to(roomPeople.get(room).people[i][2]).emit("send-cards", allCards[i])
    }
  })

  socket.on("send-bid", (bid, player, room, addMessage) => {
    console.log(bid)
    console.log(player)
    const message = "Player " + (player + 1) + " bid " + getStringBid(bid)
    const token = makeid(16)
    const oldBids = roomPeople.get(room).bids
    oldBids.push(bid)

    roomPeople.get(room).bids = oldBids
    
    // check for 1 round of passes 

    console.log(oldBids)
    
    var isFinished = false
    if (oldBids.length >= 4){
      isFinished = true
      for (var i = 0; i < 3; ++i){
        if (oldBids[oldBids.length-1-i] !== 0){
          isFinished = false
          break
        }
      }
    }

    console.log(isFinished)

    if (bid !== 0){
      roomPeople.get(room).bid = [Math.floor((bid+1)/5),(bid+1)%5]
    }

    const roomStateExport = {
      roomState: roomPeople.get(room).roomState,
      bid: roomPeople.get(room).bid,
      partners: roomPeople.get(room).partners,
      cardsPlayed: roomPeople.get(room).cardsPlayed,
      setsWon: roomPeople.get(room).setsWon
    } 
    console.log(roomStateExport)

    if (isFinished) { //Closing up; move to next phase
      const message2 = message + ". Player " + (player + 1) + ", please call your partner."
      addMessage(message2, token, true, roomStateExport)
      socket.to(room).emit("message-recieve", message2, token)
      socket.to(room).emit("get-bid", (player+1)%4)
      socket.in(room).emit("send-data", roomStateExport)
    }
    else{
      addMessage(message, token, true, roomStateExport)
      socket.to(room).emit("message-recieve", message, token)
      socket.to(room).emit("get-bid", (player+1)%4)
      socket.in(room).emit("send-data", roomStateExport)
    }
    
  })

  /**
   * export interface roomStatePublic {
   * roomState: number 
   * bid: [number,number]
   * partners: [number, number]
   * cardsPlayed: number[]
   * setsWon: number[]
   * }
   */
})