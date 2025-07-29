import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  follower_count: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async () => {
    const { data: participants, error: participantError } = await supabase
      .from('participants')
      .select('id, name, username, avatar_url');

    if (participantError) {
      console.error('Error fetching participants:', participantError.message);
      return;
    }

    const { data: follows, error: followError } = await supabase
      .from('follow')
      .select('user_id'); // this is the one being followed

    if (followError) {
      console.error('Error fetching follows:', followError.message);
      return;
    }

    // Count followers for each user
    const followerMap: Record<string, number> = {};
    for (const row of follows) {
      const followedId = row.user_id;
      followerMap[followedId] = (followerMap[followedId] || 0) + 1;
    }

    // Merge and sort
    const transformed = participants
      .map((p) => ({
        ...p,
        follower_count: followerMap[p.id] || 0,
      }))
      .sort((a, b) => b.follower_count - a.follower_count)
      .slice(0, 60);

    setLeaders(transformed);
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <ol>
        {leaders.map((p, i) => (
          <li key={p.id} className="leaderboard-item">
            <img src={p.avatar_url} alt={p.username} width={40} height={40} />
            <span>
              {i + 1}. {p.name || p.username} ({p.follower_count} followers)
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;
