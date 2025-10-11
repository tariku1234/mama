-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, completed, abandoned
  winner_id UUID REFERENCES public.profiles(id),
  current_turn TEXT NOT NULL DEFAULT 'player1', -- player1 or player2
  board_state JSONB NOT NULL,
  player1_time INTEGER DEFAULT 600, -- 10 minutes in seconds
  player2_time INTEGER DEFAULT 600,
  last_move_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  game_type TEXT NOT NULL DEFAULT 'random', -- random or invite
  invite_code TEXT UNIQUE
);

-- Create game_moves table for move history
CREATE TABLE IF NOT EXISTS public.game_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  move_data JSONB NOT NULL,
  move_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Games policies
CREATE POLICY "games_select_own" ON public.games FOR SELECT 
  USING (auth.uid() = player1_id OR auth.uid() = player2_id OR status = 'waiting');
CREATE POLICY "games_insert_own" ON public.games FOR INSERT 
  WITH CHECK (auth.uid() = player1_id);
CREATE POLICY "games_update_players" ON public.games FOR UPDATE 
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Game moves policies
CREATE POLICY "game_moves_select_game_players" ON public.game_moves FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE games.id = game_moves.game_id 
      AND (games.player1_id = auth.uid() OR games.player2_id = auth.uid())
    )
  );
CREATE POLICY "game_moves_insert_own" ON public.game_moves FOR INSERT 
  WITH CHECK (auth.uid() = player_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_players ON public.games(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_game_id ON public.game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
