import torch
from agents2 import *
from game import Bridge
import json
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

agents      = [BiddingAgent(), PlayingAgent()]
bridges     = [Bridge(i) for i in range(4)]

bids = {}
tot = {}
games = []

for i in range(2):
    checkpoint = torch.load('model/ExtendedLastChance_Agent'+str(i)+'.pth')
    agents[i].load_state(checkpoint)
    agents[i].epsilon = Agent().eps_min
    
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
total_bid_sets = 0
total_against_sets = 0
illegal_cnt = 0

printing = False

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
           illegal_cnt += 1

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
    
    
    if printing: print('Partner card:')
    if x < 5:
        if [x,13] not in c:
            if printing: print([x,13])
            reward, done, next_player = bridges[b].play_step([x,13])
        elif [x,12] not in c: 
            if printing: print([x,12])
            reward, done, next_player = bridges[b].play_step([x,12])
        elif [x,11] not in c: 
            if printing: print([x,11])
            reward, done, next_player = bridges[b].play_step([x,11])
        else:
            for card in ([4,13],[3,13],[2,13],[1,13],[4,12],[3,12],[2,12],[1,12],[4,11],[3,11],[2,11],[1,11]):
                if card not in c: 
                    if printing: print(card)
                    reward, done, next_player = bridges[b].play_step(card)
                    break
    else:
        for card in ([4,13],[3,13],[2,13],[1,13],[4,12],[3,12],[2,12],[1,12],[4,11],[3,11],[2,11],[1,11]):
            if card not in c: 
                if printing: print(card)
                reward, done, next_player = bridges[b].play_step(card)
                break
    
    if printing: print()

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
            illegal_cnt += 1
    
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
    total_bid_sets += Bridge.bidder_sets
    total_against_sets += 13 - Bridge.bidder_sets
    game_data = bridge.write_to_json()
    games.append(game_data)

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
bids_list_keys = []
bids_list = []
bids_list_with_suits = []

for i in range(1,8):
    suit_bids = []
    for j in range(1,6):
        bids_list_keys.append("(" + str(i) + "," + str(j) + ")")
        if tot[(i,j)] != 0:
            prop[(i,j)] = bids[(i,j)]/tot[(i,j)]
            bids_list.append(prop[(i,j)])
            suit_bids.append(prop[(i,j)])
        else:
            prop[(i,j)] = 'NIL'
            bids_list.append(0)
            suit_bids.append(0)
    bids_list_with_suits.append(suit_bids)
bids_df = pd.DataFrame(bids_list_with_suits, columns = ["club","diamond","heart","spade","no_trump"])
bids_df = bids_df.rename(index={0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7})

plt.figure()
x = ["bidders","non-bidders"]
win_rate_y = [bidder_win_cnt * 100 /game_cnt, (game_cnt - bidder_win_cnt) * 100 /game_cnt]
sns.barplot(x, win_rate_y, color='r')
plt.title("Win rate")
plt.show()

plt.figure()
total_sets = total_bid_sets + total_against_sets
sets_y = [total_bid_sets * 100 / total_sets, total_against_sets * 100 / total_sets]
sns.barplot(x,sets_y, color='b')
plt.title("Percentage of sets won")
plt.show()

plt.figure()
sns.lineplot(bids_list_keys, bids_list).set(xticklabels=[])
plt.xlabel("bids")
plt.ylabel("percentage")
plt.title("Percentage of each bid")
plt.show()

print(bids_df)

bids_df = 100 * bids_df
plt.figure()
sns.barplot(bids_df.mean(axis=1).index, bids_df.mean(axis=1).values)
plt.title("Percentage of each bid number")
plt.show()

plt.figure()
sns.barplot(bids_df.mean(axis=0).index, bids_df.mean(axis=0).values)
plt.title("Percentage of each bid suit")
plt.show()

print("Percentage of illegal moves: " + str(100 * illegal_cnt / (illegal_cnt + 130000)) + "%")
# print(prop)

games_dict = {'games': games}
with open('game_data.json', 'w', encoding='utf-8') as f:
    json.dump(games_dict, f, ensure_ascii=False, indent=4)


# bids_list_with_suits = []
# for i in range(1,8):
#     suit_bids = []
#     for j in range(1,6):
#         suit_bids.append(prop[(i,j)])
#     bids_list_with_suits.append(suit_bids)
# bids_df = pd.DataFrame(bids_list_with_suits, columns = [1,2,3,4,5,6,7,8])
# bids_df.rename(index={0: "club", 1: "diamond", 2: "heart", 3: "spade"})
