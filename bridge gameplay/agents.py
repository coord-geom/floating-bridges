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

    def remember(self, state, action, reward, state_, done):
        self.memory.append((state, action, reward, state_, done))

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
    
    def train_long_memory(self):
        if len(self.memory) > BATCH_SIZE:
            mini_sample = random.sample(self.memory, BATCH_SIZE) # list of tuples
        else:
            mini_sample = self.memory

        states, actions, rewards, next_states, dones = zip(*mini_sample)
        self.trainer.train_step(states, actions, rewards, next_states, dones)

    def train_short_memory(self, state, action, reward, next_state, done):
        self.trainer.train_step(state, action, reward, next_state, done)
    

class CallingAgent(Agent):
    pass

class PlayingAgent(Agent):
    pass