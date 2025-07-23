import React from 'react';
import AdminPanel from '../components/Admin.tsx';
import Timer from '../components/Timer.tsx';
import Leaderboard from '../components/Leaderboard.tsx';
import './AdminPage.css'

const AdminPage = () => {
    return (
      <>
        <div className="box">
          <h1>Welcome to admin controls</h1>
          <AdminPanel />
          <Timer />
          <Leaderboard />
        </div>
      </>
    )
};

export default AdminPage;