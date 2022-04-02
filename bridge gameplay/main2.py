from agents2 import BiddingAgent, PlayingAgent
from game import Bridge
import time
import torch
import os

NUMGAMES    = 30000
TIMERUN     = 80000
PRINTCYCLE  = 1000

agents      = [BiddingAgent(), PlayingAgent()]
bridges     = [Bridge(i) for i in range(4)]

bid_states  = [None,None,None,None]
play_states = [None,None,None,None]

def check_reshuffle():
    for bridge in bridges:
        if bridge.check_reshuffle():
            return True
    return False

game_cnt = 0

true_start = time.time()

start = time.time()

repeat_cnt = 0

while (time.time()-true_start < TIMERUN): # game_cnt < NUMGAMES

    next_player = 0

    # If any of the players can reshuffle, start a new game
    if check_reshuffle():
        bridges = [Bridge(i) for i in range(4)]
        bid_states = [None,None,None,None]
        play_states = [None,None,None,None]
        continue

    # Execute the bidding phase

    while Bridge.current_phase == Bridge.BID_PHASE:

        bridge  = bridges[next_player]
        id      = next_player
        old_player = next_player

        state   = agents[0].get_state(bridge)

        move = None
        if repeat_cnt == 5:
            repeat_cnt = 0
            move = agents[0].explore(bridge)
        else:
            move = agents[0].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)
        state_n = agents[0].get_state(bridge)

        if old_player == next_player:
            repeat_cnt += 1
        else:
            repeat_cnt = 0

        bid_states[id] = [state, move, reward, state_n, done]

        agents[0].train_short_memory(state, move, reward, state_n, done)
        agents[0].remember(state, move, reward, state_n, done)

    # If everyone passes, start a new game
    if Bridge.all_passed:
        bridges = [Bridge(i) for i in range(4)]
        bid_states = [None,None,None,None]
        play_states = [None,None,None,None]
        continue


    # Partner calling phase

    x = Bridge.last_suit
    b = Bridge.bidder_num
    c = bridges[b].cards
    

    if x < 5:
        if [x,13] not in c: reward, done, next_player = bridges[b].play_step([x,13])
        elif [x,12] not in c: reward, done, next_player = bridges[b].play_step([x,12])
        elif [x,11] not in c: reward, done, next_player = bridges[b].play_step([x,11])
        else:
            for card in ([4,13],[3,13],[2,13],[1,13],[4,12],[3,12],[2,12],[1,12],[4,11],[3,11],[2,11],[1,11]):
                if card not in c: reward, done, next_player = bridges[b].play_step(card)
    else:
        for card in ([4,13],[3,13],[2,13],[1,13],[4,12],[3,12],[2,12],[1,12],[4,11],[3,11],[2,11],[1,11]):
            if card not in c: reward, done, next_player = bridges[b].play_step(card)

    # For other players to check if they are the partner
    bridges[(Bridge.bidder_num + 1)%4].play_step()
    bridges[(Bridge.bidder_num + 2)%4].play_step()
    bridges[(Bridge.bidder_num + 3)%4].play_step()


    # Execute the card playing phase
    repeat_cnt = 0
    while Bridge.current_phase == Bridge.PLAY_PHASE:
        bridge  = bridges[next_player]
        id      = next_player
        old_player = next_player

        state   = agents[1].get_state(bridge)
        
        move = None
        if repeat_cnt == 5:
            repeat_cnt = 0
            move = agents[1].explore(bridge)
        else:
            move = agents[1].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)
        state_n = agents[1].get_state(bridge)

        if old_player == next_player:
            repeat_cnt += 1
        else:
            repeat_cnt = 0
        
        play_states[id] = [state, move, reward, state_n, done]

        if state != state_n and len(Bridge.past_cards) == 0: # if the round ends, reward the winner
            ps = play_states[Bridge.next_starter]
            play_states[Bridge.next_starter][2] = 10
            ps[2] = 10
            agents[1].train_short_memory(ps[0], ps[1], ps[2], ps[3], ps[4])
            agents[1].remember(ps[0], ps[1], ps[2], ps[3], ps[4])
        else:
            agents[1].train_short_memory(state, move, reward, state_n, done)
            agents[1].remember(state, move, reward, state_n, done)
    
    # Delegate rewards to agents
    bn = Bridge.bidder_num

    for i in range(4):

        bridge  = bridges[i]
        reward  = bridge.get_rewards()
        bs      = bid_states[i]
        ps      = play_states[i]
        
        agents[0].train_short_memory(bs[0], bs[1], reward, bs[3], True)
        agents[0].remember(bs[0], bs[1], reward, bs[3], True)
        
        agents[1].train_short_memory(ps[0], ps[1], ps[2], ps[3], True)
        agents[1].remember(ps[0], ps[1], ps[2], ps[3], True)
    
    game_cnt += 1

    #print(game_cnt)

    if game_cnt%PRINTCYCLE == 0:
        for agent in agents:
            agent.train_long_memory()
        print('Game Count:',game_cnt,'Time:',time.time()-start,'seconds\n')
        start = time.time()

    bridges = [Bridge(i) for i in range(4)]
    bid_states = [None,None,None,None]
    play_states = [None,None,None,None]

mfp = 'model'
if not os.path.exists(mfp):
    os.makedirs(mfp)

for i in range(2):
    m = agents[i].model
    t = agents[i].trainer
    torch.save({
        'model_state_dict': m.state_dict(),
        'optimizer_state_dict': t.optimizer.state_dict()
    }, 'model/LastChance_Agent'+str(i)+'.pth')
