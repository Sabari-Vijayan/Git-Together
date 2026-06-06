-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ledger ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Allow authenticated to read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to insert their own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Rooms Policies
CREATE POLICY "Allow authenticated to read rooms" ON rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to create rooms" ON rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Allow organizer to update their own rooms" ON rooms
  FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);

CREATE POLICY "Allow organizer to delete their own rooms" ON rooms
  FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

-- 3. Room Participants Policies
CREATE OR REPLACE FUNCTION is_member_of_room(r_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = r_id AND user_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Allow room participants to view others" ON room_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to join waiting rooms" ON room_participants
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM rooms r
      WHERE r.id = room_id AND r.status = 'waiting'::room_status
    )
  );

CREATE POLICY "Allow users to leave rooms" ON room_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Follow Ledger Policies
CREATE POLICY "Allow room participants to view ledger rows" ON follow_ledger
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow players to log follows during active games" ON follow_ledger
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = follower_id AND
    EXISTS (
      SELECT 1 FROM rooms r
      WHERE r.id = room_id AND r.status = 'active'::room_status AND (r.ends_at IS NULL OR r.ends_at > now())
    )
  );
