
CREATE OR REPLACE FUNCTION find_or_create_game(p_user_id UUID, p_game_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  game_record RECORD;
  new_game_id UUID;
  initial_board JSONB;
BEGIN
  -- Find a waiting game and lock the row
  SELECT *
  INTO game_record
  FROM games
  WHERE
    status = 'waiting' AND
    game_type = p_game_type AND
    player1_id != p_user_id AND
    player2_id IS NULL
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If a waiting game is found, join it
  IF FOUND THEN
    UPDATE games
    SET
      player2_id = p_user_id,
      status = 'active'
    WHERE id = game_record.id
    RETURNING * INTO game_record;

    RETURN jsonb_build_object('game', row_to_json(game_record));
  END IF;

  -- If no waiting game, create a new one
  initial_board := '{"pieces": [], "moves": []}'; -- Placeholder, will be replaced by actual initial board state
  INSERT INTO games (player1_id, game_type, status, board_state)
  VALUES (p_user_id, p_game_type, 'waiting', initial_board)
  RETURNING id INTO new_game_id;

  SELECT *
  INTO game_record
  FROM games
  WHERE id = new_game_id;

  RETURN jsonb_build_object('game', row_to_json(game_record));
END;
$$;
