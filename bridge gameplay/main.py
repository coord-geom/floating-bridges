from agents import BiddingAgent, CallingAgent, PlayingAgent
from game import Bridge

# code has been commented because it doesn't work

agents = [[BiddingAgent(), CallingAgent(), PlayingAgent()] for _ in range(4)]
bridges = [Bridge(i) for i in range(4)]

bid_states = [None,None,None,None]
call_state = []
play_states = [None,None,None,None]

def check_reshuffle():
    for bridge in bridges:
        if bridge.check_reshuffle():
            return True
    return False

game_cnt = 0

while True:

    next_player = game_cnt % 4

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

        state   = agent[0].get_state(bridge)
        move    = agent[0].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)
        state_n = agent[0].get_state(bridge)

        bid_states[id] = [state, move, reward, state_n, done]
        
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

    reward=0
    while reward != 10:
        bridge  = bridges[next_player]
        agent   = agents[next_player]

        state   = agent[1].get_state(bridge)
        move    = agent[1].get_action(state, bridge)

        reward, done, next_player = bridge.play_step(move)
        state_n = agent[1].get_state(bridge)

        call_state = [state, move, reward, state_n, done]

        agent[1].train_short_memory(state, move, reward, state_n, done)
        agent[1].remember(state, move, reward, state_n, done)

    # For other players to check if they are the partner
    bridges[(Bridge.bidder_num + 1)%4].play_step()
    bridges[(Bridge.bidder_num + 2)%4].play_step()
    bridges[(Bridge.bidder_num + 3)%4].play_step()

    print_cnt = 1

    # Execute the card playing phase
    while Bridge.current_phase == Bridge.PLAY_PHASE:
        bridge  = bridges[next_player]
        agent   = agents[next_player]
        id      = next_player

        state   = agent[2].get_state(bridge)
        move    = agent[2].get_action(state, bridge)
        
        reward, done, next_player = bridge.play_step(move)
        state_n = agent[2].get_state(bridge)
        
        play_states[id] = [state, move, reward, state_n, done]

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
        agent[0].train_long_memory()

        if i == 0:
            cs  = call_state
            agent[1].train_short_memory(cs[0], cs[1], reward, cs[3], True)
            agent[1].remember(cs[0], cs[1], reward, cs[3], True)
            agent[1].train_long_memory()
        
        agent[2].train_short_memory(ps[0], ps[1], ps[2], ps[3], True)
        agent[2].remember(ps[0], ps[1], ps[2], ps[3], True)
        agent[2].train_long_memory()

    game_cnt += 1

    print('Game',game_cnt)
    print('Bid number:',Bridge.bid_number,', Bid suit:',Bridge.bid_suit)
    if Bridge.bidder_sets >= Bridge.bid_number+6:
        print('Bidder won')
    else:
        print('Bidder lost')

    bridges = [Bridge(i) for i in range(4)]
    bid_states = [None,None,None,None]
    call_state = []
    play_states = [None,None,None,None]