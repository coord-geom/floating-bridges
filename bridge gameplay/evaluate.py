import torch
from agents import BiddingAgent, CallingAgent, PlayingAgent
from game import Bridge

agents      = [BiddingAgent(), CallingAgent(), PlayingAgent()]
bridges     = [Bridge(i) for i in range(4)]

for i in range(3):
    checkpoint = torch.load('model/AprilFoolsModel_Agent'+str(i)+'.pt')
    agents[i].load_state(checkpoint)
    agents[i].epsilon = 0.01

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

printing = False

while game_cnt<100: # game_cnt < NUMGAMES

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

    if printing: print('Bidding Phase:')

    while Bridge.current_phase == Bridge.BID_PHASE:

        bridge  = bridges[next_player]
        id      = next_player
        old_player = next_player

        state   = agents[0].get_state(bridge)

        move = agents[0].get_action(state, bridge)

        if printing: print(next_player,move)
        
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
    
    if printing:
        print('Final bid:')

        print(Bridge.last_number, Bridge.last_suit)
        print()
        
        print('Player cards, starting from bidder:')

        print(bridges[(Bridge.bidder_num)%4].cards)
        print(bridges[(Bridge.bidder_num + 1)%4].cards)
        print(bridges[(Bridge.bidder_num + 2)%4].cards)
        print(bridges[(Bridge.bidder_num + 3)%4].cards)

    # Partner calling phase

    # Run until the bidder makes a valid call
    repeat_cnt = 0
    reward=12345
    while reward != 0:
        bridge  = bridges[next_player]
        old_player = next_player

        state   = agents[1].get_state(bridge)
        
        move = agents[1].get_action(state, bridge)

        reward, done, next_player = bridge.play_step(move)

        if old_player == next_player:
            repeat_cnt += 1


    if printing:
        print('Partner card:')
        print(Bridge.partner_card)

    # For other players to check if they are the partner
    bridges[(Bridge.bidder_num + 1)%4].play_step()
    bridges[(Bridge.bidder_num + 2)%4].play_step()
    bridges[(Bridge.bidder_num + 3)%4].play_step()


    # Execute the card playing phase
    repeat_cnt = 0

    if printing: print('Card Playing Phase:')

    suit = ['Club','Diam','Heart','Spade']
    num  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']

    while Bridge.current_phase == Bridge.PLAY_PHASE:
        bridge  = bridges[next_player]
        id      = next_player
        old_player = next_player

        state   = agents[2].get_state(bridge)
        
        move = agents[2].get_action(state, bridge)

        if printing: 
            if Bridge.bidder_num == next_player:
                print('Bidder',num[move[1]-1],suit[move[0]-1])
            elif Bridge.bidder_lst[next_player] == 1:
                print('Partner',num[move[1]-1],suit[move[0]-1])
            else:
                print('Against',num[move[1]-1],suit[move[0]-1])

        reward, done, next_player = bridge.play_step(move)

        if old_player == next_player:
            repeat_cnt += 1
    
    # Delegate rewards to agents
    bn = Bridge.bidder_num

    game_cnt += 1
    tot[(Bridge.bid_number,Bridge.bid_suit)] += 1
    print('Game',game_cnt)
    #print('Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
    if Bridge.bidder_sets >= 6 + Bridge.bid_number:
        #print('Win Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
        if printing: print(Bridge.bidder_sets,'Bidder win')
        bidder_win_cnt += 1
        bids[(Bridge.bid_number,Bridge.bid_suit)] += 1
    else:
        if printing: print(Bridge.bidder_sets,'Bidder lose')
        #print('Lose Number:',Bridge.bid_number,', Suit:',Bridge.bid_suit)
        pass

    if game_cnt%10 == 0:
        print(game_cnt/1,'% done')

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