from agents import BiddingAgent, CallingAgent, PlayingAgent
from game import Bridge
import time
import torch
import os

NUMGAMES    = 30000
TIMERUN     = 80000
PRINTCYCLE  = 1000

# code has been commented because it doesn't work

agents      = [[BiddingAgent(), CallingAgent(), PlayingAgent()] for _ in range(4)]
bridges     = [Bridge(i) for i in range(4)]

bid_states  = [None,None,None,None]
call_state  = []
play_states = [None,None,None,None]

def check_reshuffle():
    for bridge in bridges:
        if bridge.check_reshuffle():
            return True
    return False

game_cnt = 0

true_start = time.time()

start = time.time()

while (time.time()-true_start < TIMERUN): # game_cnt < NUMGAMES

    next_player = game_cnt % 4
    old_player = next_player
    repeat_cnt = 0

    # If any of the players can reshuffle, start a new game
    if check_reshuffle():
        bridges = [Bridge(i) for i in range(4)]
        bid_states = [None,None,None,None]
        call_state = []
        play_states = [None,None,None,None]
        continue

    # Execute the bidding phase

    while Bridge.current_phase == Bridge.BID_PHASE:

        bridge  = bridges[next_player]
        agent   = agents[next_player]
        id      = next_player
        old_player = next_player

        state   = agent[0].get_state(bridge)

        move = None
        if repeat_cnt == 20:
            repeat_cnt = 0
            move = agent[0].explore(bridge)
        else:
            move = agent[0].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)
        state_n = agent[0].get_state(bridge)

        bid_states[id] = [state, move, reward, state_n, done]

        if old_player == next_player:
            repeat_cnt += 1

        agent[0].train_short_memory(state, move, reward, state_n, done)
        agent[0].remember(state, move, reward, state_n, done)

    # If everyone passes, start a new game
    if Bridge.all_passed:
        bridges = [Bridge(i) for i in range(4)]
        bid_states = [None,None,None,None]
        call_state = []
        play_states = [None,None,None,None]
        continue


    # Partner calling phase

    # Run until the bidder makes a valid call
    repeat_cnt = 0
    reward=0
    while reward != 10:
        bridge  = bridges[next_player]
        agent   = agents[next_player]
        old_player = next_player

        state   = agent[1].get_state(bridge)
        
        move = None
        if repeat_cnt == 20:
            repeat_cnt = 0
            move = agent[1].explore(bridge)
        else:
            move = agent[1].get_action(state, bridge)

        reward, done, next_player = bridge.play_step(move)
        state_n = agent[1].get_state(bridge)

        call_state = [state, move, reward, state_n, done]

        if old_player == next_player:
            repeat_cnt += 1

        agent[1].train_short_memory(state, move, reward, state_n, done)
        agent[1].remember(state, move, reward, state_n, done)

    # For other players to check if they are the partner
    bridges[(Bridge.bidder_num + 1)%4].play_step()
    bridges[(Bridge.bidder_num + 2)%4].play_step()
    bridges[(Bridge.bidder_num + 3)%4].play_step()


    # Execute the card playing phase
    repeat_cnt = 0

    while Bridge.current_phase == Bridge.PLAY_PHASE:
        bridge  = bridges[next_player]
        agent   = agents[next_player]
        id      = next_player
        old_player = next_player

        state   = agent[2].get_state(bridge)
        
        move = None
        if repeat_cnt == 20:
            repeat_cnt = 0
            move = agent[2].explore(bridge)
        else:
            move = agent[2].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)
        state_n = agent[2].get_state(bridge)
        
        play_states[id] = [state, move, reward, state_n, done]

        if old_player == next_player:
            repeat_cnt += 1

        agent[2].train_short_memory(state, move, reward, state_n, done)
        agent[2].remember(state, move, reward, state_n, done)
    
    # Delegate rewards to agents
    bn = Bridge.bidder_num

    for i in range(4):

        id = (bn+i)%4

        bridge  = bridges[id]
        agent   = agents[id]
        reward  = bridge.get_rewards()
        bs      = bid_states[id]
        ps      = play_states[id]
        agent[0].train_short_memory(bs[0], bs[1], reward, bs[3], True)
        agent[0].remember(bs[0], bs[1], reward, bs[3], True)

        if i == 0:
            cs  = call_state
            agent[1].train_short_memory(cs[0], cs[1], reward, cs[3], True)
            agent[1].remember(cs[0], cs[1], reward, cs[3], True)
        
        agent[2].train_short_memory(ps[0], ps[1], ps[2], ps[3], True)
        agent[2].remember(ps[0], ps[1], ps[2], ps[3], True)
    
    game_cnt += 1

    if game_cnt%PRINTCYCLE == 0:
        for agent in agents:
            for a in agent:
                a.train_long_memory()
        print('Game Count:',game_cnt,'Time:',time.time()-start,'seconds\n')
        start = time.time()

    bridges = [Bridge(i) for i in range(4)]
    bid_states = [None,None,None,None]
    call_state = []
    play_states = [None,None,None,None]

mfp = 'model'
if not os.path.exists(mfp):
    os.makedirs(mfp)

for i in range(4):
    for j in range(3):
        m = agents[i][j].model
        t = agents[i][j].trainer
        torch.save({
            'epoch': game_cnt/1000,
            'model_state_dict': m.state_dict(),
            'optimizer_state_dict': t.optimizer.state_dict()
        }, 'model/ozy_does_not_choke_P'+str(i)+'A'+str(j)+'.pth')
