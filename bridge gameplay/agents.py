import torch
import numpy as np
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
    def __init__(self):
        self.model   = Linear_QNet(40,50,36)
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
            pass
        
    

class CallingAgent(Agent):
    pass

class PlayingAgent(Agent):
    pass