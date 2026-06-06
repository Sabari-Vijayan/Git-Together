import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    // 1. Initialize Supabase Client with service role key for database actions
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment configuration." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch and claim batch of pending follow ledger rows
    const { data: ledgerRows, error: claimError } = await supabase
      .rpc("claim_pending_ledger_rows", { batch_size: 50 });

    if (claimError) {
      console.error("Error claiming ledger rows:", claimError);
      return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
    }

    if (!ledgerRows || ledgerRows.length === 0) {
      return new Response(JSON.stringify({ message: "No pending follows to sync." }), { status: 200 });
    }

    console.log(`Processing ${ledgerRows.length} claimed follows...`);

    // 3. Process each follow ledger row
    for (const row of ledgerRows) {
      const { id, follower_id, followee_id } = row;

      try {
        // Fetch follower token and followee username
        const { data: follower, error: followerErr } = await supabase
          .from("profiles")
          .select("provider_token, provider_refresh_tk")
          .eq("id", follower_id)
          .single();

        const { data: followee, error: followeeErr } = await supabase
          .from("profiles")
          .select("github_username")
          .eq("id", followee_id)
          .single();

        if (followerErr || followeeErr || !follower?.provider_token || !followee?.github_username) {
          console.error(`Missing profile details for ledger ${id}:`, { followerErr, followeeErr });
          await supabase
            .from("follow_ledger")
            .update({ sync_status: "failed", sync_attempts: 1 })
            .eq("id", id);
          continue;
        }

        // Call GitHub PUT /user/following/{username}
        const githubUrl = `https://api.github.com/user/following/${followee.github_username}`;
        const response = await fetch(githubUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${follower.provider_token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Git-Together-Sync-Worker",
          },
        });

        if (response.status === 204) {
          // Success
          await supabase
            .from("follow_ledger")
            .update({ sync_status: "synced", synced_at: new Date().toISOString() })
            .eq("id", id);
          console.log(`Successfully synced follow from @${follower_id} to @${followee.github_username}`);
        } else if (response.status === 401) {
          // Token expired, attempt refresh
          console.log(`Token expired for profile ${follower_id}. Attempting token refresh...`);
          // Implementation of OAuth token refresh goes here (calling github auth refresh api)
          // For now, mark failed so organizer can re-authenticate
          await supabase
            .from("follow_ledger")
            .update({ sync_status: "failed", sync_attempts: 1 })
            .eq("id", id);
        } else {
          // Other error (403, 429, 5xx)
          const errorText = await response.text();
          console.error(`GitHub API responded with code ${response.status}: ${errorText}`);
          
          await supabase
            .rpc("increment_sync_attempts", { row_id: id });
        }

        // Rate limit throttle spacing delay (100ms)
        await new Promise((resolve) => setTimeout(resolve, 100));

      } catch (rowError) {
        console.error(`Fatal row error in ledger ${id}:`, rowError);
        await supabase
          .from("follow_ledger")
          .update({ sync_status: "failed" })
          .eq("id", id);
      }
    }

    return new Response(JSON.stringify({ status: "success", count: ledgerRows.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("Global Sync Worker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
