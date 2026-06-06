import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    // Enable CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment configuration." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload
    const { room_id, action } = await req.json();

    if (!room_id || !action || (action !== "start" && action !== "conclude")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid payload. Required: room_id, action ('start' | 'conclude')." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine next status
    const targetStatus = action === "start" ? "active" : "concluded";

    if (action === "conclude") {
      console.log(`Concluding room ${room_id}: fetching final stats for participants...`);
      
      // 1. Fetch all participants in this room, along with their tokens and usernames
      const { data: participants, error: fetchErr } = await supabase
        .from("room_participants")
        .select(`
          user_id,
          baseline_followers,
          baseline_following,
          profile:profiles(github_username, provider_token)
        `)
        .eq("room_id", room_id);

      if (fetchErr) {
        console.error("Error fetching room participants:", fetchErr);
        return new Response(
          JSON.stringify({ error: `Failed to fetch room participants: ${fetchErr.message}` }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (participants && participants.length > 0) {
        // 2. Fetch and update GitHub stats for each participant
        const updatePromises = participants.map(async (p: any) => {
          const username = p.profile?.github_username;
          const token = p.profile?.provider_token;
          
          if (!username) return;

          let newFollowers = p.baseline_followers;
          let newFollowing = p.baseline_following;

          try {
            const headers: Record<string, string> = {
              "Accept": "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "Git-Together-State-Manager",
            };
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }

            const ghRes = await fetch(`https://api.github.com/users/${username}`, { headers });
            
            if (ghRes.ok) {
              const ghData = await ghRes.json();
              newFollowers = ghData.followers ?? p.baseline_followers;
              newFollowing = ghData.following ?? p.baseline_following;
              console.log(`Fetched stats for @${username}: followers=${newFollowers}, following=${newFollowing}`);
            } else {
              const errText = await ghRes.text();
              console.warn(`Failed to fetch GitHub stats for @${username} (status ${ghRes.status}): ${errText}`);
            }
          } catch (ghErr) {
            console.error(`Error fetching GitHub profile for @${username}:`, ghErr);
          }

          // Calculate delta and score
          const deltaFollowers = newFollowers - p.baseline_followers;
          const deltaFollowing = newFollowing - p.baseline_following;
          const score = deltaFollowers - (0.5 * deltaFollowing);

          // Update this participant in room_participants
          const { error: updateErr } = await supabase
            .from("room_participants")
            .update({
              current_followers: newFollowers,
              current_following: newFollowing,
              score: parseFloat(score.toFixed(2))
            })
            .eq("room_id", room_id)
            .eq("user_id", p.user_id);

          if (updateErr) {
            console.error(`Error updating room participant @${username}:`, updateErr);
          }
        });

        await Promise.all(updatePromises);
      }
    }

    // 3. Update room status to transition to active/concluded
    const { data: updatedRoom, error: updateError } = await supabase
      .from("rooms")
      .update({ status: targetStatus })
      .eq("id", room_id)
      .select()
      .single();

    if (updateError) {
      console.error(`Error transitioning room ${room_id} to ${targetStatus}:`, updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Room ${room_id} status transitioned to ${targetStatus}`);

    return new Response(
      JSON.stringify({ message: `Room status updated successfully to ${targetStatus}`, room: updatedRoom }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );

  } catch (err) {
    console.error("Room State Manager error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
