-- Git-Together Triggers

-- 1. Trigger for score calculation and counts on follow_ledger insert
CREATE OR REPLACE FUNCTION handle_follow_ledger_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment following count of the follower in this room
  UPDATE room_participants
  SET current_following = current_following + 1
  WHERE user_id = NEW.follower_id AND room_id = NEW.room_id;

  -- Increment followers count of the followee in this room
  UPDATE room_participants
  SET current_followers = current_followers + 1
  WHERE user_id = NEW.followee_id AND room_id = NEW.room_id;

  -- Recalculate scores for BOTH participants in the room
  -- Score = Δ Followers - 0.5 * Δ Following
  UPDATE room_participants
  SET score = (current_followers - baseline_followers) - 0.5 * (current_following - baseline_following)
  WHERE (user_id = NEW.follower_id OR user_id = NEW.followee_id) AND room_id = NEW.room_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follow_ledger_insert
AFTER INSERT ON follow_ledger
FOR EACH ROW
EXECUTE FUNCTION handle_follow_ledger_insert();


-- 2. Trigger for snapshotting baseline followers/following when room status transitions to 'active'
CREATE OR REPLACE FUNCTION handle_room_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Transitioning from 'waiting' to 'active' snapshots baseline stats
  IF NEW.status = 'active' AND OLD.status = 'waiting' THEN
    -- Update baseline and current stats using profile numbers
    UPDATE room_participants rp
    SET baseline_followers = p.github_followers,
        baseline_following = p.github_following,
        current_followers = p.github_followers,
        current_following = p.github_following,
        score = 0.00
    FROM profiles p
    WHERE rp.user_id = p.id AND rp.room_id = NEW.id;
    
    -- Set start/end timestamps
    NEW.started_at = now();
    NEW.ends_at = now() + (NEW.duration_seconds * INTERVAL '1 second');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_room_status_change
BEFORE UPDATE OF status ON rooms
FOR EACH ROW
EXECUTE FUNCTION handle_room_status_change();


-- 3. Database RPC functions for github-sync-worker Edge Function

CREATE OR REPLACE FUNCTION claim_pending_ledger_rows(batch_size INTEGER)
RETURNS TABLE (id UUID, follower_id UUID, followee_id UUID) AS $$
BEGIN
  RETURN QUERY
  UPDATE follow_ledger
  SET sync_status = 'processing'::sync_status_type
  WHERE follow_ledger.id IN (
    SELECT fl.id
    FROM follow_ledger fl
    WHERE fl.sync_status = 'pending'::sync_status_type AND fl.sync_attempts < 3
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING follow_ledger.id, follow_ledger.follower_id, follow_ledger.followee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION increment_sync_attempts(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE follow_ledger
  SET sync_attempts = sync_attempts + 1,
      sync_status = CASE WHEN sync_attempts + 1 >= 3 THEN 'failed'::sync_status_type ELSE 'pending'::sync_status_type END
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Triggers to automatically conclude older waiting/active rooms for an organizer
CREATE OR REPLACE FUNCTION conclude_previous_organizer_rooms()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms
  SET status = 'concluded'::room_status
  WHERE organizer_id = NEW.organizer_id
    AND status != 'concluded'::room_status
    AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_conclude_previous_rooms ON rooms;
CREATE TRIGGER trg_conclude_previous_rooms
BEFORE INSERT ON rooms
FOR EACH ROW
EXECUTE FUNCTION conclude_previous_organizer_rooms();


CREATE OR REPLACE FUNCTION conclude_organizer_rooms_on_join()
RETURNS TRIGGER AS $$
BEGIN
  -- If user joins any room, conclude any rooms they are currently organizing elsewhere
  UPDATE rooms
  SET status = 'concluded'::room_status
  WHERE organizer_id = NEW.user_id
    AND status != 'concluded'::room_status
    AND id != NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_conclude_rooms_on_participant_join ON room_participants;
CREATE TRIGGER trg_conclude_rooms_on_participant_join
BEFORE INSERT ON room_participants
FOR EACH ROW
EXECUTE FUNCTION conclude_organizer_rooms_on_join();
