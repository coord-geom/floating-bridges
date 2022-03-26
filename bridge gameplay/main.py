from agent import Agent
from game import Bridge
import time

agents = [Agent() for i in range(4)]
games = [Bridge(i) for i in range(4)]

i=0

while True:

    old_player = 0
    next_player = 0
    play_count = 0

    while not Bridge.stop_game:
        old_player = next_player
        agent = agents[next_player]
        game = games[next_player]
        state_old = agent.get_state(game)
        final_move = agent.get_action(state_old, game)
        reward, done, next_player = game.play_step(final_move)
        state_new = agent.get_state(game)
        agent.train_short_memory(state_old,final_move,reward,state_new,done)
        agent.remember(state_old,final_move,reward,state_new,done)
        if old_player == next_player:
            play_count += 1
            if play_count == 1000: # the guy is going nowhere
                Bridge.next_starter = next_player
                Bridge.game_thrower = next_player
                Bridge.current_phase = Bridge.END_PHASE
        else:
            play_count = 0
        
    print('Game',i+1)
    if Bridge.all_passed:
        print('Everyone passed')
    elif Bridge.game_thrower is not None:
        print('Runtime too long, game ended early')
    else:
        print('Bid number:',Bridge.bid_number,', Bid suit:',Bridge.bid_suit)
        if Bridge.bidder_sets >= Bridge.bid_number+6:
            print('Bidder won')
        else:
            print('Bidder lost')
    print()

    for j in range(4):
        games[j].reset_all()
        agents[j].n_games += 1
        agents[j].train_long_memory()
    
    i+=1