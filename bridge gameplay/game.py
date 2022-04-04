import random
import json

ILLEGAL_PENALTY = -1234567890


class Bridge:

    card_deck = []
    bid_suit = 0
    bid_number = 0

    bidder_num = None

    suits_bid = [[0]*5]*4

    past_cards = []
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

    next_starter = None
    first_suit = None

    partner_card = None

    bidder_sets = 0
    against_sets = 0

    bidder_lst = [0,0,0,0]

    trump_broken = False
    
    all_passed = False

    bids_lst = []

    plays_lst = []


    # This function initializes the Bridge model
    # and resets all the current settings
    def __init__(self, player_num):          
        self.player_num = player_num # set the turn order
        self.reset_all() 

    # This function resets all the variables locally and globally
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
            Bridge.past_cards = []
            Bridge.last_suit = 0
            Bridge.last_number = 0
            Bridge.num_passes = 0
            Bridge.current_phase = Bridge.BID_PHASE
            Bridge.next_starter = 0
            Bridge.first_suit = None
            Bridge.partner_card = None
            Bridge.bidder_sets = 0
            Bridge.against_sets = 0
            Bridge.bidder_lst = [0,0,0,0]
            Bridge.trump_broken = False
            Bridge.all_passed = False
            Bridge.cards_played = []
            Bridge.bid_not_zero = False
            Bridge.game_thrower = None
            Bridge.suits_bid = [[0]*5]*4
            Bridge.bids_lst = []
            Bridge.plays_lst = []

        self.cards = sorted(Bridge.card_deck[::(4-self.player_num)]) # deal the cards as usual
        self.org_cards = self.cards[:]
        for card in self.cards:
            Bridge.card_deck.remove(card)

        self.turn_num = self.player_num # set player num in order of playing
        self.bidder_side = False
        self.sets_won = 0

    

    # This function checks if a card hand has 4 or less points, which means it is a reshuffle
    def check_reshuffle(self):
        return self.get_card_points() <= 4
    
    # This function counts the number of points in the card hand
    def get_card_points(self):

        points = 0
        suit_counts = [0,0,0,0]

        for t in self.cards:
            points += max(0,t[1]-9)
            suit_counts[t[0]-1] += 1

        for count in suit_counts:
            points += max(count-4,0)

        return points

    def get_HCP(self):
        points = 0
        for t in self.cards:
            points += max(0,t[1]-9)

    def get_suit_length(self):
        suit_counts = [0,0,0,0]
        for t in self.cards:
            suit_counts[t[0]-1] += 1

        return suit_counts
    # Executes the action at the current phase
    def play_step(self, action=None): 

        x = Bridge.current_phase

        # This is the bidding phase
        if x == Bridge.BID_PHASE:

            if not self.valid_bid(action):
                return ILLEGAL_PENALTY, False, self.player_num

            self.bid(action)

            if action == [0,0]:
                Bridge.bids_lst.append(-1)
            else:
                Bridge.bids_lst.append(5*(action[0] - 1) + action[1] - 1)

            return 0, False, (self.player_num+1)%4

        # This is the partner calling phase
        elif x == Bridge.CALL_PHASE:
            
            # If you are just checking for partner, i.e. not the bidder
            if self.player_num != Bridge.bidder_num:
                self.check_if_partner()
                if (self.player_num+1)%4 == Bridge.bidder_num:
                    Bridge.current_phase = Bridge.PLAY_PHASE
                return

            if not self.valid_partner(action):
                return ILLEGAL_PENALTY, False, self.player_num

            Bridge.partner_card = action
            return 0, False, Bridge.next_starter

        # This is the card playing phase
        elif Bridge.current_phase == Bridge.PLAY_PHASE: # play the card

            if not self.valid_card_play(action):
                return ILLEGAL_PENALTY, False, self.player_num

            self.play(action)

            if len(Bridge.past_cards) == 0:
                return 0, False, Bridge.next_starter # begin new round
            else:
                return 0, False, (self.player_num+1)%4 # let the next person play

        return

    # This function checks if the bid made by the player is either:
    # a pass,
    # or a bid greater than the current bid
    def valid_bid(self, bid):
        
        number, suit = bid
        if bid == [0,0]: # A pass is always a valid move
            return True
        
        if number <= 0 or number > 7 \
            or suit < 1 or suit > 5: # The parameters should not be out of bounds
            return False
        
        if number > Bridge.last_number: # A bid is valid if the number is greater than the current one
            return True
        
        if number < Bridge.last_number: # A bid is invalid if the number is smaller than the current one
            return False
        
        return suit > Bridge.last_suit # A bid is valid if the suit is greater than the current one

    # This function executes a move to bid or not to bid
    def bid(self, action):
        
        if Bridge.num_passes < 3: # If less than 3 people before you have passed
            
            if action == [0,0]: # You did not win the bid if you passed
                Bridge.num_passes += 1

                if Bridge.num_passes == 3 and Bridge.bid_not_zero: # The person after you has won the bid
                    
                    Bridge.current_phase = Bridge.CALL_PHASE
                    Bridge.bid_number, Bridge.bid_suit = \
                        Bridge.last_number, Bridge.last_suit

                    if Bridge.bid_suit == 5: # If the bidder bid no trump
                        Bridge.next_starter = (self.player_num + 1) % 4
                    else: # If the bidder wins the bid with a trump suit
                        Bridge.next_starter = (self.player_num + 2) % 4

                    Bridge.bidder_num                       = (self.player_num + 1) % 4
                    Bridge.bidder_lst[Bridge.bidder_num]    = 1

            else: # You raised the bid
                Bridge.num_passes                                       = 0
                Bridge.bid_not_zero                                     = True
                Bridge.last_number, Bridge.last_suit                    = action
                Bridge.suits_bid[self.player_num][Bridge.last_suit - 1] = 1

        else: # If all 3 people before you have passed
            
            if action == [0,0]: # If you pass too
                Bridge.num_passes += 1
                Bridge.all_passed = True
                Bridge.current_phase = Bridge.END_PHASE

            else: # You raised the bid
                Bridge.num_passes                                       = 0
                Bridge.bid_not_zero                                     = True
                Bridge.last_number, Bridge.last_suit                    = action
                Bridge.suits_bid[self.player_num][Bridge.last_suit - 1] = 1

    # This function checks if the partner card called by the model is valid
    def valid_partner(self, card):

        if card[1] <= 0 or card[1] > 13 or card[0] < 1 or card[0] > 4: 
            return False

        return card not in self.cards

    # This function checks if the player is the partner to the bidder
    def check_if_partner(self): 
        if Bridge.partner_card in self.cards:
            self.bidder_side = True
            Bridge.bidder_lst[self.player_num] = 1
        
        # If last person to check
        if (self.player_num + 1) % 4 == Bridge.bidder_num:
            Bridge.current_phase = Bridge.PLAY_PHASE
    
    # This function checks if a card played if valid
    def valid_card_play(self, card):
        suit = card[0]
        trump = 0

        # If the card played is not in the hand
        if card not in self.cards: 
            return False

        # Count the number of trump suits owned by player
        for c in self.cards: 
            if c[0] == Bridge.bid_suit:
                trump += 1

        # If player is starting the new round
        if self.player_num == Bridge.next_starter:

            # If the trump has been broken, any card can be played
            if Bridge.trump_broken:
                return True
            
            # If player only has trump suits left in the hand
            elif len(self.cards) == trump and suit == Bridge.bid_suit:
                Bridge.trump_broken = True
                return True

            # The player can only play a non-trump suit
            else: 
                return suit != Bridge.bid_suit
        
        # If player is after the starter
        else:

            # Check if player has the suit of the first card played
            for c in self.cards:
                if c[0] == Bridge.first_suit:
                    return suit == Bridge.first_suit

            # If they don't, any card can be played
            return True
    
    # This function returns the index of the player who won the set
    def largest_card(self, cards):
        
        # Check if a trump card was played
        trumps = []
        right_suits = []
        for i in range(4):
            card = cards[i]
            if card[0] == Bridge.bid_suit:
                trumps.append([card[1],i])
            if card[0] == Bridge.first_suit:
                right_suits.append([card[1],i])

        winner = -1

        # If more than one trump card is played, the largest wins
        if len(trumps) > 0:
            trumps.sort()
            winner = (trumps[-1][1] + Bridge.next_starter)%4

            # Update total sets won
            if Bridge.bidder_lst[winner] == 1: 
                Bridge.bidder_sets += 1
            else:
                Bridge.against_sets += 1

        # Otherwise, the largest of the first suit wins
        else:
            right_suits.sort()
            winner = (right_suits[-1][1] + Bridge.next_starter)%4

            # Update total sets won
            if Bridge.bidder_lst[winner] == 1:
                Bridge.bidder_sets += 1
            else:
                Bridge.against_sets += 1

        # If we have reached the end of the game
        if Bridge.bidder_sets + Bridge.against_sets == 13:
            Bridge.current_phase = Bridge.END_PHASE

        return winner


    # This function executes a move to play a card
    def play(self, card):

        Bridge.cards_played.append(card)
        Bridge.past_cards.append(card)
        
        # Remove card from hand
        self.cards.remove(card) 
        
        # If valid card is trump
        if card[0] == Bridge.bid_suit:
            Bridge.trump_broken = True
        
        # If you are the first player
        if self.player_num == Bridge.next_starter: 
            Bridge.first_suit = card[0]

        # If you are the last player
        elif (self.player_num+1)%4 == Bridge.next_starter: 
            prev_starter = Bridge.next_starter
            Bridge.next_starter = self.largest_card(Bridge.past_cards)
            cards_to_int = []
            for i in Bridge.past_cards:
                cards_to_int.append(5 * (i[0] - 1) + i[1] - 1)
            desc = "Round: " + str(int(len(Bridge.cards_played) / 4)) + "\nPlayer " + str(prev_starter + 1) + " starts\nPlayer " + str(Bridge.next_starter + 1) + " wins."
            play = {'cards': cards_to_int, 'start': prev_starter, 'win': Bridge.next_starter, 'desc': desc}
            Bridge.plays_lst.append(play)
            Bridge.past_cards = []

    def get_rewards(self):

        side = Bridge.bidder_lst[self.player_num]

        bid_win = [20,34,57,96.25,168+2/3,325,819] # net zero sum
        non_bid_win = [13,55/6,6,3.5,5/3,0.5,0]
            
        if Bridge.bidder_sets >= 6 + Bridge.bid_number: # bidder win
            if side == 1:
                return bid_win[Bridge.bid_number-1] # bidder side win
            else: 
                return -Bridge.against_sets**2 # against side lose
        else: # against win
            if side == 0: 
                return non_bid_win[Bridge.bid_number-1] # against side win
            else: 
                return -(6+Bridge.bid_number-Bridge.bidder_sets)**2 # bidder side lose

    def write_to_json(self):
        partner_card_to_int = 13 * (Bridge.partner_card[0] - 1) + Bridge.partner_card[1] - 1
        partner_num = -1
        for i in range(0,4):
            if Bridge.bidder_lst[i] == 1 & i != Bridge.bidder_num:
                partner_num = i
        winners = []
        if Bridge.bidder_lst[Bridge.next_starter] == 1:
            for i in range(0,4):
                if Bridge.bidder_lst[i] == 1:
                    winners.append(i)
        else:
            for i in range(0,4):
                if Bridge.bidder_lst[i] == 0:
                    winners.append(i)
        data = {'bids': Bridge.bids_lst, 'partner': {'card': partner_card_to_int, 'id': partner_num}, 'plays': Bridge.plays_lst, 'winners': winners}
        with open('game_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
