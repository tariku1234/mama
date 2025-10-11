-- Drop the old restrictive policy
DROP POLICY IF EXISTS "games_update_players" ON public.games;

-- Create new policy that allows joining open games
CREATE POLICY "games_update_players" ON public.games FOR UPDATE 
  USING (
    auth.uid() = player1_id 
    OR auth.uid() = player2_id 
    OR (player2_id IS NULL AND status = 'waiting')
  );
