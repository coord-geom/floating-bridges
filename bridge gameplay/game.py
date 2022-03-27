import random
from collections import deque

class Bridge:

    card_deck = []
    bid_suit = 0
    bid_number = 0

    bidder_num = None

    suits_bid = [[0]*5]*4

    past_bids = deque(maxlen=4)
    past_cards = deque(maxlen=4)
    bid_not_zero = False

    cards_played = []

    last_suit = 0
    last_number = 0

    num_passes = 0

    BID_PHASE = 0
    CALL_PHASE = 1
    PLAY_PHASE = 2
    END_PHASE = 3

    current_phase = 0

    next_starter = 0
    first_suit = None

    partner_revealed = False
    partner_card = None

    bidder_sets = 0
    against_sets = 0

    bidder_lst = [0,0,0,0]

    trump_broken = False
    
    reshuffle = False

    all_passed = False

    game_thrower = None

    stop_game = False

    def __init__(self, player_num):          
        self.player_num = player_num # set the turn order
        self.reset_all() 

    def reset_all(self):
        if self.player_num == 0: # if game start
            Bridge.card_deck = []
            for i in range(1,5): # 1 -> club, 2 -> diamond, 3 -> heart, 4 -> spade, 5 -> no trump
                    for j in range(1,14): # 1 -> 2, 2 -> 3, 3 -> 4, ... 12 -> K, 13 -> A
                        Bridge.card_deck.append([i,j])
            random.shuffle(Bridge.card_deck) # shuffle the deck of cards

            # reset everything
            Bridge.bid_suit = 0
            Bridge.bid_number = 0
            Bridge.bidder_num = None
            Bridge.past_bids = deque(maxlen=4)
            Bridge.past_cards = deque(maxlen=4)
            Bridge.last_suit = 0
            Bridge.last_number = 0
            Bridge.num_passes = 0
            Bridge.current_phase = Bridge.BID_PHASE
            Bridge.next_starter = 0
            Bridge.first_suit = None
            Bridge.partner_revealed = False
            Bridge.partner_card = None
            Bridge.bidder_sets = 0
            Bridge.against_sets = 0
            Bridge.bidder_lst = [0,0,0,0]
            Bridge.trump_broken = False
            Bridge.reshuffle = False
            Bridge.stop_game = False
            Bridge.all_passed = False
            Bridge.cards_played = []
            Bridge.bid_not_zero = False
            Bridge.game_thrower = None

        self.cards = sorted(Bridge.card_deck[::(4-self.player_num)]) # deal the cards as usual
        for card in self.cards:
            Bridge.card_deck.remove(card)

        self.turn_num = self.player_num # set player num in order of playing
        self.bidder_side = False
        self.is_partner = False
        self.sets_won = 0

        #if self.check_reshuffle(): # end the game if it is a hand to reshuffle
        #    Bridge.current_phase = Bridge.END_PHASE
        #    Bridge.reshuffle = True

    def check_reshuffle(self):
        return self.get_card_points() <= 4
    
    def get_card_points(self):
        points = 0
        suit_counts = [0,0,0,0]
        for t in self.cards:
            points += max(0,t[1]-9)
            suit_counts[t[0]-1] += 1
        for count in suit_counts:
            points += max(count-4,0)
        return points

    def play_step(self, action): # return reward, gameover, next player

        reward = 0
        game_over = False

        if Bridge.current_phase == Bridge.BID_PHASE: # if in bidding phase
            valid, win = self.bid(action) # make the bid
            if win:
                return reward, game_over, self.player_num
            if not valid:
                return -10000000, game_over, self.player_num
            return reward, game_over, (self.player_num+1)%4
        elif Bridge.current_phase == Bridge.CALL_PHASE: # if in call partner phase
            if Bridge.bidder_num == self.player_num: # call the partner
                valid = self.call_partner(action)
                if valid:
                    return reward, game_over, (self.player_num+1)%4
                else:
                    return -10000000, game_over, self.player_num
            else:
                result = self.check_if_partner() # check if you're partner
                if result: # result returns if you're last person to check
                    Bridge.current_phase = Bridge.PLAY_PHASE
                    return reward, game_over, Bridge.next_starter # person after bidder starts
                else:
                    return reward, game_over, (self.player_num+1)%4 # let the next person check
        elif Bridge.current_phase == Bridge.PLAY_PHASE: # play the card
            result = self.play(action)
            if not result:
                return -10000000, game_over, self.player_num
            if len(Bridge.past_cards) == 0:
                return reward, game_over, Bridge.next_starter # begin new round
            else:
                return reward, game_over, (self.player_num+1)%4 # let the next person play
        else: # end phase
            return self.end_game()

    def valid_bid(self, bid): # check if bid is higher
        number, suit = bid
        if suit == 0 and number == 0: return True # pass if valid
        if number <= 0 or number > 7 or suit < 1 or suit > 5: return False
        if number > Bridge.last_number: return True
        if number < Bridge.last_number: return False
        return suit > Bridge.last_suit

    def bid(self, action): # returns validity of bid, and if you won the bid
        if Bridge.num_passes < 3:
            if Bridge.last_number == 7 and Bridge.last_suit == 5: # if the previous person bid 7nt
                Bridge.past_bids.append([0,0]) # auto pass
                Bridge.num_passes += 1
                return True, False 
            elif self.valid_bid(action):
                Bridge.past_bids.append(action)
                if action == [0,0]: Bridge.num_passes += 1 # pass
                else: 
                    Bridge.bid_not_zero = True
                    Bridge.last_number, Bridge.last_suit = action # raise bid
                    Bridge.suits_bid[self.player_num][action[1]-1] = 1
                    Bridge.num_passes = 0 # reset passes
                return True, False
            return False, False # invalid bid
        else: # 3 passes
            if Bridge.last_number == 7 and Bridge.last_suit == 5: # you bid 7nt
                return True, True
            else:
                if not Bridge.bid_not_zero: # everyone passes at the start
                    if action == [0,0]: # if you pass
                        Bridge.past_bids.append([0,0])
                        Bridge.all_passed = True
                        Bridge.current_phase = Bridge.END_PHASE
                        return True, False
                    else:
                        if self.valid_bid(action):
                            Bridge.past_bids.append(action)
                            Bridge.last_number, Bridge.last_suit = action # raise bid
                            Bridge.suits_bid[self.player_num][action[1]-1] = 1
                            Bridge.num_passes = 0 # reset passes
                            return True, False
                        else: return False, False
                else: # you win your bid
                    Bridge.current_phase = Bridge.CALL_PHASE
                    Bridge.bid_number, Bridge.bid_suit = \
                        Bridge.last_number, Bridge.last_suit
                    if Bridge.bid_suit == 5: Bridge.next_starter = self.player_num # if bid is no trump
                    else: Bridge.next_starter = (self.player_num+1)%4
                    self.bidder_side = True
                    Bridge.bidder_num = self.player_num
                    Bridge.bidder_lst[self.player_num] = 1
                    return True, True

    def valid_partner(self, suit, number):
        if number <= 0 or number > 13 or suit < 1 or suit > 4: return False
        return (suit,number) not in self.cards

    def call_partner(self, action):
        if self.valid_partner(action[0], action[1]):
            Bridge.partner_card = [action[0],action[1]]
            return True
        else:
            return False

    def check_if_partner(self): # return whether the next player is the bidder
        if Bridge.partner_card in self.cards:
            self.is_partner = True
            self.bidder_side = True
            Bridge.bidder_lst[self.player_num] = 1
        return (self.player_num+1)%4 == Bridge.bidder_num
    
    def valid_card_play(self, suit, number):
        trump = 0
        cards = self.cards
        if [suit,number] not in cards: return False
        for i in range(len(cards)):
            card = cards[i]
            if card[0] == Bridge.bid_suit:
                trump += 1
        if self.player_num == Bridge.next_starter: # if starting the round
            if len(self.cards) == trump and suit == Bridge.bid_suit: # only trumps left in hand
                return True
            elif Bridge.trump_broken: # can play any suit if trump broken
                return True
            else: return suit != Bridge.bid_suit # only play non trump
        else: # not starting the round
            right_suits = False
            for i in range(len(cards)):
                card = cards[i]
                if card[0] == Bridge.first_suit:
                    right_suits = True
                    break
            if right_suits: # if have the suit of the first card played
                return suit == Bridge.first_suit
            return True
 
    def largest_card(self, cards): # return person with the largest card
        # check if a trump card was played
        trumps = []
        right_suits = []
        for i in range(4):
            card = cards[i]
            if card[0] == Bridge.bid_suit:
                trumps.append([card[1],i])
            if card[0] == Bridge.first_suit:
                right_suits.append([card[1],i])
        if len(trumps) > 0: # largest trump wins
            trumps.sort()
            winner = (trumps[-1][1] + Bridge.next_starter)%4
            if Bridge.bidder_lst[winner] == 1: # update total sets won 
                Bridge.bidder_sets += 1
            else:
                Bridge.against_sets += 1
            if Bridge.bidder_sets == 6 + Bridge.bid_number \
                or Bridge.against_sets == 8 - Bridge.bid_number: # end game early if winner found
                Bridge.current_phase = Bridge.END_PHASE
            return winner
        else: # largest non-trump wins
            right_suits.sort()
            winner = (right_suits[-1][1] + Bridge.next_starter)%4
            if Bridge.bidder_lst[winner] == 1: # update total sets won
                Bridge.bidder_sets += 1
            else:
                Bridge.against_sets += 1
            if Bridge.bidder_sets == 6 + Bridge.bid_number \
                or Bridge.against_sets == 8 - Bridge.bid_number: # end game early if winner found
                Bridge.current_phase = Bridge.END_PHASE
            return winner     

    def play(self, action):
        if self.valid_card_play(action[0], action[1]):
            Bridge.cards_played.append([action[0],action[1]])
            Bridge.past_cards.append(action)
            self.cards.remove([action[0],action[1]]) # remove card from hand
            if action[0] == Bridge.bid_suit and Bridge.trump_broken == False: # if valid card is trump
                Bridge.trump_broken = True 
            if self.player_num == Bridge.next_starter: # if you are the first player
                Bridge.first_suit = action[0]
            if (action[0],action[1]) == Bridge.partner_card: # if you reveal partner this turn
                Bridge.partner_revealed = True
            if (self.player_num+1)%4 == Bridge.next_starter: # if you are playing last
                Bridge.next_starter = self.largest_card(list(Bridge.past_cards))
                Bridge.past_cards = deque(maxlen=4)
            return True
        else: # invalid card
            return False

    def end_game(self):
        if Bridge.reshuffle:
            Bridge.stop_game = True
            return 0,True,(self.player_num+1)%4
        
        if Bridge.all_passed:
            if self.player_num == 3: # play starts from player 0
                Bridge.stop_game = True
            return -10000000,True,(self.player_num+1)%4

        if Bridge.game_thrower is not None:
            if self.player_num == self.next_starter:
                return -10000000,True,(self.player_num+1)%4
            elif (self.player_num+1)%4 == Bridge.next_starter:
                Bridge.stop_game = True
            return 0,True,(self.player_num+1)%4

        side = Bridge.bidder_lst[self.player_num]

        if (self.player_num+1)%4 == Bridge.next_starter: # one round to close
            Bridge.stop_game = True
            
        if Bridge.bidder_sets == 6 + Bridge.bid_number: # bidder win
            if side == 1: return 2**Bridge.bid_number,True,(self.player_num+1)%4 # bidder side
            else: return -2**Bridge.bid_number,True,(self.player_num+1)%4 # against side
        else: # against win
            if side == 0: return 20,True,(self.player_num+1)%4 # against side
            else: return -20,True,(self.player_num+1)%4 # bidder side
