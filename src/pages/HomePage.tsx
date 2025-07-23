import React, { useState } from "react";
import { supabase } from '../supabaseClient.js'
import "./HomePage.css";
import Timer from '../components/Timer.tsx';
import Leaderboard from "../components/Leaderboard.tsx";

const HomePage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [Loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email}])

      setLoading(false);

      if(error) {
        console.log('Error inserting data: ' + error.message);
      } else {
        console.log('Submitted successfully!');
        setName('');
        setEmail('');
      }
  };

  return (
    <>
      <nav className="title">
        <div className="logo-container">
          <img src="./github_logo.png" alt="github logo" />
        </div>
        <h1>Git-together</h1>
      </nav>

      <div className="hero">
        <div>
          <h1>
            Hello! Make sure to use your real name and the same email that you
            have linked with your GitHub account
          </h1>
        </div>
        <div>

            <Timer />
            <Leaderboard />
        
        </div>

      </div>
    </>
  );
};

export default HomePage;