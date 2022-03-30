import torch
from agents import BiddingAgent, CallingAgent, PlayingAgent
from game import Bridge

agents      = [[BiddingAgent(), CallingAgent(), PlayingAgent()] for _ in range(4)]
bridges     = [Bridge(i) for i in range(4)]

for i in range(4):
    for j in range(3):
        checkpoint = torch.load('model/P'+str(3)+'A'+str(j)+'.pth')
        agents[i][j].load_state(checkpoint)

bid_states  = [None,None,None,None]
call_state  = []
play_states = [None,None,None,None]

def check_reshuffle():
    for bridge in bridges:
        if bridge.check_reshuffle():
            return True
    return False

game_cnt = 0
bidder_win_cnt = 0

while game_cnt<1000: # game_cnt < NUMGAMES

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
        #state_n = agent[0].get_state(bridge)

        #bid_states[id] = [state, move, reward, state_n, done]

        if old_player == next_player:
           repeat_cnt += 1

        #agent[0].train_short_memory(state, move, reward, state_n, done)
        #agent[0].remember(state, move, reward, state_n, done)

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
        #state_n = agent[1].get_state(bridge)

        #call_state = [state, move, reward, state_n, done]

        if old_player == next_player:
            repeat_cnt += 1

        #agent[1].train_short_memory(state, move, reward, state_n, done)
        #agent[1].remember(state, move, reward, state_n, done)

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
        #state_n = agent[2].get_state(bridge)
        
        #play_states[id] = [state, move, reward, state_n, done]

        if old_player == next_player:
            repeat_cnt += 1

        #agent[2].train_short_memory(state, move, reward, state_n, done)
        #agent[2].remember(state, move, reward, state_n, done)
    
    # Delegate rewards to agents
    bn = Bridge.bidder_num

    game_cnt += 1

    #print('Game',game_cnt)
    #print('Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
    if Bridge.bidder_sets >= 6 + Bridge.bid_number:
        print('Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
        bidder_win_cnt += 1
    else:
    #    print('Bidder lose')
        pass

    bridges = [Bridge(i) for i in range(4)]
    bid_states = [None,None,None,None]
    call_state = []
    play_states = [None,None,None,None]

print('bidder win rate:',bidder_win_cnt/game_cnt)