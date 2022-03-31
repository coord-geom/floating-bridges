import torch
from agents import BiddingAgent, CallingAgent, PlayingAgent
from game import Bridge

agents      = [[BiddingAgent(), CallingAgent(), PlayingAgent()] for _ in range(4)]
bridges     = [Bridge(i) for i in range(4)]

for i in range(4):
    for j in range(3):
        checkpoint = torch.load('model/ozy_does_not_choke_P'+str(i)+'A'+str(j)+'.pth')
        agents[i][j].load_state(checkpoint)

bids = {}
tot = {}

for i in range(1,8):
    for j in range(1,6):
        bids[(i,j)] = 0
        tot[(i,j)] = 0


def check_reshuffle():
    for bridge in bridges:
        if bridge.check_reshuffle():
            return True
    return False

game_cnt = 0
bidder_win_cnt = 0

while game_cnt<100000: # game_cnt < NUMGAMES

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
        if repeat_cnt == 1:
            repeat_cnt = 0
            move = agent[0].explore(bridge)
        else:
            move = agent[0].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)

        if old_player == next_player:
           repeat_cnt += 1

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
        if repeat_cnt == 1:
            repeat_cnt = 0
            move = agent[1].explore(bridge)
        else:
            move = agent[1].get_action(state, bridge)

        reward, done, next_player = bridge.play_step(move)

        if old_player == next_player:
            repeat_cnt += 1


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
        if repeat_cnt == 1:
            repeat_cnt = 0
            move = agent[2].explore(bridge)
        else:
            move = agent[2].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)

        if old_player == next_player:
            repeat_cnt += 1
    
    # Delegate rewards to agents
    bn = Bridge.bidder_num

    game_cnt += 1
    tot[(Bridge.bid_number,Bridge.bid_suit)] += 1
    #print('Game',game_cnt)
    #print('Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
    if Bridge.bidder_sets >= 6 + Bridge.bid_number:
        #print('Win Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
        bidder_win_cnt += 1
        bids[(Bridge.bid_number,Bridge.bid_suit)] += 1
    else:
    #    print('Bidder lose')
        #print('Lose Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
        pass

    bridges = [Bridge(i) for i in range(4)]
    bid_states = [None,None,None,None]
    call_state = []
    play_states = [None,None,None,None]

print('bidder win rate:',bidder_win_cnt/game_cnt)
print(bids)
print(tot)


prop = {}

for i in range(1,8):
    for j in range(1,6):
        if tot[(i,j)] != 0:
            prop[(i,j)] = bids[(i,j)]/tot[(i,j)]
        else:
            prop[(i,j)] = 'NIL'

print(prop)