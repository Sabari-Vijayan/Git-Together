import React, { useState } from "react";
import { supabase } from '../supabaseClient'
import "./HomePage.css";

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

        <form className="form" onSubmit={handleSubmit}>
          <h2>What is your name?</h2>
          <input
            type="text"
            placeholder="YOUR NAME"
            className="box"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <h2>Provide your email ID?</h2>
          <input
            type="email"
            placeholder="yourname@gmail.com"
            className="box"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" className="submit-btn" disabled={Loading}>
            {Loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </>
  );
};

export default HomePage;