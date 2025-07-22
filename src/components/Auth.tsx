import "./Auth.css";
import { supabase } from '../supabaseClient'
import { useEffect} from 'react';

const Auth = () => {
  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });

    if (error) console.error('GitHub login error:', error.message);
  };

  useEffect(() => {
    const storeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { email, user_metadata } = user;
        const { user_name, avatar_url, name } = user_metadata;

        const { error } = await supabase
          .from ('participants')
          .upsert({
            email,
            name,
            username: user_name,
            avatar_url,
            role: 'participant'
          });

          if(error) console.error('Error saving participant data:', error.message);
      }
    };
    storeUser();
  }, []);

  return (
    <div className="box">
      <h2>Sign In with GitHub</h2>
      <button onClick={handleGitHubLogin}>Login with GitHub</button>
    </div>
  );
};

export default Auth;
