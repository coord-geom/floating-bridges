from uuid import uuid4
from random import choice, shuffle

# Source https://github.com/GnohChengYi/BridgeSG/blob/master/bridge.py
# Thank you alumni!

def get_HCP(hand):
    '''Returns High Card Points. A=4, K=3, Q=2, J=1.'''
    HCP = 0
    numPoints = {'A':4, 'K':3, 'Q':2, 'J':1}
    for card in hand:
        num = card[1]
        if num in numPoints:
            HCP += numPoints[num]
    return HCP

def get_TP(hand):
    '''Returns Total Points = HCP + length points.'''
    TP = get_HCP(hand)
    suitCards = {suit:[] for suit in Game.suits}
    for card in hand:
        suitCards[card[0]].append(card)
    for suit in suitCards:
        if len(suitCards[suit]) > 4:
            TP += len(suitCards[suit]) - 4
    return TP

def compare_cards(card1, card2, leadingSuit, trump):
    '''Returns 1 if card1>card2, -1 if card1<card2, else 0.'''
    numbers = Game.numbers
    if card1[0]==card2[0]: # same suit
        if numbers.index(card2[1]) < numbers.index(card1[1]):
            return -1
        if numbers.index(card1[1]) < numbers.index(card2[1]):
            return 1
        return 0
    if (card1[0]==trump or card1[0]==leadingSuit) and card2[0]!=trump:
        return 1
    if (card2[0]==trump or card2[0]==leadingSuit) and card1[0]!=trump:
        return -1
    # both cards not leading suit and not trump
    return 0

def lowest_card(cards, trump):
    '''Returns card with lowest number that is not trump.'''
    nonTrumps = [card for card in cards if card[0]!=trump]
    if not nonTrumps:
        # all trump, sorted after dealt, last card is lowest
        return cards[-1]
    nonTrumps.sort(key=lambda card: Game.numbers.index(card[1]))
    return nonTrumps[-1]
    

class Game:
    # {chatId:Game}, store all games
    games = {}
    suits = 'CDHS'
    numbers = 'AKQJT98765432'
    deck = (
        'CA','CK','CQ','CJ','CT','C9','C8','C7','C6','C5','C4','C3','C2',
        'DA','DK','DQ','DJ','DT','D9','D8','D7','D6','D5','D4','D3','D2',
        'HA','HK','HQ','HJ','HT','H9','H8','H7','H6','H5','H4','H3','H2',
        'SA','SK','SQ','SJ','ST','S9','S8','S7','S6','S5','S4','S3','S2'
    )
    bids = (
        '1C', '1D', '1H', '1S', '1N', 
        '2C', '2D', '2H', '2S', '2N', 
        '3C', '3D', '3H', '3S', '3N', 
        '4C', '4D', '4H', '4S', '4N', 
        '5C', '5D', '5H', '5S', '5N', 
        '6C', '6D', '6H', '6S', '6N', 
        '7C', '7D', '7H', '7S', '7N'
    )
    PASS = 'PASS'
    JOIN_PHASE = 0
    BID_PHASE = 1
    CALL_PHASE = 2
    PLAY_PHASE = 3
    END_PHASE = 4
    
    def __init__(self, id):
        self.id = id
        self.players = []   # leading player of current trick always first
        self.phase = Game.JOIN_PHASE
        self.activePlayer = None
        self.declarer = None
        self.bid = Game.PASS   # 1N, 2S, 3H, 4D, 5C, etc.
        self.trump = '' # ''=N, S, H, D, C
        self.contract = 0   # 7, 8, 9, 10, 11, 12, 13
        self.partnerCard = None
        # list of cards, corresponds to current order of players
        # None if not play card yet
        self.currentTrick = [None]*4
        self.trumpBroken = False
        self.totalTricks = 0    # declarer+partner's tricks, update in end phase
        self.winners = set()
        Game.games[id] = self

    def full(self):
        return len(self.players) >= 4
    
    def add_human(self, id, name):
        if self.full() or id in Player.players:
            return False
        player = Player(id, name)
        self.players.append(player)
        player.game = self
        return True
    
    def del_human(self, id):
        if id not in Player.players:    # not in any game
            return False
        player = Player.players[id]
        if player not in self.players:  # not in this game
            return False
        self.players.remove(player)
        del player
        del Player.players[id]
        return True
    
    def add_AI(self):
        if self.full():
            return False
        # make sure no repeated ids
        while True:
            id = str(uuid4())[:8]
            if id not in Player.players:
                break
        name = 'AI ' + id[:5]
        player = Player(id, name, isAI=True)
        self.players.append(player)
        player.game = self
        return True
    
    def del_AI(self):
        for player in self.players:
            if player.isAI:
                self.players.remove(player)
                del Player.players[player.id]
                del player
                return True
        return False
    
    def start(self):
        self.phase = Game.BID_PHASE
        dealDeck = list(Game.deck)
        while True:
            shuffle(dealDeck)
            hands = [dealDeck[i:i+13] for i in (0, 13, 26, 39)]
            redeal = False
            for hand in hands:
                # everyone happy(?); don't set too strict otw ~infinite loop
                if get_TP(hand) < 8:
                    redeal = True
                    break
            if redeal:
                continue
            key = lambda x: (x[0], Game.numbers.index(x[1]))
            for i in range(4):        
                self.players[i].hand = sorted(hands[i], key=key)
            break
        self.activePlayer = self.players[0]
    
    def stop(self):
        self.phase = Game.END_PHASE
        for player in self.players:
            if player.id in Player.players:
                del Player.players[player.id]
        if self.id in Game.games:
            del Game.games[self.id]
    
    def next(self):
        self.activePlayer = \
            self.players[(self.players.index(self.activePlayer) + 1) % 4]
    
    def valid_bids(self):
        if self.bid == Game.PASS:
            return (Game.PASS,) + Game.bids
        index = Game.bids.index(self.bid)
        return (Game.PASS,) + Game.bids[index+1:]
    
    def start_play(self):
        # 2N for 2 No Trump self.bid. '' for no trump self.trump.
        self.trump = self.bid[1] if self.bid[1]!='N' else ''
        self.contract = int(self.bid[0]) + 6
        self.phase = Game.PLAY_PHASE
        # next player lead if have trump, declarer lead if no trump
        if self.trump:
            self.next()
        # reorder players list so that first player leads
        index = self.players.index(self.activePlayer)
        self.players = self.players[index:] + self.players[:index]
        #print('declarer:', self.declarer.name)
        #print('bid:', self.bid)
        #print('partner:', self.partnerCard)
    
    def winning_index(self):
        if not self.currentTrick[0]:
            return
        numbers = Game.numbers
        trick = self.currentTrick
        leadingSuit = trick[0][0]
        trump = self.trump
        winIndex = 0
        for i in range(len(trick)):
            if not trick[i]:
                break
            card1 = trick[winIndex]
            card2 = trick[i]
            if card1[0]==card2[0]: # same suit
                if numbers.index(card2[1]) < numbers.index(card1[1]):
                    winIndex = i
            elif card1[0]!=trump and card2[0]==trump:
                winIndex = i
            elif  card1[0] != trump and card2[0]==leadingSuit:
                winIndex = i
        return winIndex
    
    def complete_trick(self):
        winIndex = self.winning_index()
        winner = self.players[winIndex]
        winner.tricks += 1
        self.activePlayer = winner
        self.players = self.players[winIndex:] + self.players[:winIndex]
        self.currentTrick = [None]*4
        if len(self.activePlayer.hand) == 0:    # next player no more cards=end
            self.conclude()
    
    def conclude(self):
        self.phase = Game.END_PHASE
        self.totalTricks = self.declarer.tricks
        if self.declarer.partner is not self.declarer:
            self.totalTricks += self.declarer.partner.tricks
        self.winners = {self.declarer, self.declarer.partner}
        if self.totalTricks < self.contract:
            self.winners = set(self.players) - self.winners


class Player:
    # {userId:Player}, store all players
    players = {}
    
    def __init__(self, id, name, isAI=False):
        self.id = id
        self.name = name
        self.game = None
        self.isAI = isAI
        self.hand = []
        self.handMessage = None
        self.partner = None
        self.tricks = 0
        if isAI:
            self.maxBid = None
            self.enemies = []
        Player.players[id] = self
    
    def make_bid(self, bid=Game.PASS):
        game = self.game
        if self is not game.activePlayer:
            return
        validBids = game.valid_bids()
        if self.isAI:
            bid = self.choose_bid_AI(validBids)
        if bid not in validBids:
            return
        if bid!=Game.PASS:
            game.declarer = self
            game.bid = bid
        game.next()
        # everyone passed, nobody bidded
        if game.activePlayer==game.players[0] and game.bid==Game.PASS:
            game.stop()
        if game.activePlayer == game.declarer:
            game.phase = Game.CALL_PHASE
        return bid
    
    def call_partner(self, card='SA'):
        game = self.game
        if self is not game.activePlayer:
            return
        if self.isAI:
            card = self.choose_partner_AI()
        if card not in Game.deck:
            print('ERROR: Called card {} not in deck!'.format(card))
            return
        game.partnerCard = card
        for player in game.players:
            if player.isAI:
                # initialise enemies for AI player
                player.enemies = [p for p in game.players if p is not player]
            if card in player.hand:
                # only care who is declarer's partner
                # play whole game and see
                # whether declarer and partner (possibly self) fulfill contract
                self.partner = player
                # remove declarer from enemies if player is partner
                if player.isAI and self in player.enemies:
                    player.enemies.remove(self)
        game.start_play()
        return card
    
    def play_card(self, card='SA'):
        game = self.game        
        if self is not game.activePlayer:
            return
        validCards = self.valid_cards()
        if self.isAI:
            # pass validCards so that no need to call valid_cards() again in AI
            card = self.choose_card_AI(validCards)
        if card not in validCards:
            return
        self.hand.remove(card)
        index = game.players.index(self)
        game.currentTrick[index] = card
        # call game.complete_trick() in bot.py after showing current tricks
        if self is not game.players[-1]:
            game.next()
        if not game.trumpBroken and card[0]==game.trump:
            game.trumpBroken = True
        # self played partner card -> update AI enemies
        if card==game.partnerCard:
            for player in game.players:
                if not player.isAI or player is self:
                    # self is partner, already know who are enemies
                    continue
                if player is game.declarer:
                    if self in player.enemies:
                        # declarer remove self (partner) from enemies
                        player.enemies.remove(self)
                else:
                    # non-declaring side update enemies, self is declarer's partner
                    player.enemies = [game.declarer, self]
        #print(self.name, self.hand, card)
        return card
    
    def choose_bid_AI(self, validBids):
        if not self.maxBid:
            HCP = get_HCP(self.hand)
            suitLengths = {
                suit : len([card for card in self.hand if card[0]==suit]) 
                for suit in Game.suits
            }   # {suit:length}
            maxLength = max(suitLengths.values())
            minLength = min(suitLengths.values())
            if maxLength <= 4 and minLength >= 2:   # try no trump
                maxBidNum = round(0.25 * HCP - 1.75)
                maxBidNum = min(maxBidNum, 7)
                self.maxBid = str(maxBidNum) + 'N' if maxBidNum > 0 else Game.PASS
            else:   # find preferred trump
                # many suits longest -> take highest suit (S>H>D>C)
                for suit in Game.suits[::-1]:
                    if suitLengths[suit]==maxLength:
                        preferredSuit = suit
                        break
                maxBidNum = round(0.23 * HCP + 0.70 * maxLength - 4.39)
                maxBidNum = min(maxBidNum, 7)
                if maxBidNum > 0:
                    self.maxBid = str(maxBidNum) + preferredSuit
                else:
                    self.maxBid = Game.PASS
        if self.maxBid==Game.PASS or self.maxBid not in validBids:
            return Game.PASS
        # current bid has preferred suit/NT
        if self.game.bid[1]==self.maxBid[1]:
            return Game.PASS
        # bid lowest preferred
        for bid in validBids:
            if bid[1]==self.maxBid[1]:
                return bid
    
    def choose_partner_AI(self):
        game = self.game
        trump = game.bid[1] # start_play not called yet so game.trump not set yet
        if trump != 'N':
            aceTrump = trump + 'A'
            if aceTrump not in self.hand:
                return aceTrump
            kingTrump = trump + 'K'
            if kingTrump not in self.hand:
                return kingTrump
        for card in ('SA', 'HA', 'DA', 'CA', 'SK', 'HK', 'DK', 'CK'):
            if card not in self.hand:
                return card
        return choice(Game.deck)

    def choose_card_AI(self, validCards):
        game = self.game
        winIndex = game.winning_index()
        if winIndex==None:
            # self is leading player, play random card
            return choice(validCards)
        winPlayer = game.players[winIndex]
        if winPlayer not in self.enemies:
            # partner winning -> play lowest card
            return lowest_card(validCards, game.trump)
        winCard = game.currentTrick[winIndex]
        leadingSuit = game.currentTrick[0][0]
        lowestWinningCard = None
        for card in validCards:
            if compare_cards(card, winCard, leadingSuit, game.trump)==1:
                # validCards sorted when dealing. 
                if self is not game.players[-1]:
                    # Plays highest card to win if not last player.
                    return card
                else:
                    # Last player. Track lowest card that can win.
                    lowestWinningCard = card
        if lowestWinningCard:
            # Last player. Plays lowest card that can win.
            return lowestWinningCard
        # cannot win -> play lowest card
        return lowest_card(validCards, game.trump)

    def valid_cards(self):
        leadingCard = self.game.currentTrick[0]
        game = self.game
        if not leadingCard:
            result = self.hand
            if game.trump and not game.trumpBroken:
                result = list(filter(lambda card:card[0]!=game.trump, result))
            return result if len(result)>0 else self.hand
        leadingSuit = leadingCard[0]
        result = [card for card in self.hand if card[0]==leadingSuit]
        return result if len(result)>0 else self.hand


def trial():
    game = Game(0)
    for i in range(4):
        game.add_AI()
    game.start()
    while game.phase == Game.BID_PHASE:
        game.activePlayer.make_bid()
    if not game.declarer:  # everyone passed, game stopped 
        del game
        return
    game.declarer.call_partner()
    while game.phase != Game.END_PHASE:
        for i in range(4):
            game.activePlayer.play_card()
        game.complete_trick()
    game.stop()
    if game.totalTricks - game.contract >= 1:
        del game
        return True
    del game
    return False

def run_trials(num):
    contractAchieved = 0
    for i in range(num):
        if trial():
            contractAchieved += 1
    print('declarer win/almost win rate: {:.3f}'.format(contractAchieved/num))


if __name__=='__main__':
    run_trials(100000)