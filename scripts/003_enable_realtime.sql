-- Enable realtime for games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Create function to update game state
CREATE OR REPLACE FUNCTION update_game_state(
  game_id_param UUID,
  new_board_state JSONB,
  new_current_turn TEXT,
  player_time_1 INTEGER,
  player_time_2 INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE games
  SET 
    board_state = new_board_state,
    current_turn = new_current_turn,
    player1_time = player_time_1,
    player2_time = player_time_2,
    last_move_at = NOW()
  WHERE id = game_id_param;
END;
$$;

-- Create function to end game
CREATE OR REPLACE FUNCTION end_game(
  game_id_param UUID,
  winner_id_param UUID,
  is_draw BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p1_id UUID;
  p2_id UUID;
BEGIN
  -- Get player IDs
  SELECT player1_id, player2_id INTO p1_id, p2_id
  FROM games
  WHERE id = game_id_param;

  -- Update game status
  UPDATE games
  SET 
    status = 'completed',
    winner_id = CASE WHEN is_draw THEN NULL ELSE winner_id_param END,
    completed_at = NOW()
  WHERE id = game_id_param;

  -- Update player stats
  IF is_draw THEN
    -- Both players get a draw
    UPDATE profiles SET draws = draws + 1 WHERE id = p1_id;
    UPDATE profiles SET draws = draws + 1 WHERE id = p2_id;
  ELSE
    -- Winner gets a win, loser gets a loss
    UPDATE profiles SET wins = wins + 1, rating = rating + 25 WHERE id = winner_id_param;
    UPDATE profiles 
    SET losses = losses + 1, rating = GREATEST(rating - 25, 0) 
    WHERE id = (CASE WHEN winner_id_param = p1_id THEN p2_id ELSE p1_id END);
  END IF;
END;
$$;
