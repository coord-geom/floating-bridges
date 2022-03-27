from turtle import st
from typing import final
import torch
import random
import numpy as np
from collections import deque
from game import Bridge
from model import Linear_QNet, QTrainer


MAX_MEMORY = 100_000
BATCH_SIZE = 1000
LR = 0.01

class Agent:

    OUTPUT_MAP = [[0, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], 
        [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1, 13], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11], [2, 12], [2, 13], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 11], [3, 12], [3, 13], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [4, 12], [4, 13], 
        [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1, 13], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11], [2, 12], [2, 13], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 11], [3, 12], [3, 13], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [4, 12], [4, 13]]

    def __init__(self):
        self.n_games = 0
        self.epsilon = 0
        self.gamma = 0.9
        self.memory = deque(maxlen=MAX_MEMORY)
        self.model = Linear_QNet(43,60,140)
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)

    def get_state(self, game):
        state = [] 

        # add the cards owned
        cards = game.cards
        for card in cards:
            state.append(card[0])
            state.append(card[1])
        for i in range(13-len(cards)):
            state.append(0)
            state.append(0)

        # add the cards played
        #played = game.cards_played
        #for i in range(1,5):
        #    for j in range(1,14):
        #        if [i,j] in played:
        #            state.append(1)
        #        else:
        #            state.append(0)
        # add the previous 3 bids
        past_bids = game.past_bids

        if len(past_bids) >= 3:
            for i in range(3):
                out = past_bids.pop()
                state.append(out[0])
                state.append(out[1])
        else:
            non_bid = 3-len(past_bids)
            for tuple in past_bids:
                state.append(tuple[0])
                state.append(tuple[1])
            for i in range(non_bid): 
                state.append(-1)
                state.append(-1)
        # add the previous 3 cards
        past_cards = game.past_cards

        if len(past_bids) >= 3:
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
        # add other information
        state.append(game.current_phase)
        state.append(game.bid_suit)
        state.append(game.bid_number)
        if game.trump_broken:
            state.append(1)
        else:
            state.append(0)
        if game.bidder_side:
            state.append(1)
        else:
            state.append(0)
        return state
        

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def train_long_memory(self):
        if len(self.memory) > BATCH_SIZE:
            mini_sample = random.sample(self.memory, BATCH_SIZE) # list of tuples
        else:
            mini_sample = self.memory

        states, actions, rewards, next_states, dones = zip(*mini_sample)
        self.trainer.train_step(states, actions, rewards, next_states, dones)

    def train_short_memory(self, state, action, reward, next_state, done):
        self.trainer.train_step(state, action, reward, next_state, done)

    def get_action(self, state, game):
        self.epsilon = 80 - self.n_games
        if random.randint(0, 200) < self.epsilon:
            if game.current_phase == game.BID_PHASE:
                bids = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                        [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]
                for i in range(1,8):
                    for j in range(1,6):
                        if game.last_number < i:
                            bids.append([i,j])
                        elif game.last_number == i and game.last_suit < j:
                            bids.append([i,j])
                move = random.randrange(len(bids))
                return bids[move] 
            elif game.current_phase == game.CALL_PHASE:
                all_cards = []
                for i in range(1,5):
                    for j in range(1,14):
                        if [i,j] not in game.cards:
                            all_cards.append([i,j])
                return all_cards[random.randrange(39)]
            elif game.current_phase == game.PLAY_PHASE:
                cards = game.cards
                move = random.randrange(len(cards))
                return cards[move]
            else:
                return [0,0]
        else:
            state0 = torch.tensor(state, dtype=torch.float)
            prediction = self.model(state0)
            if game.current_phase == game.BID_PHASE:
                move = torch.argmax(prediction[:36]).item()
                return Agent.OUTPUT_MAP[move]
            elif game.current_phase == game.CALL_PHASE:
                move = torch.argmax(prediction[36:88]).item()+36
                return Agent.OUTPUT_MAP[move]
            elif game.current_phase == game.PLAY_PHASE:
                move = torch.argmax(prediction[88:]).item()+88
                return Agent.OUTPUT_MAP[move]
            return [0,0]
