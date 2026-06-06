-- Seed test records for local database development

-- Insert test profiles
INSERT INTO profiles (id, github_username, display_name, avatar_url, github_followers, github_following)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'sarah_codes', 'Sarah Chen', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqLGoSKic_7gQItdHbjNAkhAmZmcf4I2Hdqc5nH1NShj6HOSUbpAa9Wqmmba_YFXPJLQpc3A-c_A0c_CEl8hIbGbuJZPblB2S1c6Xo2n7757fPfQ4cSwn1kgGsdj35mJQgu4Yv6PiIaPyhA-KgVJAASZcApCZC7lf6hxKeMAevT6sNEuGsn81xT6Pdgt3VG09jy3pE7w0bkVYowaX06t6iGIBXK7ntBzm3J_F4fOg9bAWrbIx7d5vt-QE2CZqeCydqfTwD5QV82X0v', 120, 80),
  ('00000000-0000-0000-0000-000000000002', 'alex_rivers', 'Alex Rivers', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpU0Ng6qAb6E5P8cVT1PBWGQBbFnE-Wh7J4K8YX_wAXMINrNE8xou3IhD4q2fA0O-UHcfujyKG4pBW5Rb5nvS8Jj-Qnr9PGvT-deDB5krXpcSn88yenZW7-WKqNnBqbJMsDijmQkx6E213G1a5ooLHAwuf35mnOMLPHLnTl8YpML9AlPBcW_5r-maf6TFMzRYH9eM-Z6LJ6dZEIerqToMlyMeGnA4FYfRV8BnDpGXnGBmWW68WK3Wzh_nHx4Lz9X_QNGeIIYCP7YdQ', 350, 150),
  ('00000000-0000-0000-0000-000000000003', 'dev_ninja', 'Jordan Smith', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE2kepnUVDWpTM62qJItGisUM-kgPGkC6WFTogJ8JWc2DxCWnp4JYhKBaZPCjCL-1j6L73fwgJ3I-RZHXn5vUX0oAQXqP0R72w9N6V3Uta5oyQTwYVFfKIMeorf8gw2YnkTyN7_i4azMYU_WgQQasu6esFx3jpGcYKvTtweafeq3o7NdKUzBPcG9FaTkzflZBIRWXct9vmF-ym1NnoeZCYergT4smvr3_ivwzSH18tP6zf6kvnu6eOgZHqGt2GWKoZ8ArYrAO_ffDW', 95, 110),
  ('00000000-0000-0000-0000-000000000004', 'octo_man', 'Octo Man', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5SaC-pM3yaO2NZ8sPsyWvmIKrqt24fDwtQbBl07HxhnZOnWChv53zpDp6rrG7osu5a6jzPreX39-ewuBToQ5by1wkXKyWrZGt_TQ0CHyvpW9Z73AhfvorUuNplYcDWECOZfj5Z4uk5FCoYSGTHnzEysgJLkoqfWIZBrPxORASajiBvxODLMEZ5i158Sandp2GszIVbPbB44Fh6XiECNOarZvLVBTR3_OLe4Z_IZaXeZTqkygbkzv4c1GYHD2DMi5k9XD79WZKcldJ', 180, 130)
ON CONFLICT (github_username) DO NOTHING;

-- Insert test room
INSERT INTO rooms (id, organizer_id, status, duration_seconds, room_code)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'waiting', 600, 'TEST01')
ON CONFLICT (room_code) DO NOTHING;

-- Add participants to test room
INSERT INTO room_participants (user_id, room_id, baseline_followers, baseline_following, current_followers, current_following, score)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 120, 80, 120, 80, 0),
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 350, 150, 350, 150, 0),
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 95, 110, 95, 110, 0)
ON CONFLICT (room_id, user_id) DO NOTHING;
