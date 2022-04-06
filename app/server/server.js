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
      bid: [0, 0],                  // bid, suit
      partners: [0, 0],             // The 2 ids of the people who are partners. 
      partnerCard: -1,              // The partner card
      cardsPlayed: [-1,-1,-1,-1],   // Cards Player 
      cardsRemaining: [13,13,13,13] // Cards Remaining
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
  if (id === -1) return "Pass"
  return Math.ceil((id+1)/5) + " " + bidSuits[(id) % 5] 
}

const suits = ["Clubs", "Diamonds", "Hearts", "Spades"]
const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace']
const getStringCard = (id)=>{
  const getSuit = (card) => {
    if (card < 0) return 0
    return Math.floor(card/13)
  }

  const getNumber = (card) => {
    if (card < 0) return 0
    return card%13
  }
  return "The " + numbers[getNumber(id)] + " of " + suits[getSuit(id)]
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
        bids: [], //bid, suit
        partners: [-1, -1],
        partnerCard: -1,
        cardsPlayed: [-1,-1,-1,-1],
        cardsRemaining: [13,13,13,13],
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
      partnerCard: -1,
      cardsPlayed: [-1,-1,-1,-1],
      cardsRemaining: [13,13,13,13],
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
    const allCards                   = genCards()
    roomPeople.get(room).hand        = allCards


    const roomStateExport = {
      roomState: roomPeople.get(room).roomState,
      bid: roomPeople.get(room).bid,
      partners: roomPeople.get(room).partners,
      cardsPlayed: roomPeople.get(room).cardsPlayed,
      setsWon: roomPeople.get(room).setsWon,
      cardsRemaining: roomPeople.get(room).cardsRemaining
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
    console.log("start of send-bid")
    console.log(bid)
    console.log(player)
    const message = "Player " + (player + 1) + " (" + roomPeople.get(room).people[player][0] +  ") bid " + getStringBid(bid)
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
        if (oldBids[oldBids.length-1-i] !== -1){
          isFinished = false
          break
        }
      }
    }

    console.log(isFinished)

    if (bid !== -1){
      roomPeople.get(room).bid = [Math.floor((bid)/5),(bid)%5]
    }

    if (isFinished){
      roomPeople.get(room).roomState = 2
    }

    const roomStateExport = {
      roomState: roomPeople.get(room).roomState,
      bid: roomPeople.get(room).bid,
      partners: roomPeople.get(room).partners,
      cardsPlayed: roomPeople.get(room).cardsPlayed,
      setsWon: roomPeople.get(room).setsWon,
      cardsRemaining: roomPeople.get(room).cardsRemaining
    } 
    console.log(roomStateExport)

    if (isFinished) { //Closing up; move to next phase
      const message2 = message + ". Player " + ((player + 1)%4 + 1) + " (" + roomPeople.get(room).people[(player+1)%4][0] +  "), please call your partner."
      addMessage(message2, token, roomStateExport)
      socket.to(room).emit("message-recieve", message2, token)
      socket.to(room).emit("get-player", (player+1)%4)
      socket.in(room).emit("send-data", roomStateExport)
    }
    else{
      addMessage(message, token, roomStateExport)
      socket.to(room).emit("message-recieve", message, token)
      socket.to(room).emit("get-player", (player+1)%4)
      socket.in(room).emit("send-data", roomStateExport)
    }
    
  })

  socket.on("send-partner", (card, player, room, addMessage) => {
    const message = "Player " + (player + 1) + " (" + roomPeople.get(room).people[player][0] +  ") calls " + getStringCard(card)
    const token = makeid(16)
    
    //Find Partner
    const peopleHand = roomPeople.get(room).hand
    var partners = [player, 0]
    for (var i = 0; i < 4; ++i){
      if (peopleHand[i].includes(card)){
        partners[1] = i
        break
      }
    }

    roomPeople.get(room).roomState = 3
    roomPeople.get(room).partners  = partners
    roomPeople.get(room).partnerCard = card


    const roomStateExport = {
      roomState: roomPeople.get(room).roomState,
      bid: roomPeople.get(room).bid,
      partners: roomPeople.get(room).partners,
      cardsPlayed: roomPeople.get(room).cardsPlayed,
      setsWon: roomPeople.get(room).setsWon,
      cardsRemaining: roomPeople.get(room).cardsRemaining
    } 
    console.log(roomStateExport)

    addMessage(message, token, roomStateExport)

    const setStartDelta = (roomStateExport.bid[1] === 4) ? 0 : 1
    socket.to(room).emit("message-recieve", message, token)
    socket.to(room).emit("get-player", (player+setStartDelta)%4)
    socket.in(room).emit("send-data", roomStateExport)
  })

  socket.on('play-card', (cardRemoved, id, room, addMessageAndUpdate) => {
    //Update CardsPlayed
    const cardsPlayed = roomPeople.get(room).cardsPlayed
    cardsPlayed[id] = cardRemoved
    roomPeople.get(room).cardsRemaining[id] -= 1

    // Check if cardPlayed is full
    var cardsPlayedFull = true

    for (var i = 0; i < 4; ++i){
      if (cardsPlayed[i] === -1){
        cardsPlayedFull = false 
        break;
      }
    }

    var partnerRevealed = false
    var player = (id + 1)%4
    var hasTrump = false
    if (cardsPlayedFull){
      var maxPlay = 0
      
      const trump = roomPeople.get(room).bid[1]
      const startID = (id + 1)%4
      
      const partnerCard = roomPeople.get(room).partnerCard

      //check winner + partner Revealed
      for (var i = 0; i < 4; ++i){
        if (Math.floor(cardsPlayed[i]/13) === trump) hasTrump = true
        if (partnerCard === cardsPlayed[i]) partnerRevealed = true
      }
      if (hasTrump){
        for (var i = 0; i < 4; ++i){
          if (Math.floor(cardsPlayed[i]/13) === trump){
            if (cardsPlayed[i] > maxPlay){
              player = i
              maxPlay = cardsPlayed[i]
            }
          }
        }
      }
      else {
        for (var i = 0; i < 4; ++i){
          if (Math.floor(cardsPlayed[i]/13) === Math.floor(cardsPlayed[startID]/13)){
            if (cardsPlayed[i] > maxPlay){
              player = i
              maxPlay = cardsPlayed[i]
            }
          }
        }
      }
      // Update Info 
      roomPeople.get(room).setsWon[player] += 1
      roomPeople.get(room).roundStarter = player
      roomPeople.get(room).cardsPlayed = [-1, -1, -1, -1]
    }
    
    const roomStateExport = {
      roomState: roomPeople.get(room).roomState,
      bid: roomPeople.get(room).bid,
      partners: roomPeople.get(room).partners,
      cardsPlayed: roomPeople.get(room).cardsPlayed,
      setsWon: roomPeople.get(room).setsWon,
      cardsRemaining: roomPeople.get(room).cardsRemaining
    } 

    var gameFinished = true
    for (var i = 0; i < 4; ++i){
      if (roomPeople.get(room).cardsRemaining[i] !== 0) gameFinished = false
    }

    if (gameFinished) {
      // Find winners
      const bidderSide = roomPeople.get(room).partners
      const nonbidders = [-1, -1]
      const setsWon = [0,0]
      const token = makeid(16)

      for (var i = 0; i < 4; ++i){
        setsWon[(bidderSide.includes(i))? 0 : 1] += roomPeople.get(room).setsWon[i]
        if (!bidderSide.includes(i)){
          if (nonbidders[0] === -1) nonbidders[0] = i
          else nonbidders[1] = i 
        }
      }

      const won = (setsWon[0] >= (7 + roomPeople.get(room).bid[0]))
      var message = "Bidders " + roomPeople.get(room).people[bidderSide[0]][0] + " and " + roomPeople.get(room).people[bidderSide[1]][0] + 
                    (won ? " won against " : "lost to ") + "Nonbidders " + 
                    roomPeople.get(room).people[nonbidders[0]][0] + " and " + roomPeople.get(room).people[nonbidders[1]][0] + " " + 
                    setsWon[0] + " to " + setsWon[1]
      
      //reset variables
      roomPeople.get(room).roomState = 0
      roomPeople.get(room).hand = []
      roomPeople.get(room).bid = [-1,-1]
      roomPeople.get(room).bids = []
      roomPeople.get(room).partners = [-1, -1]
      roomPeople.get(room).partnerCard = -1
      roomPeople.get(room).cardsPlayed = [-1,-1,-1,-1]
      roomPeople.get(room).cardsRemaining = [13,13,13,13]
      roomPeople.get(room).roundStarter = -1
      roomPeople.get(room).setsWon = [0, 0, 0, 0] 
      roomPeople.get(room).trumpBroken = false
      
      const roomStateExport = {
        roomState: roomPeople.get(room).roomState,
        bid: roomPeople.get(room).bid,
        partners: roomPeople.get(room).partners,
        cardsPlayed: roomPeople.get(room).cardsPlayed,
        setsWon: roomPeople.get(room).setsWon,
        cardsRemaining: roomPeople.get(room).cardsRemaining
      }
      
      addMessageAndUpdate(player, roomStateExport, hasTrump, partnerRevealed, message, token)

      socket.in(room).emit("send-data", roomStateExport)
      socket.to(room).emit("message-recieve", message, token)      
      socket.in(room).emit("send-card", player, hasTrump, partnerRevealed)
    }
    else {
      //output roundStarter and partnerRevealed (player)
      addMessageAndUpdate(player, roomStateExport, hasTrump, partnerRevealed)

      socket.in(room).emit("send-data", roomStateExport)
      socket.in(room).emit("send-card", player, hasTrump, partnerRevealed)
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