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
    const { data, error } = await supabase
      .from('participants')
      .select(`
        id,
        name,
        username,
        avatar_url,
        follow_follows_id_fkey:follow_follows_id(count)
      `);

    if (error) {
      console.error('Error fetching leaderboard:', error.message);
      return;
    }

    const transformed = data
      .map((p: any) => ({
        ...p,
        follower_count: p.follow_follows_id_fkey?.count || 0,
      }))
      .sort((a, b) => b.follower_count - a.follower_count)
      .slice(0, 10);

    setLeaders(transformed);
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <ol>
        {leaders.map((p, i) => (
          <li key={p.id} className="leaderboard-item">
            <img src={p.avatar_url} alt={p.username} width={40} height={40} />
            <span>{i + 1}. {p.name || p.username} ({p.follower_count} followers)</span>
          </li>
        ))}
      </ol>
    </div>
  )
};

export default Leaderboard;
