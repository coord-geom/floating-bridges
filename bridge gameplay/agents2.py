import torch
import numpy as np
import random
from model2 import Linear_QNet, QTrainer
from collections import deque
from game import Bridge

BATCH_SIZE = 10000
MAX_MEMORY = 1000000
LR = 0.001

class Agent:
    def __init__(self):
        self.epsilon = 1
        self.eps_min = 0.01
        self.eps_dec = 0.00001
        self.gamma   = 0.9
        self.memory  = deque(maxlen=MAX_MEMORY)

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
        super().__init__()
        self.model   = Linear_QNet(69,82,36)
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)
    
    def get_state(self, game):
        state = []

        played = [0]*52
        for c in game.cards:
            played[(c[0]-1)*13+(c[1]-1)] = 1
        state.extend(played)

        suits_bid = Bridge.suits_bid
        for i in range(1,4):
            id = (game.player_num+i)%4
            state.extend(suits_bid[id])
        
        state.extend([Bridge.last_number, Bridge.last_suit])

        return state


    def get_action(self, state, game):
        if np.random.random() > self.epsilon:
            s = torch.tensor(state)
            s = s.type(torch.float32)
            x = self.model(s)
            move = torch.argmax(x).item()
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return BiddingAgent.OUTPUT_MAP[move]
        else:
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return self.explore(game) 

    def explore(self, game):
        id = 0
        if game.last_number > 0:
            id = game.last_suit + (game.last_number-1) * 5

        bids = [[0,0] for _ in range(8)]
        for i in range(4):
            if id+i+1 >= len(BiddingAgent.OUTPUT_MAP): 
                break
            else: 
                bids.append(BiddingAgent.OUTPUT_MAP[id+i+1])

        return bids[random.randrange(len(bids))]
    
    def load_state(self, checkpoint):
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.trainer.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

class PlayingAgent(Agent):

    def __init__(self):
        super().__init__()
        self.model   = Linear_QNet(130,100,13)
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)
    
    def get_state(self, game):
        state = []

        played = [0]*52
        for c in game.cards:
            played[(c[0]-1)*13+(c[1]-1)] = 1
        state.extend(played)

        suits_bid = Bridge.suits_bid
        for i in range(1,4):
            id = (game.player_num+i)%4
            state.extend(suits_bid[id])
        
        state.append(Bridge.last_suit)

        state.extend(game.partner_card)

        # partner
        if game.bidder_side: state.append(1)
        else: state.append(0)

        # last 3 cards played
        past_cards = Bridge.past_cards
        if len(past_cards) == 3:
            for c in past_cards:
                state.extend(c)
        else:
            non_cards = 3-len(past_cards)
            for tuple in past_cards:
                state.extend(tuple)
            for i in range(non_cards): 
                    state.extend([0,0])
        
        # trump broken
        if Bridge.trump_broken: state.append(1)
        else: state.append(0)

        played = [0]*52
        for c in Bridge.cards_played:
            played[(c[0]-1)*13+(c[1]-1)] = 1
        state.extend(played)

        return state

    def get_action(self, state, game):
        if np.random.random() > self.epsilon:
            s = torch.tensor(state)
            s = s.type(torch.float32)
            x = self.model(s)
            move = torch.argmax(x).item()
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return game.org_cards[move]
        else:
            if self.epsilon > self.eps_min: self.epsilon -= self.eps_dec
            return self.explore(game)
    
    def explore(self, game):
        valid = []
        for card in game.cards:
            if game.valid_card_play(card):
                valid.append(card)
        return valid[random.randrange(len(valid))]

    def load_state(self, checkpoint):
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.trainer.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])