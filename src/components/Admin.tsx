import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminPanel = () => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [statusId, setStatusId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameStatus = async () => {
      const { data, error } = await supabase
        .from('game_status')
        .select('*')
        .order('id', { ascending: false }) // get latest
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching game status:', error.message);
        return;
      }

      setStartTime(data.start_time);
      setEndTime(data.end_time);
      setIsActive(data.is_active);
      setStatusId(data.id);
    };

    fetchGameStatus();
  }, []);

 const updateGameStatus = async () => {
  if (statusId) {
    // If a row exists, update it
    const { error } = await supabase
      .from('game_status')
      .update({
        start_time: startTime,
        end_time: endTime,
        is_active: isActive,
      })
      .eq('id', statusId);

    if (error) {
      console.error('Error updating game status:', error.message);
    } else {
      console.log('Game status updated successfully!');
    }
  } else {
    // If no row exists, insert a new one
    const { data, error } = await supabase
      .from('game_status')
      .insert([
        {
          start_time: startTime,
          end_time: endTime,
          is_active: isActive,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting game status:', error.message);
    } else {
      setStatusId(data.id);
      console.log('Game status inserted successfully!');
    }
  }
};

  return (
    <div className="admin-panel">
      <h2>🛠️ Admin Panel</h2>
      <label>Start Time:</label>
      <input
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />

      <label>End Time:</label>
      <input
        type="datetime-local"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />

      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Is Active
      </label>

      <button onClick={updateGameStatus}>Save Changes</button>
    </div>
  );
}

export default AdminPanel;
