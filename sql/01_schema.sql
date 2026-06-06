-- Git-Together Schema DDL

-- Custom Enum Types
CREATE TYPE room_status AS ENUM ('waiting', 'active', 'concluded');
CREATE TYPE sync_status_type AS ENUM ('pending', 'processing', 'synced', 'failed');

-- Profiles Table (Linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  github_username TEXT NOT NULL UNIQUE,
  github_node_id TEXT,
  avatar_url TEXT,
  display_name TEXT,
  provider_token TEXT,
  provider_refresh_tk TEXT,
  github_followers INTEGER DEFAULT 0 NOT NULL,
  github_following INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rooms Table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status room_status DEFAULT 'waiting'::room_status NOT NULL,
  duration_seconds INTEGER DEFAULT 600 NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_code VARCHAR(6) UNIQUE NOT NULL
);

-- Room Participants Table (Active connection state for a room)
CREATE TABLE room_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  baseline_followers INTEGER DEFAULT 0 NOT NULL,
  baseline_following INTEGER DEFAULT 0 NOT NULL,
  current_followers INTEGER DEFAULT 0 NOT NULL,
  current_following INTEGER DEFAULT 0 NOT NULL,
  score NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_id, user_id)
);

-- Follow Ledger Table (Real-time follows queue for GitHub Sync Worker)
CREATE TABLE follow_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sync_status sync_status_type DEFAULT 'pending'::sync_status_type NOT NULL,
  sync_attempts INTEGER DEFAULT 0 NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_id, follower_id, followee_id)
);

-- Indexes for performance on critical paths
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_participants_room ON room_participants(room_id);
CREATE INDEX idx_ledger_room ON follow_ledger(room_id);
CREATE INDEX idx_ledger_sync ON follow_ledger(sync_status) WHERE sync_status = 'pending';
