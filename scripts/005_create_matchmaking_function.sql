CREATE OR REPLACE FUNCTION find_or_create_game(p_user_id UUID, p_game_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  game_record RECORD;
  new_game_id UUID;
  initial_board JSONB;
  pieces JSONB;
  piece_id INT;
BEGIN
  -- Attempt to find and join a waiting game atomically.
  UPDATE games
  SET
    player2_id = p_user_id,
    status = 'active'
  WHERE id = (
    SELECT id
    FROM games
    WHERE
      status = 'waiting' AND
      game_type = p_game_type AND
      player1_id != p_user_id AND
      player2_id IS NULL
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO game_record;

  -- If a game was updated and joined, return it.
  IF FOUND THEN
    RETURN jsonb_build_object('game', row_to_json(game_record));
  END IF;

  -- If no waiting game was found, create a new one.
  -- This is now safer because the previous UPDATE was atomic.
  
  -- Generate initial pieces
  pieces := '[]'::jsonb;
  piece_id := 1;
  
  -- Dark pieces
  FOR r IN 0..2 LOOP
    FOR c IN 0..7 LOOP
      IF (r + c) % 2 = 1 THEN
        pieces := pieces || jsonb_build_object(
          'id', piece_id::text,
          'type', 'regular',
          'color', 'dark',
          'position', jsonb_build_object('row', r, 'col', c)
        );
        piece_id := piece_id + 1;
      END IF;
    END LOOP;
  END LOOP;

  -- Light pieces
  FOR r IN 5..7 LOOP
    FOR c IN 0..7 LOOP
      IF (r + c) % 2 = 1 THEN
        pieces := pieces || jsonb_build_object(
          'id', piece_id::text,
          'type', 'regular',
          'color', 'light',
          'position', jsonb_build_object('row', r, 'col', c)
        );
        piece_id := piece_id + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  initial_board := jsonb_build_object(
    'pieces', pieces,
    'moves', '[]'::jsonb,
    'currentTurn', 'light'
  );

  INSERT INTO games (player1_id, game_type, status, board_state, current_turn)
  VALUES (p_user_id, p_game_type, 'waiting', initial_board, 'player1')
  RETURNING * INTO game_record;

  RETURN jsonb_build_object('game', row_to_json(game_record));
END;
$$;