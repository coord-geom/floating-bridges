import random
from agents2 import BiddingAgent,  PlayingAgent
from game import Bridge

agents      = [BiddingAgent(), PlayingAgent()]
bridges     = [Bridge(i) for i in range(4)]

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

while game_cnt<10000: # game_cnt < NUMGAMES

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

        move = agents[0].explore(bridge)

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

    x = Bridge.last_suit
    b = Bridge.bidder_num
    c = bridges[b].cards
    
    '''
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
    '''

    callable_cards = []
    for i in range(1,5):
        for j in range(1,14):
            if [i,j] not in c: callable_cards.append([i,j])

    reward, done, next_player = bridges[b].play_step(callable_cards[random.randrange(39)])


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

        state   = agents[1].get_state(bridge)
        
        move = agents[1].explore(bridge)

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
    #print('Game',game_cnt)
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

    if game_cnt%1000 == 0:
        print(game_cnt/100,'% done')

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