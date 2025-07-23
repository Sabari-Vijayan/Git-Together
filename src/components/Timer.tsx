import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import "./Timer.css";

interface GameStatus {
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const Timer = () => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGameStatus = async () => {
    const { data, error } = await supabase
      .from('game_status')
      .select('start_time, end_time, is_active')
      .order('end_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching game status:', error.message);
      return;
    }

    const now = new Date();
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);

    setIsActive(data.is_active);

    if (now < start) {
      setRemainingTime((start.getTime() - now.getTime()) / 1000); // time until start
    } else if (now >= start && now < end) {
      setRemainingTime((end.getTime() - now.getTime()) / 1000); // time until end
    } else {
      setRemainingTime(0);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGameStatus();
    const interval = setInterval(fetchGameStatus, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (remainingTime === null || !isActive) return;

    const countdown = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [remainingTime, isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <p>Loading timer...</p>;

  if (!isActive || remainingTime === 0) {
    return <p>⏰ Time's up! Participation closed.</p>;
  }

  return (
    <div className="timer">
      <h3>🕒 Time Remaining</h3>
      <p style={{ fontSize: '2rem' }}>{formatTime(remainingTime || 0)}</p>
    </div>
  );
}

export default Timer;
