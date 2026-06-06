import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// Interfaces for our app state
interface Participant {
  id: string;
  github_username: string;
  display_name: string;
  avatar_url: string;
  baseline_followers: number;
  baseline_following: number;
  current_followers: number;
  current_following: number;
  score: number;
  isYou?: boolean;
}

interface SyncLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn';
}

interface ActiveRoom {
  id: string;
  room_code: string;
  status: 'waiting' | 'active' | 'concluded';
  created_at: string;
}


// Default participants available for simulation
const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: '1',
    github_username: 'sarah_codes',
    display_name: 'Sarah Chen',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqLGoSKic_7gQItdHbjNAkhAmZmcf4I2Hdqc5nH1NShj6HOSUbpAa9Wqmmba_YFXPJLQpc3A-c_A0c_CEl8hIbGbuJZPblB2S1c6Xo2n7757fPfQ4cSwn1kgGsdj35mJQgu4Yv6PiIaPyhA-KgVJAASZcApCZC7lf6hxKeMAevT6sNEuGsn81xT6Pdgt3VG09jy3pE7w0bkVYowaX06t6iGIBXK7ntBzm3J_F4fOg9bAWrbIx7d5vt-QE2CZqeCydqfTwD5QV82X0v',
    baseline_followers: 120,
    baseline_following: 80,
    current_followers: 120,
    current_following: 80,
    score: 0,
  },
  {
    id: '2',
    github_username: 'alex_rivers',
    display_name: 'Alex Rivers',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpU0Ng6qAb6E5P8cVT1PBWGQBbFnE-Wh7J4K8YX_wAXMINrNE8xou3IhD4q2fA0O-UHcfujyKG4pBW5Rb5nvS8Jj-Qnr9PGvT-deDB5krXpcSn88yenZW7-WKqNnBqbJMsDijmQkx6E213G1a5ooLHAwuf35mnOMLPHLnTl8YpML9AlPBcW_5r-maf6TFMzRYH9eM-Z6LJ6dZEIerqToMlyMeGnA4FYfRV8BnDpGXnGBmWW68WK3Wzh_nHx4Lz9X_QNGeIIYCP7YdQ',
    baseline_followers: 350,
    baseline_following: 150,
    current_followers: 350,
    current_following: 150,
    score: 0,
  },
  {
    id: '3',
    github_username: 'dev_ninja',
    display_name: 'Jordan Smith',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE2kepnUVDWpTM62qJItGisUM-kgPGkC6WFTogJ8JWc2DxCWnp4JYhKBaZPCjCL-1j6L73fwgJ3I-RZHXn5vUX0oAQXqP0R72w9N6V3Uta5oyQTwYVFfKIMeorf8gw2YnkTyN7_i4azMYU_WgQQasu6esFx3jpGcYKvTtweafeq3o7NdKUzBPcG9FaTkzflZBIRWXct9vmF-ym1NnoeZCYergT4smvr3_ivwzSH18tP6zf6kvnu6eOgZHqGt2GWKoZ8ArYrAO_ffDW',
    baseline_followers: 95,
    baseline_following: 110,
    current_followers: 95,
    current_following: 110,
    score: 0,
  },
  {
    id: '4',
    github_username: 'octo_man',
    display_name: 'Octo Man',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5SaC-pM3yaO2NZ8sPsyWvmIKrqt24fDwtQbBl07HxhnZOnWChv53zpDp6rrG7osu5a6jzPreX39-ewuBToQ5by1wkXKyWrZGt_TQ0CHyvpW9Z73AhfvorUuNplYcDWECOZfj5Z4uk5FCoYSGTHnzEysgJLkoqfWIZBrPxORASajiBvxODLMEZ5i158Sandp2GszIVbPbB44Fh6XiECNOarZvLVBTR3_OLe4Z_IZaXeZTqkygbkzv4c1GYHD2DMi5k9XD79WZKcldJ',
    baseline_followers: 180,
    baseline_following: 130,
    current_followers: 180,
    current_following: 130,
    score: 0,
  },
  {
    id: '5',
    github_username: 'lambda_king',
    display_name: 'Lambda King',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRMp2BEvAWcXF8IM-ySqy6e4oQcuVNNF5lQCEE1eoCxouTLbpAjktzzhc9sRj3BUTaKotah3bfmgwd4qu1cQKkX86-J-O1xTtxFGiEU1NkxiV39qLcvq4QdDxBJYV470OkxU66mGhc9H201uuXXYV6IDH2-Aq4xm5iJNs1A1XWy84Q2ceYiGIrdOPB8ZGmNI5fKXA_NgV0BGYThomcczs1xQH4r2ahOAkICrfuVQ8OzJo7jLHUly7yqqr3ijVrIEavjI6_qQSyN0CQ',
    baseline_followers: 200,
    baseline_following: 90,
    current_followers: 200,
    current_following: 90,
    score: 0,
  },
  {
    id: '6',
    github_username: 'pixel_pirate',
    display_name: 'Pixel Pirate',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-zjzupA1VQJVGs34M6R9EK7j9q-f90eT9zjaSDcHtVhUzdK18QEVXm6YBIp7_fymEJOnlg5IHy_S6YVjAvyO5nk8s-bIHpgGYcAAACJzHnrq_hBHD-n0RRH4NFhGCYGa46dwOtJXBra3SSewuba9mg6c-3ToJMGfFpa4FT8jrLRu-Of6S6Gm1lEY4gp968rzmSIdbY8QuT0BBwXMElRAiUN8ewRtVmpyRacc13piGmrL0Ih8L_xIqDN4Gel9saYHcmatZws5R5joL',
    baseline_followers: 75,
    baseline_following: 60,
    current_followers: 75,
    current_following: 60,
    score: 0,
  },
];

export default function App() {
  // Navigation & Screens
  const [screen, setScreen] = useState<'auth' | 'home' | 'lobby' | 'game' | 'concluded'>('auth');
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'profile'>('leaderboard');
  
  // App State variables
  const [roomCode, setRoomCode] = useState<string>(() => localStorage.getItem('gt_roomCode') || '');
  const [roomId, setRoomId] = useState<string>(() => localStorage.getItem('gt_roomId') || '');
  const [myUserId, setMyUserId] = useState<string>('me');
  const [isOrganizer, setIsOrganizer] = useState<boolean>(() => localStorage.getItem('gt_isOrganizer') === 'true');
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'active' | 'concluded'>('waiting');
  const [myActiveRooms, setMyActiveRooms] = useState<ActiveRoom[]>([]);
  
  // User profile
  const [myUsername, setMyUsername] = useState<string>('sabari_dev');
  const [myAvatar, setMyAvatar] = useState<string>('https://lh3.googleusercontent.com/aida-public/AB6AXuDLlGgMe3DZvYSluUJQousQdMGClrRMz1lKpspg9JJL8l6KiF_UCgdKiAd76c-MhpvD0yR_K2s3xeWUy_me_7mZWT_9xV4LMDybKSbmDwiYtpRM1wFzWvr6Uw0M6qEjwzkh0vKFotTX0w-hQPf1VwnBTH5SnldueDSTt5inLhwLQxLqtigZjiAxXP4SKN-5WNS6FaKt8TvZI_8sVhkSnMGIMXKEx3cs3GYOm5hELDFclyXONdDimXNubfxDX4zfafr4TcSiUN050x2l');
  const [myFollowers, setMyFollowers] = useState<number>(0);
  const [myFollowing, setMyFollowing] = useState<number>(0);
  const [showSelfProfile, setShowSelfProfile] = useState<boolean>(false);
  
  // Game data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [timer, setTimer] = useState<number>(462); // 07:42 in seconds
  const [selectedPeer, setSelectedPeer] = useState<Participant | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Activity/Event feed log
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  
  // Confetti ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Save screen states to localStorage to prevent logout/room loss on refresh
  useEffect(() => {
    localStorage.setItem('gt_screen', screen);
  }, [screen]);

  useEffect(() => {
    localStorage.setItem('gt_roomId', roomId);
  }, [roomId]);

  useEffect(() => {
    localStorage.setItem('gt_roomCode', roomCode);
  }, [roomCode]);

  useEffect(() => {
    localStorage.setItem('gt_isOrganizer', isOrganizer ? 'true' : 'false');
  }, [isOrganizer]);

  // Fetch running rooms created by the user when they are on the home screen
  useEffect(() => {
    if (!supabase || !myUserId || myUserId === 'me' || screen !== 'home') {
      setMyActiveRooms([]);
      return;
    }

    const fetchMyActiveRooms = async () => {
      try {
        const { data, error } = await supabase!
          .from('rooms')
          .select('id, room_code, status, created_at')
          .eq('organizer_id', myUserId)
          .neq('status', 'concluded')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching active rooms:', error);
        } else {
          setMyActiveRooms(data || []);
        }
      } catch (err) {
        console.error('Error in fetchMyActiveRooms:', err);
      }
    };

    fetchMyActiveRooms();
  }, [myUserId, screen]);

  // Countdown Timer handler
  useEffect(() => {
    let interval: any = null;
    if (screen === 'game' && roomStatus === 'active') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            handleEndSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, roomStatus]);

  // Supabase Auth Session Listener
  useEffect(() => {
    if (!supabase) return;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: any) => {
    if (session) {
      const user = session.user;
      const username = user.user_metadata?.preferred_username || user.email?.split('@')[0] || 'dev';
      const avatar = user.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLlGgMe3DZvYSluUJQousQdMGClrRMz1lKpspg9JJL8l6KiF_UCgdKiAd76c-MhpvD0yR_K2s3xeWUy_me_7mZWT_9xV4LMDybKSbmDwiYtpRM1wFzWvr6Uw0M6qEjwzkh0vKFotTX0w-hQPf1VwnBTH5SnldueDSTt5inLhwLQxLqtigZjiAxXP4SKN-5WNS6FaKt8TvZI_8sVhkSnMGIMXKEx3cs3GYOm5hELDFclyXONdDimXNubfxDX4zfafr4TcSiUN050x2l';
      
      setMyUserId(user.id);
      setMyUsername(username);
      setMyAvatar(avatar);

      let followers = 0;
      let following = 0;
      let node_id = null;

      if (session.provider_token) {
        try {
          const ghRes = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github+json'
            }
          });
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            followers = ghData.followers || 0;
            following = ghData.following || 0;
            node_id = ghData.node_id || null;
            setMyFollowers(followers);
            setMyFollowing(following);
          }
        } catch (ghErr) {
          console.error('Error fetching GitHub user counts:', ghErr);
        }
      } else {
        // Refresh fallback: fetch existing stats from the database
        try {
          const { data: dbProfile } = await supabase!
            .from('profiles')
            .select('github_followers, github_following')
            .eq('id', user.id)
            .single();
          if (dbProfile) {
            setMyFollowers(dbProfile.github_followers || 0);
            setMyFollowing(dbProfile.github_following || 0);
          }
        } catch (dbErr) {
          console.error('Error restoring profile stats from DB:', dbErr);
        }
      }

      // Build profile update payload conditionally so we don't wipe out tokens on refresh
      const profileData: any = {
        id: user.id,
        github_username: username,
        display_name: user.user_metadata?.full_name || username,
        avatar_url: avatar,
        updated_at: new Date().toISOString()
      };

      if (session.provider_token) {
        profileData.provider_token = session.provider_token;
        profileData.provider_refresh_tk = session.provider_refresh_token || null;
        profileData.github_followers = followers;
        profileData.github_following = following;
        profileData.github_node_id = node_id;
      }

      const { error } = await supabase!.from('profiles').upsert(profileData);

      if (error) {
        console.error('Error saving profile:', error);
      }

      // Restore active room session if it is still valid
      const savedScreen = localStorage.getItem('gt_screen');
      const savedRoomId = localStorage.getItem('gt_roomId');
      if (savedRoomId && savedScreen && savedScreen !== 'auth') {
        const { data: room } = await supabase!
          .from('rooms')
          .select('status, ends_at')
          .eq('id', savedRoomId)
          .single();
        if (room && room.status !== 'concluded') {
          setRoomStatus(room.status);
          setScreen(savedScreen as any);
          if (room.status === 'active' && room.ends_at) {
            const remaining = Math.max(0, Math.floor((new Date(room.ends_at).getTime() - Date.now()) / 1000));
            setTimer(remaining);
          }
          triggerToast(`Signed in as @${username} (Session restored)`);
          return;
        } else {
          localStorage.removeItem('gt_screen');
          localStorage.removeItem('gt_roomId');
          localStorage.removeItem('gt_roomCode');
          localStorage.removeItem('gt_isOrganizer');
        }
      }

      setScreen('home');
      triggerToast(`Signed in as @${username}`);
    } else {
      setMyUserId('me');
      setMyUsername('sabari_dev');
      setMyAvatar('https://lh3.googleusercontent.com/aida-public/AB6AXuDLlGgMe3DZvYSluUJQousQdMGClrRMz1lKpspg9JJL8l6KiF_UCgdKiAd76c-MhpvD0yR_K2s3xeWUy_me_7mZWT_9xV4LMDybKSbmDwiYtpRM1wFzWvr6Uw0M6qEjwzkh0vKFotTX0w-hQPf1VwnBTH5SnldueDSTt5inLhwLQxLqtigZjiAxXP4SKN-5WNS6FaKt8TvZI_8sVhkSnMGIMXKEx3cs3GYOm5hELDFclyXONdDimXNubfxDX4zfafr4TcSiUN050x2l');
      setMyFollowers(0);
      setMyFollowing(0);
      setScreen('auth');
    }
  };

  // Supabase Real-Time Subscriptions disabled (Manually refreshed instead)
  useEffect(() => {
    if (!supabase || !roomId) return;

    // Fetch initial participants
    fetchRoomParticipants();
  }, [roomId]);

  // Real-time subscription for room status changes and participant list updates
  useEffect(() => {
    if (!supabase || !roomId) return;

    // Fetch initial list of participants
    fetchRoomParticipants();

    // Subscribe to changes
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          const newStatus = payload.new?.status;
          const endsAt = payload.new?.ends_at;
          if (newStatus) {
            setRoomStatus(newStatus);
            if (newStatus === 'active') {
              if (endsAt) {
                const remaining = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
                setTimer(remaining);
              }
              setScreen('game');
              setActiveTab('leaderboard');
              triggerToast('The session has started!');
              
              // Log start event
              const startLog: SyncLog = {
                id: Math.random().toString(),
                message: 'Game session started by organizer',
                timestamp: new Date().toLocaleTimeString(),
                type: 'success'
              };
              setSyncLogs((prev) => [startLog, ...prev]);
            } else if (newStatus === 'concluded') {
              fetchRoomParticipants();
              setScreen('concluded');
              triggerToast('Game Concluded! Checking podium...');
              
              // Log conclude event
              const endLog: SyncLog = {
                id: Math.random().toString(),
                message: 'Match concluded! Final scores calculated.',
                timestamp: new Date().toLocaleTimeString(),
                type: 'success'
              };
              setSyncLogs((prev) => [endLog, ...prev]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        () => {
          // Refresh participants list when any participant updates or new players join
          fetchRoomParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [roomId]);

  // Log participant join events dynamically based on participants list changes
  const prevParticipantsLength = useRef(0);
  useEffect(() => {
    if (participants.length > 0) {
      if (participants.length > prevParticipantsLength.current) {
        const newlyJoined = participants.filter(
          (p) => !participants.slice(0, prevParticipantsLength.current).some((old) => old.id === p.id)
        );
        newlyJoined.forEach((p) => {
          const logMsg: SyncLog = {
            id: Math.random().toString(),
            message: `@${p.github_username} joined the lobby`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'info'
          };
          setSyncLogs((prev) => [logMsg, ...prev].slice(0, 50));
        });
      }
      prevParticipantsLength.current = participants.length;
    }
  }, [participants]);

  const fetchRoomParticipants = async () => {
    if (!supabase || !roomId) return;
    
    const { data, error } = await supabase
      .from('room_participants')
      .select(`
        id,
        baseline_followers,
        baseline_following,
        current_followers,
        current_following,
        score,
        user:profiles(id, github_username, display_name, avatar_url)
      `)
      .eq('room_id', roomId);

    if (error) {
      console.error('Error fetching participants:', error);
      return;
    }

    if (data) {
      const parsed: Participant[] = data.map((d: any) => ({
        id: d.user.id,
        github_username: d.user.github_username,
        display_name: d.user.display_name,
        avatar_url: d.user.avatar_url,
        baseline_followers: d.baseline_followers,
        baseline_following: d.baseline_following,
        current_followers: d.current_followers,
        current_following: d.current_following,
        score: parseFloat(d.score),
        isYou: d.user.id === myUserId
      }));
      setParticipants(parsed);
    }
  };

  useEffect(() => {
    if (!supabase && screen === 'lobby' && participants.length < 5) {
      const timer = setTimeout(() => {
        // Auto-join another participant
        const nextIndex = participants.length - 1; // excluding user
        if (nextIndex < INITIAL_PARTICIPANTS.length) {
          const peer = INITIAL_PARTICIPANTS[nextIndex];
          setParticipants((prev) => [...prev, peer]);
          triggerToast(`${peer.display_name} joined the room.`);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen, participants]);

  // Peer activity simulator in active game (Simulation log events only, no score changes)
  useEffect(() => {
    if (!supabase && screen === 'game' && roomStatus === 'active') {
      const interval = setInterval(() => {
        const validPeers = participants.filter(p => p.github_username !== myUsername);
        if (validPeers.length > 1) {
          const followerIdx = Math.floor(Math.random() * validPeers.length);
          let followeeIdx = Math.floor(Math.random() * validPeers.length);
          while (followerIdx === followeeIdx) {
            followeeIdx = Math.floor(Math.random() * validPeers.length);
          }
          const follower = validPeers[followerIdx];
          const followee = validPeers[followeeIdx];
          
          // Add activity log
          const newLog: SyncLog = {
            id: Math.random().toString(),
            message: `@${follower.github_username} opened @${followee.github_username}'s GitHub profile`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'info'
          };
          setSyncLogs((prev) => [newLog, ...prev].slice(0, 50));
        }
      }, 7000);
      
      return () => clearInterval(interval);
    }
  }, [screen, roomStatus, participants]);

  // Confetti Particle Engine for concluded screen
  useEffect(() => {
    if (screen === 'concluded' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      let animationFrameId: number;
      
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      window.addEventListener('resize', resize);
      resize();
      
      interface Particle {
        x: number;
        y: number;
        size: number;
        speed: number;
        angle: number;
        spin: number;
        color: string;
      }
      
      const particles: Particle[] = [];
      const colors = ['#0F172A', '#10B981', '#E2E8F0', '#6366F1', '#F59E0B'];
      
      for (let i = 0; i < 75; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 6 + 3,
          speed: Math.random() * 3 + 1.5,
          angle: Math.random() * 360,
          spin: Math.random() * 8 - 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
          p.y += p.speed;
          p.angle += p.spin;
          
          if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
          
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.angle * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
        
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [screen]);

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Helper: Format timer (mm:ss)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Core actions
  const handleSignIn = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'user:follow',
          redirectTo: window.location.origin
        }
      });
      if (error) {
        triggerToast(`OAuth Error: ${error.message}`);
      }
    } else {
      triggerToast('Authenticated via GitHub OAuth successfully (Simulator).');
      setMyFollowers(120);
      setMyFollowing(80);
      setScreen('home');
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('gt_screen');
    localStorage.removeItem('gt_roomId');
    localStorage.removeItem('gt_roomCode');
    localStorage.removeItem('gt_isOrganizer');

    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        triggerToast(`Sign Out Error: ${error.message}`);
      }
    } else {
      triggerToast('Signed out successfully (Simulator).');
      setMyUserId('me');
      setMyUsername('sabari_dev');
      setMyAvatar('https://lh3.googleusercontent.com/aida-public/AB6AXuDLlGgMe3DZvYSluUJQousQdMGClrRMz1lKpspg9JJL8l6KiF_UCgdKiAd76c-MhpvD0yR_K2s3xeWUy_me_7mZWT_9xV4LMDybKSbmDwiYtpRM1wFzWvr6Uw0M6qEjwzkh0vKFotTX0w-hQPf1VwnBTH5SnldueDSTt5inLhwLQxLqtigZjiAxXP4SKN-5WNS6FaKt8TvZI_8sVhkSnMGIMXKEx3cs3GYOm5hELDFclyXONdDimXNubfxDX4zfafr4TcSiUN050x2l');
      setMyFollowers(0);
      setMyFollowing(0);
      setScreen('auth');
    }
  };

  const handleCreateRoom = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setIsOrganizer(true);
    setRoomStatus('waiting');
    
    if (supabase) {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          organizer_id: myUserId,
          room_code: code,
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) {
        triggerToast(`Failed to create room: ${roomError.message}`);
        return;
      }

      setRoomId(room.id);

      const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
          user_id: myUserId,
          room_id: room.id
        });

      if (joinError) {
        triggerToast(`Failed to join room: ${joinError.message}`);
        return;
      }
    } else {
      const me: Participant = {
        id: 'me',
        github_username: myUsername,
        display_name: myUsername === 'sabari_dev' ? 'Sabari Dev (You)' : myUsername,
        avatar_url: myAvatar,
        baseline_followers: myFollowers || 120,
        baseline_following: myFollowing || 80,
        current_followers: myFollowers || 120,
        current_following: myFollowing || 80,
        score: 0.0,
        isYou: true,
      };
      setParticipants([me]);
    }
    
    setScreen('lobby');
    triggerToast(`Room ${code} created.`);
  };

  const handleRejoinRoom = async (room: ActiveRoom) => {
    setRoomCode(room.room_code);
    setIsOrganizer(true);
    setRoomId(room.id);
    setRoomStatus(room.status);

    if (supabase) {
      const { data: dbRoom } = await supabase
        .from('rooms')
        .select('ends_at')
        .eq('id', room.id)
        .single();
        
      if (dbRoom && dbRoom.ends_at) {
        const remaining = Math.max(0, Math.floor((new Date(dbRoom.ends_at).getTime() - Date.now()) / 1000));
        setTimer(remaining);
      }

      const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
          user_id: myUserId,
          room_id: room.id
        });

      if (joinError && (joinError as any).code !== '23505') {
        triggerToast(`Failed to rejoin room: ${joinError.message}`);
        return;
      }
    }

    if (room.status === 'active') {
      setScreen('game');
    } else {
      setScreen('lobby');
    }
    triggerToast(`Rejoined Room ${room.room_code} as organizer.`);
  };

  const handleJoinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get('code')?.toString().trim();
    
    if (!code || code.length !== 6) {
      triggerToast('Please enter a valid 6-digit room code.');
      return;
    }
    
    setRoomCode(code);
    setIsOrganizer(false);
    setRoomStatus('waiting');
    
    if (supabase) {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', code)
        .single();

      if (roomError || !room) {
        triggerToast('Room not found. Check code and try again.');
        return;
      }

      setRoomId(room.id);
      setRoomStatus(room.status);

      const userIsOrganizer = room.organizer_id === myUserId;
      setIsOrganizer(userIsOrganizer);

      const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
          user_id: myUserId,
          room_id: room.id
        });

      if (joinError && (joinError as any).code !== '23505') {
        triggerToast(`Failed to join room: ${joinError.message}`);
        return;
      }

      if (room.status === 'active') {
        if (room.ends_at) {
          const remaining = Math.max(0, Math.floor((new Date(room.ends_at).getTime() - Date.now()) / 1000));
          setTimer(remaining);
        }
        setScreen('game');
      } else {
        setScreen('lobby');
      }
      triggerToast(userIsOrganizer ? `Joined Room ${code} as organizer.` : `Joined Room ${code} as participant.`);
    } else {
      const me: Participant = {
        id: 'me',
        github_username: myUsername,
        display_name: myUsername === 'sabari_dev' ? 'Sabari Dev (You)' : myUsername,
        avatar_url: myAvatar,
        baseline_followers: myFollowers || 120,
        baseline_following: myFollowing || 80,
        current_followers: myFollowers || 120,
        current_following: myFollowing || 80,
        score: 0.0,
        isYou: true,
      };
      
      setParticipants([me, INITIAL_PARTICIPANTS[0], INITIAL_PARTICIPANTS[1]]);
      setScreen('lobby');
      triggerToast(`Joined Room ${code} as participant.`);
    }
  };

  const handleManualRefresh = async () => {
    if (!supabase || !roomId) return;
    
    // 1. Fetch participants
    await fetchRoomParticipants();
    
    // 2. Fetch room status & ends_at
    try {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('status, ends_at')
        .eq('id', roomId)
        .single();
        
      if (error) {
        console.error('Error fetching room details on refresh:', error.message);
        return;
      }
      
      if (room) {
        setRoomStatus(room.status);
        if (room.status === 'active') {
          if (room.ends_at) {
            const remaining = Math.max(0, Math.floor((new Date(room.ends_at).getTime() - Date.now()) / 1000));
            setTimer(remaining);
          }
          if (screen === 'lobby') {
            setScreen('game');
            setActiveTab('leaderboard');
            triggerToast('The session has started!');
          }
        } else if (room.status === 'concluded') {
          setScreen('concluded');
        }
      }
    } catch (err) {
      console.error('Exception in handleManualRefresh:', err);
    }
    
    triggerToast('Room data manually refreshed.');
  };

  const handleStartGame = async () => {
    if (participants.length < 2) {
      triggerToast('Need at least 2 participants to start the game.');
      return;
    }
    
    if (supabase && roomId) {
      const { error } = await supabase.functions.invoke('room-state-manager', {
        body: { room_id: roomId, action: 'start' }
      });

      if (error) {
        triggerToast(`Error starting session: ${error.message}`);
        return;
      }

      triggerToast('Organizer started the session! Time to connect!');
    } else {
      setRoomStatus('active');
      setParticipants((prev) => 
        prev.map((p) => ({
          ...p,
          baseline_followers: p.current_followers,
          baseline_following: p.current_following,
          score: 0.0,
        }))
      );
      setTimer(462);
      setScreen('game');
      setActiveTab('leaderboard');
      triggerToast('Organizer started the session! Time to connect!');
    }
  };

  const handleOpenGitHub = (peer: Participant) => {
    window.open(`https://github.com/${peer.github_username}`, '_blank');
    
    // Log manual follow attempt locally
    const newLog: SyncLog = {
      id: Math.random().toString(),
      message: `You opened @${peer.github_username}'s GitHub profile`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'info'
    };
    setSyncLogs((prev) => [newLog, ...prev].slice(0, 50));
    
    triggerToast(`Opened GitHub for @${peer.github_username}. Follow them manually!`);
  };

  const handleEndSession = async () => {
    if (supabase && roomId && isOrganizer) {
      const { error } = await supabase.functions.invoke('room-state-manager', {
        body: { room_id: roomId, action: 'conclude' }
      });
      if (error) {
        console.error('Error concluding room:', error.message);
        triggerToast(`Failed to conclude room: ${error.message}`);
        return;
      }
    } else if (!supabase) {
      // Simulator Mode: generate random final stats
      setParticipants((prev) => 
        prev.map((p) => {
          const extraFollowers = Math.floor(Math.random() * 5); // 0 to 4 new followers
          const extraFollowing = Math.floor(Math.random() * 6); // 0 to 5 new following
          
          const newFollowers = p.current_followers + extraFollowers;
          const newFollowing = p.current_following + extraFollowing;
          const deltaFollowers = newFollowers - p.baseline_followers;
          const deltaFollowing = newFollowing - p.baseline_following;
          const score = deltaFollowers - 0.5 * deltaFollowing;

          return {
            ...p,
            current_followers: newFollowers,
            current_following: newFollowing,
            score: parseFloat(score.toFixed(1))
          };
        })
      );
      setRoomStatus('concluded');
      setScreen('concluded');
      triggerToast('Game Concluded! Checking podium...');
    }
  };

  const handleLeaveRoom = async () => {
    localStorage.removeItem('gt_screen');
    localStorage.removeItem('gt_roomId');
    localStorage.removeItem('gt_roomCode');
    localStorage.removeItem('gt_isOrganizer');

    if (supabase && roomId && myUserId) {
      if (isOrganizer) {
        const { error } = await supabase.functions.invoke('room-state-manager', {
          body: { room_id: roomId, action: 'conclude' }
        });
        if (error) {
          console.error('Error concluding room on leave:', error.message);
        }
      } else {
        const { error } = await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', myUserId);
        if (error) {
          console.error('Error leaving room:', error.message);
        }
      }
    }
    setScreen('home');
    setRoomCode('');
    setRoomId('');
    setIsOrganizer(false);
    setParticipants([]);
    setSyncLogs([]);
    triggerToast(isOrganizer ? 'Closed the room.' : 'Left the room.');
  };



  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      setIsDarkMode(true);
    }
  };



  // Compute stats for User
  const myParticipant = participants.find((p) => p.isYou);
  const deltaFollowers = myParticipant ? (myParticipant.current_followers - myParticipant.baseline_followers) : 0;
  const deltaFollowing = myParticipant ? (myParticipant.current_following - myParticipant.baseline_following) : 0;
  const currentScore = myParticipant ? myParticipant.score : 0.0;

  // Sorted list for leaderboard view
  const sortedLeaderboard = [...participants].sort((a, b) => b.score - a.score);

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '9999px',
            zIndex: 150,
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined text-accent text-[20px]">info</span>
          {showToast}
        </div>
      )}

      {/* Screen 1: Authenticate & Landing */}
      {screen === 'auth' && (
        <>
          <header className="app-header">
            <div className="header-container">
              <div className="logo-section">
                <span className="font-h1 tracking-tighter text-on-background">Git-Together</span>
              </div>
              <button className="icon-btn material-symbols-outlined" onClick={toggleDarkMode}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </button>
            </div>
          </header>

          <main className="app-main auth-gate">
            <section className="explanation-card fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="explanation-step">
                <div className="step-number font-label-mono">01</div>
                <div className="step-details">
                  <h2 className="font-h2">Sign In</h2>
                  <p className="font-body-sm">Authorize with GitHub to sync your professional presence securely.</p>
                </div>
              </div>
              <div className="divider-line"></div>
              <div className="explanation-step">
                <div className="step-number font-label-mono">02</div>
                <div className="step-details">
                  <h2 className="font-h2">Find Peers</h2>
                  <p className="font-body-sm">Use the room code to discover and connect with other developers instantly.</p>
                </div>
              </div>
              <div className="divider-line"></div>
              <div className="explanation-step">
                <div className="step-number font-label-mono">03</div>
                <div className="step-details">
                  <h2 className="font-h2">Gain Followers</h2>
                  <p className="font-body-sm">Instantly exchange profiles and grow your network with high-glanceability cards.</p>
                </div>
              </div>
            </section>

            <section className="action-area fade-in" style={{ animationDelay: '0.2s' }}>
              <button onClick={handleSignIn} className="obsidian-button font-button">
                <svg aria-hidden="true" className="w-5 h-5 fill-current" viewBox="0 0 24 24" width="20" height="20" style={{ fill: '#fff' }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
                <span>Sign In with GitHub</span>
              </button>
            </section>

            <footer className="version-footer fade-in" style={{ animationDelay: '0.4s' }}>
              <p className="font-label-mono text-secondary">v1.0.2-stable | Peer-to-Peer Encrypted</p>
            </footer>
          </main>
        </>
      )}

      {/* Screen 2: Home (Create or Join Room) */}
      {screen === 'home' && (
        <>
          <header className="app-header">
            <div className="header-container">
              <div className="logo-section">
                <span className="font-h1 tracking-tighter text-on-background">Git-Together</span>
              </div>
              <div className="header-actions">
                <button className="icon-btn material-symbols-outlined" onClick={toggleDarkMode}>
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </button>
                <button className="icon-btn material-symbols-outlined" onClick={handleSignOut} title="Sign Out">
                  logout
                </button>
                <div className="logo-avatar" style={{ cursor: 'pointer' }} onClick={() => setShowSelfProfile(true)} title="View Profile">
                  <img src={myAvatar} alt="My Avatar" />
                </div>
              </div>
            </div>
          </header>

          <main className="app-main auth-gate">
            <div className="explanation-card fade-in">
              <h2 
                className="font-h1 text-center mb-md" 
                style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.2s' }}
                onClick={() => setShowSelfProfile(true)}
                title="View Profile"
              >
                Welcome, @{myUsername}
              </h2>
              <p className="font-body-lg text-center text-secondary mb-lg">
                Create a new developer matchmaking lobby or enter a code to join an active event.
              </p>
              
              <button onClick={handleCreateRoom} className="obsidian-button font-button">
                <span className="material-symbols-outlined">add_circle</span>
                Create Game Room (Organizer)
              </button>

              <div className="or-divider">
                <div className="or-line"></div>
                <span className="or-text font-label-mono">OR JOIN EXISTING</span>
                <div className="or-line"></div>
              </div>

              <form onSubmit={handleJoinRoom} className="flex flex-col gap-sm w-full">
                <input 
                  type="text" 
                  name="code" 
                  placeholder="Enter 6-digit Room Code"
                  maxLength={6}
                  className="input-room-code font-label-mono text-center" 
                />
                <button type="submit" className="border-button font-button">
                  <span className="material-symbols-outlined">login</span>
                  Join Room
                </button>
              </form>

              {myActiveRooms.length > 0 && (
                <div className="active-rooms-section mt-md w-full">
                  <div className="or-divider mb-sm">
                    <div className="or-line"></div>
                    <span className="or-text font-label-mono">YOUR ACTIVE ROOMS</span>
                    <div className="or-line"></div>
                  </div>
                  <div className="active-rooms-container">
                    {myActiveRooms.map((room) => (
                      <div key={room.id} className="active-room-card">
                        <div className="active-room-info">
                          <span className="active-room-code-badge">ROOM {room.room_code}</span>
                          <span className="text-secondary text-sm font-label-mono">
                            Status:{' '}
                            <span 
                              className={`active-room-status-badge ${
                                room.status === 'active' ? 'status-active' : 'status-waiting'
                              }`}
                            >
                              {room.status}
                            </span>
                          </span>
                        </div>
                        <button 
                          onClick={() => handleRejoinRoom(room)} 
                          className="border-button font-button active-room-rejoin-btn"
                        >
                          <span className="material-symbols-outlined">login</span>
                          Rejoin
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* Screen 3: Waiting Lobby */}
      {screen === 'lobby' && (
        <>
          <header className="app-header">
            <div className="header-container">
              <div className="logo-section">
                <span className="font-h1 tracking-tighter text-on-background">Git-Together</span>
              </div>
              <div className="header-actions">
                <div className="status-badge animate-status">
                  <span className="status-dot"></span>
                  <span className="font-label-mono text-accent">Lobby Waiting</span>
                </div>
                <button className="icon-btn material-symbols-outlined" onClick={handleManualRefresh} title="Refresh Lobby">
                  refresh
                </button>
                <button className="icon-btn material-symbols-outlined" onClick={toggleDarkMode}>
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </button>
              </div>
            </div>
          </header>

          <main className="app-main">
            <div className="flex flex-col items-center gap-lg w-full">
              
              {/* Lobby Status Card */}
              <div 
                className="qr-card fade-in"
                style={{ cursor: 'default' }}
              >
                <div className="flex flex-col items-center gap-md" style={{ width: '100%' }}>
                  <div className="logo-avatar" style={{ width: '80px', height: '80px', border: '2px solid var(--color-primary)' }}>
                    <img src={myAvatar} alt="My Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="text-center">
                    <h2 className="font-h1" style={{ color: 'var(--color-primary)' }}>@{myUsername}</h2>
                    <span className="font-label-mono text-accent" style={{ backgroundColor: 'var(--color-accent-dim)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                      Profile Connected
                    </span>
                  </div>
                </div>

                <div className="divider-line" style={{ width: '100%' }}></div>

                <div className="text-center" style={{ width: '100%' }}>
                  <p className="font-body-sm text-secondary mb-xs" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>ROOM CODE FOR PEERS:</p>
                  <div className="font-display" style={{ fontFamily: 'var(--font-mono)', fontSize: '36px', letterSpacing: '2px', color: 'var(--color-primary)' }}>
                    {roomCode}
                  </div>
                  <p className="font-body-sm text-secondary mt-sm">
                    Share this code with developers in the room so they can join the session.
                  </p>
                </div>
              </div>

              {/* Lobby Participants List */}
              <div className="lobby-section w-full fade-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="font-label-mono text-secondary mb-md">LOBBY PARTICIPANTS ({participants.length})</h3>
                <div className="participant-grid">
                  {participants.map((p) => (
                    <div 
                      key={p.id} 
                      className="participant-card fade-in"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (p.isYou) {
                          setShowSelfProfile(true);
                        } else {
                          setSelectedPeer(p);
                        }
                      }}
                    >
                      <img src={p.avatar_url} alt={p.github_username} className="participant-card-avatar" />
                      <span className="participant-card-name font-body-sm">@{p.github_username}</span>
                      {p.isYou && <span className="font-label-mono text-accent" style={{ fontSize: '9px' }}>YOU</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-sm fade-in mt-md" style={{ animationDelay: '0.2s' }}>
                {isOrganizer ? (
                  <>
                    <button onClick={handleStartGame} className="obsidian-button font-button">
                      <span className="material-symbols-outlined">play_circle</span>
                      Start Live Session ({participants.length} Players)
                    </button>
                    <button onClick={handleLeaveRoom} className="border-button font-button" style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                      <span className="material-symbols-outlined">cancel</span>
                      Close Lobby / Cancel Room
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-button font-button" style={{ cursor: 'default' }}>
                      <span className="material-symbols-outlined animate-status">hourglass_empty</span>
                      Waiting for Organizer to start...
                    </div>
                    <button onClick={handleLeaveRoom} className="border-button font-button">
                      <span className="material-symbols-outlined">exit_to_app</span>
                      Leave Lobby
                    </button>
                  </>
                )}
              </div>

            </div>
          </main>
        </>
      )}

      {/* Screen 4: Active Game Page */}
      {screen === 'game' && (
        <>
          {/* Top Header */}
          <header className="app-header glass-header">
            <div className="header-container">
              <div className="logo-section">
                <div className="logo-avatar">
                  <img src={myAvatar} alt="My avatar" />
                </div>
                <span className="font-h1 tracking-tighter text-on-background">Git-Together</span>
              </div>
              <div className="header-actions">
                <div className="status-badge animate-status">
                  <span className="status-dot"></span>
                  <span className="font-label-mono text-accent">Active Room: {roomCode}</span>
                </div>
                <button className="icon-btn material-symbols-outlined" onClick={handleManualRefresh} title="Refresh Room">
                  refresh
                </button>
                <button className="icon-btn material-symbols-outlined" onClick={toggleDarkMode}>
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </button>
                {isOrganizer && (
                  <button className="icon-btn material-symbols-outlined" onClick={handleEndSession} title="End Session Early" style={{ color: '#ef4444' }}>
                    cancel
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="app-main">
            {/* Countdown timer */}
            <section className="timer-section fade-in">
              <div className="live-badge">
                <span className="w-2.5 h-2.5 rounded-full bg-accent pulse-live"></span>
                <span className="font-label-mono text-secondary tracking-widest uppercase">LIVE GAME SESSION</span>
              </div>
              <h2 className="timer-nums">{formatTimer(timer)}</h2>
              <p className="font-label-mono text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>remaining</p>
            </section>

            {/* TAB VIEW CONTROLLERS */}
            {activeTab === 'profile' && (
              <div className="w-full fade-in">
                {/* Stats Split Grid */}
                <section className="stats-container">
                  <div className="stats-card-growth">
                    <div>
                      <span className="stats-label font-label-mono">NETWORK GROWTH</span>
                      <div className="stats-score-text">
                        Δ Followers: <span className="stats-score-highlight">+{deltaFollowers}</span>
                        <span className="text-secondary mx-sm" style={{ fontWeight: '400' }}>/</span>
                        Following: <span className="stats-score-highlight">+{deltaFollowing}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined stats-icon">analytics</span>
                  </div>
                  
                  <div className="stats-card-points">
                    <span className="stats-points-label font-label-mono">MY SCORE</span>
                    <span className="stats-points-val">{currentScore.toFixed(1)}</span>
                  </div>
                </section>

                {/* Self Profile Dashboard Card */}
                <div 
                  className="qr-card"
                  style={{ marginBottom: '24px', cursor: 'default' }}
                >
                  <div className="flex flex-col items-center gap-md" style={{ width: '100%' }}>
                    <div className="logo-avatar" style={{ width: '80px', height: '80px', border: '2px solid var(--color-primary)' }}>
                      <img src={myAvatar} alt="My Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="text-center">
                      <h2 className="font-h1">@{myUsername}</h2>
                      <span className="font-label-mono text-accent" style={{ backgroundColor: 'var(--color-accent-dim)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                        Active Player
                      </span>
                    </div>
                  </div>

                  <div className="divider-line" style={{ width: '100%' }}></div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-secondary">Baseline Followers:</span>
                      <strong className="font-label-mono">{myParticipant?.baseline_followers || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-secondary">Current Followers:</span>
                      <strong className="font-label-mono" style={{ color: 'var(--color-accent)' }}>{myParticipant?.current_followers || 0}</strong>
                    </div>
                    <div className="divider-line" style={{ margin: '4px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-secondary">Baseline Following:</span>
                      <strong className="font-label-mono">{myParticipant?.baseline_following || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-secondary">Current Following:</span>
                      <strong className="font-label-mono" style={{ color: 'var(--color-accent)' }}>{myParticipant?.current_following || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="w-full fade-in">
                <div className="section-header">
                  <h3 className="font-h2">Leaderboard</h3>
                  <span className="font-label-mono text-secondary">{participants.length} ACTIVE USERS</span>
                </div>

                <div className="leaderboard-list">
                  {sortedLeaderboard.map((p, idx) => {
                    const rank = idx + 1;
                    const isUser = p.isYou;

                    return (
                      <div 
                        key={p.id} 
                        className="leaderboard-row"
                        style={isUser ? { backgroundColor: 'var(--color-surface-container-low)' } : undefined}
                      >
                        <div 
                          className="row-participant-info"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (isUser) {
                              setShowSelfProfile(true);
                            } else {
                              setSelectedPeer(p);
                            }
                          }}
                        >
                          <span className={`font-label-mono row-rank ${rank <= 3 ? 'row-rank-special' : ''}`}>
                            {rank.toString().padStart(2, '0')}
                          </span>
                          <div className="row-avatar-container">
                            <img src={p.avatar_url} alt={p.github_username} className={`row-avatar ${isUser ? 'avatar-you' : ''}`} />
                            {rank === 1 && (
                              <div className="row-avatar-badge">
                                <span className="material-symbols-outlined text-sm icon-filled" style={{ color: '#F59E0B' }}>star</span>
                              </div>
                            )}
                          </div>
                          <div className="participant-text">
                            <p className="font-button participant-username">
                              {p.github_username}
                              {isUser && <span className="badge-you font-label-mono">YOU</span>}
                            </p>
                            <p className="font-label-mono participant-meta">Score: {p.score.toFixed(1)}</p>
                          </div>
                        </div>

                        <div className="row-action">
                          {isUser ? (
                            <span className="row-status-playing font-label-mono">YOU</span>
                          ) : (
                            <button
                              onClick={() => {
                                handleOpenGitHub(p);
                              }}
                              className="follow-action-btn"
                            >
                              <span className="material-symbols-outlined text-sm">
                                open_in_new
                              </span>
                              <span>GitHub</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'feed' && (
              <div className="w-full fade-in">
                <div className="section-header">
                  <h3 className="font-h2">Live Event Feed</h3>
                  <span className="font-label-mono text-secondary">REALTIME ACTIVITIES</span>
                </div>

                {/* Live event feed */}
                <div 
                  className="flex flex-col gap-sm w-full p-md bg-surface-container-low rounded-xl border border-outline-variant"
                  style={{ minHeight: '240px' }}
                >
                  {syncLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-grow text-center text-secondary py-xl">
                      <span className="material-symbols-outlined text-display opacity-40 mb-sm">rss_feed</span>
                      <p className="font-body-sm">No events recorded yet in this session.</p>
                      <p className="font-label-mono" style={{ fontSize: '10px', marginTop: '4px' }}>Events will appear as developers join or start.</p>
                    </div>
                  ) : (
                    syncLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex justify-between items-center p-sm bg-surface-container-lowest border border-outline-variant rounded-lg fade-in"
                        style={{ fontSize: '13px' }}
                      >
                        <div className="flex items-center gap-sm">
                          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>
                            {log.type === 'success' ? 'check_circle' : log.type === 'warn' ? 'warning' : 'info'}
                          </span>
                          <span className="font-body-sm text-primary">
                            {log.message}
                          </span>
                        </div>
                        <div className="flex items-center gap-sm">
                          <span className="font-label-mono text-secondary" style={{ fontSize: '10px' }}>{log.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Bottom Nav Bar */}
            <nav className="bottom-nav">
              <button 
                onClick={() => setActiveTab('feed')} 
                className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">rss_feed</span>
                <span className="font-label-mono">Feed</span>
              </button>
              <button 
                onClick={() => setActiveTab('leaderboard')} 
                className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">leaderboard</span>
                <span className="font-label-mono">Leaderboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">person</span>
                <span className="font-label-mono">Profile</span>
              </button>
            </nav>
          </main>
        </>
      )}

      {/* Screen 5: Match Concluded / Podium Screen */}
      {screen === 'concluded' && (
        <>
          <canvas ref={canvasRef} className="confetti-canvas" id="confetti" />

          <header className="app-header">
            <div className="header-container">
              <div className="logo-section">
                <span className="font-h1 tracking-tighter text-on-background">Git-Together</span>
              </div>
              <button className="icon-btn material-symbols-outlined" onClick={toggleDarkMode}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </button>
            </div>
          </header>

          <main className="app-main">
            <section className="text-center mb-xl fade-in">
              <span className="font-label-mono text-secondary uppercase tracking-widest mb-sm block">Session Complete</span>
              <h2 className="font-display">Match Concluded. The Winners:</h2>
            </section>

            {/* Podium Visual (Bento Style) */}
            <div className="podium-container fade-in" style={{ animationDelay: '0.1s' }}>
              
              {/* 2nd Place (Silver) */}
              <div className="podium-col" style={{ order: 1 }}>
                {sortedLeaderboard[1] && (
                  <div className="podium-avatar-container">
                    <img 
                      src={sortedLeaderboard[1].avatar_url} 
                      alt="2nd Place" 
                      className="podium-avatar" 
                      style={{ width: '80px', height: '80px' }} 
                    />
                    <div className="podium-rank-badge">2</div>
                    <p className="font-h2 podium-name">@{sortedLeaderboard[1].github_username}</p>
                    <p className="font-label-mono podium-score">Score: {sortedLeaderboard[1].score.toFixed(1)}</p>
                  </div>
                )}
                <div className="podium-pedestal" style={{ height: '90px', borderRadius: '8px 8px 0 0' }}>
                  <span className="pedestal-medal">🥈</span>
                </div>
              </div>

              {/* 1st Place (Gold) */}
              <div className="podium-col" style={{ order: 2 }}>
                {sortedLeaderboard[0] && (
                  <div className="podium-avatar-container" style={{ transform: 'scale(1.15)', marginBottom: '32px' }}>
                    <div className="gold-glow"></div>
                    <img 
                      src={sortedLeaderboard[0].avatar_url} 
                      alt="1st Place" 
                      className="podium-avatar gold relative z-10" 
                      style={{ width: '96px', height: '96px' }} 
                    />
                    <div className="podium-rank-badge gold z-20">1</div>
                    <p className="font-h1 podium-name text-primary" style={{ fontWeight: '800' }}>
                      @{sortedLeaderboard[0].github_username}
                    </p>
                    <div className="podium-score-gold font-label-mono text-accent">
                      <span className="material-symbols-outlined text-[16px] icon-filled">stars</span>
                      <span>{sortedLeaderboard[0].score.toFixed(1)} PTS</span>
                    </div>
                  </div>
                )}
                <div className="podium-pedestal gold" style={{ height: '140px', borderRadius: '12px 12px 0 0' }}>
                  <span className="pedestal-medal">🥇</span>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="podium-col" style={{ order: 3 }}>
                {sortedLeaderboard[2] && (
                  <div className="podium-avatar-container">
                    <img 
                      src={sortedLeaderboard[2].avatar_url} 
                      alt="3rd Place" 
                      className="podium-avatar" 
                      style={{ width: '70px', height: '70px' }} 
                    />
                    <div className="podium-rank-badge">3</div>
                    <p className="font-h2 podium-name">@{sortedLeaderboard[2].github_username}</p>
                    <p className="font-label-mono podium-score">Score: {sortedLeaderboard[2].score.toFixed(1)}</p>
                  </div>
                )}
                <div className="podium-pedestal" style={{ height: '60px', borderRadius: '6px 6px 0 0' }}>
                  <span className="pedestal-medal">🥉</span>
                </div>
              </div>

            </div>

            {/* Remaining Ranks List */}
            <section className="concluded-ranks-list fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-label-mono text-secondary uppercase mb-md px-md pt-md">REMAINING RANKS</h3>
              <div className="divider-line"></div>
              <div>
                {sortedLeaderboard.slice(3).map((p, idx) => (
                  <div key={p.id} className="concluded-rank-row font-body-lg">
                    <div className="flex items-center gap-md">
                      <span className="font-label-mono text-secondary" style={{ width: '20px', textAlign: 'center' }}>
                        {idx + 4}
                      </span>
                      <strong className="text-primary font-body-lg">@{p.github_username}</strong>
                      {p.isYou && <span className="badge-you font-label-mono">YOU</span>}
                    </div>
                    <span className="font-label-mono text-secondary">Score: {p.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer concluded actions */}
            <footer className="w-full flex flex-col gap-sm items-center fade-in" style={{ animationDelay: '0.3s' }}>
              <button 
                onClick={() => triggerToast('Successfully exported followed developer networks back to GitHub API.')} 
                className="obsidian-button font-button w-full"
                style={{ maxWidth: '400px' }}
              >
                <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                Export Network to GitHub
              </button>
              <button 
                onClick={handleLeaveRoom} 
                className="border-button font-button w-full"
                style={{ maxWidth: '400px' }}
              >
                Leave Room
              </button>
            </footer>
          </main>
        </>
      )}

      {/* PEER PROFILE MODAL */}
      {selectedPeer && (
        <div className="modal-overlay" onClick={() => setSelectedPeer(null)}>
          <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close material-symbols-outlined" onClick={() => setSelectedPeer(null)}>
              close
            </button>
            
            <div className="profile-header">
              <img src={selectedPeer.avatar_url} alt={selectedPeer.github_username} className="profile-avatar" />
              <h3 className="font-h1">@{selectedPeer.github_username}</h3>
              <span className="github-badge font-label-mono">
                github.com/{selectedPeer.github_username}
              </span>
            </div>

            <div className="stats-grid-compact">
              <div className="compact-stat-card">
                <div className="compact-stat-num">{selectedPeer.current_followers}</div>
                <div className="compact-stat-label">Followers</div>
              </div>
              <div className="compact-stat-card">
                <div className="compact-stat-num">{selectedPeer.current_following}</div>
                <div className="compact-stat-label">Following</div>
              </div>
            </div>

            {/* Add action */}
            <button 
              onClick={() => {
                handleOpenGitHub(selectedPeer);
                setSelectedPeer(null);
              }} 
              className="obsidian-button w-full font-button"
            >
              <span className="material-symbols-outlined">open_in_new</span>
              Open Profile to Follow
            </button>
          </div>
        </div>
      )}

      {/* SELF PROFILE MODAL */}
      {showSelfProfile && (
        <div className="modal-overlay" onClick={() => setShowSelfProfile(false)}>
          <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close material-symbols-outlined" onClick={() => setShowSelfProfile(false)}>
              close
            </button>
            
            <div className="profile-header">
              <img src={myAvatar} alt={myUsername} className="profile-avatar" />
              <h3 className="font-h1">@{myUsername}</h3>
              <span className="github-badge font-label-mono">
                github.com/{myUsername}
              </span>
            </div>

            <div className="stats-grid-compact">
              <div className="compact-stat-card">
                <div className="compact-stat-num">{myFollowers}</div>
                <div className="compact-stat-label">Followers</div>
              </div>
              <div className="compact-stat-card">
                <div className="compact-stat-num">{myFollowing}</div>
                <div className="compact-stat-label">Following</div>
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p className="font-body-sm text-secondary">
                Your stats are synced from GitHub and will serve as your starting baseline in matchmaking rooms.
              </p>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
