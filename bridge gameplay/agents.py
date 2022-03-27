import torch
import numpy as np
import random
from model import Linear_QNet, QTrainer
from itertools import deque

BATCH_SIZE = 1000
MAX_MEMORY = 100000
LR = 0.01

class Agent:
    def __init__(self):
        self.epsilon    = 1
        self.eps_min    = 0.01
        self.eps_dec    = 0.0005
        self.gamma      = 0.9
        self.memory     = deque(maxlen=MAX_MEMORY)
    
    def train_long_memory(self):
        if len(self.memory) > BATCH_SIZE:
            mini_sample = random.sample(self.memory, BATCH_SIZE) # list of tuples
        else:
            mini_sample = self.memory

        states, actions, rewards, next_states, dones = zip(*mini_sample)
        self.trainer.train_step(states, actions, rewards, next_states, dones)

    def train_short_memory(self, state, action, reward, next_state, done):
        self.trainer.train_step(state, action, reward, next_state, done)

    def remember(self, state, action, reward, state_, done):
        self.memory.append((state, action, reward, state_, done))
    

class BiddingAgent(Agent):

    OUTPUT_MAP = [
                    [0, 0],
                    [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], 
                    [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], 
                    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], 
                    [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], 
                    [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], 
                    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], 
                    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5]
                                                            ]

    def __init__(self):
        self.model   = Linear_QNet(43,51,36)
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)
    
    def get_state(self, game):
        state = []

        cards = game.cards
        for card in cards:
            state.append(card[0])
            state.append(card[1])

        suits_bid = game.suits_bid
        for i in range(1,4):
            id = (game.player_num+i)%4
            state.extend(suits_bid[id])
        
        state.append(game.last_number, game.last_suit)


    def get_action(self, state, game):
        if np.random.random() > self.epsilon:
            move = torch.argmax(self.model(torch.tensor(state))).item()
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return BiddingAgent.OUTPUT_MAP[move]
        else:
            bids = [[0,0]]
            for i in range(1,8):
                for j in range(1,6):
                    if game.last_number < i:
                        bids.append([i,j])
                    elif game.last_number == i and game.last_suit < j:
                        bids.append([i,j])
            move = random.randrange(len(bids))
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return bids[move] 
    

class CallingAgent(Agent):
    OUTPUT_MAP = [
                    [1, 10], [1, 11], [1, 12], [1, 13], 
                    [2, 10], [2, 11], [2, 12], [2, 13],
                    [3, 10], [3, 11], [3, 12], [3, 13],
                    [4, 10], [4, 11], [4, 12], [4, 13]
                                                        ]

    def __init__(self):
        self.model   = Linear_QNet(43,39,16)
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)
    
    def get_state(self, game):
        state = []

        cards = game.cards
        for card in cards:
            state.append(card[0])
            state.append(card[1])

        suits_bid = game.suits_bid
        for i in range(1,4):
            id = (game.player_num+i)%4
            state.extend(suits_bid[id])
        
        state.append(game.last_number, game.last_suit)

    def get_action(self, state, game):
        if np.random.random() > self.epsilon:
            move = torch.argmax(self.model(torch.tensor(state))).item()
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return CallingAgent.OUTPUT_MAP[move]
        else:
            called = False
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            while (not called):
                call = random.choice(CallingAgent.OUTPUT_MAP)
                if call not in game.cards:
                    called = True
                    return call

class PlayingAgent(Agent):

    def __init__(self):
        self.model   = Linear_QNet(51,42,13)
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)
    
    def get_state(self, game):
        state = []

        cards = game.cards
        for card in cards:
            state.append(card[0])
            state.append(card[1])
        for i in range(13-len(cards)):
            state.append(0)
            state.append(0)

        suits_bid = game.suits_bid
        for i in range(1,4):
            id = (game.player_num+i)%4
            state.extend(suits_bid[id])
        
        state.append(game.last_number, game.last_suit)

        # partner
        if game.bidder_side: state.append(1)
        else: state.append(0)

        # last 3 cards played
        past_cards = game.past_cards
        if len(past_cards) >= 3:
            for i in range(3):
                out = past_cards.pop()
                state.append(out[0])
                state.append(out[1])
        else:
            non_cards = 3-len(past_cards)
            for tuple in past_cards:
                state.append(tuple[0])
                state.append(tuple[1])
            for i in range(non_cards): 
                    state.append(-1)
                    state.append(-1)
        
        # trump broken
        if game.trump_broken: state.append(1)
        else: state.append(0)


    def get_action(self, state, game):
        if np.random.random() > self.epsilon:
            move = torch.argmax(self.model(torch.tensor(state))).item()
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return game.org_cards[move]
        else:
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return game.org_cards[random.randrange(13)]