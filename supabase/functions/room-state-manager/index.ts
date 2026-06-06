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

    // Update room status
    // Note: Triggers on the database will automatically handle baseline snapshotting on transition to 'active'
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
