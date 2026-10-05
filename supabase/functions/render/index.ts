// HomeVision AI — "render" Edge Function (Supabase szerverén fut, Deno)
// Ezt a fájlt a Supabase Dashboard → Edge Functions → új függvény szerkesztőjébe
// kell bemásolni "render" néven. A REPLICATE_API_TOKEN titkos kulcsot a
// Secrets beállításban kell megadni — SOHA nem kerül a frontend kódba!
//
// Mit csinál: bejelentkezés-ellenőrzés → napi limit → Replicate AI kép-
// generálás (a 3D nézet képéből + stílus-promptból) → kép URL vissza.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

const DAILY_LIMIT = 5; // ennyi képet generálhat egy felhasználó naponta

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors }); // CORS előkérés

  try {
    // 1) Ki kéri? — a bejövő JWT-ből azonosítjuk a felhasználót
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "auth" }, 401);

    // 2) Napi limit — a service role kulcs csak itt, a szerveren létezik
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const day = new Date().toISOString().slice(0, 10);
    const { data: row } = await admin.from("ai_renders")
      .select("count").eq("user_id", user.id).eq("day", day).maybeSingle();
    const used = row?.count ?? 0;
    if (used >= DAILY_LIMIT) return json({ error: "limit", limit: DAILY_LIMIT }, 429);

    // 3) Bemenet: a 3D nézet képe (data URL) + az angol nyelvű prompt
    const { image, prompt } = await req.json();
    if (!image || !prompt || String(image).length > 2_500_000) return json({ error: "input" }, 400);

    // 4) Replicate hívás — FLUX Kontext Pro: utasítás-alapú képszerkesztő,
    // a 3D-nézet elrendezését és arányait megtartva fotórealisztikussá alakítja.
    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) return json({ error: "config" }, 500);
    const auth = { Authorization: "Bearer " + token };

    let pred = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: image,
          aspect_ratio: "match_input_image",
          output_format: "jpg",
          safety_tolerance: 2,
        },
      }),
    }).then((r) => r.json());
    if (!pred.id) return json({ error: "render", detail: JSON.stringify(pred).slice(0, 300) }, 502);

    // 5) Ha 60 mp alatt nem lett kész, kétmásodpercenként rákérdezünk
    let tries = 0;
    while (pred.status && ["starting", "processing"].includes(pred.status) && tries < 40) {
      await new Promise((r) => setTimeout(r, 2000));
      pred = await fetch("https://api.replicate.com/v1/predictions/" + pred.id, { headers: auth })
        .then((r) => r.json());
      tries++;
    }
    if (pred.status !== "succeeded") return json({ error: "render", detail: pred.error ?? pred.status }, 502);

    const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    // Csak sikeres render után számoljuk a napi limitbe
    await admin.from("ai_renders").upsert({ user_id: user.id, day, count: used + 1 });
    return json({ url, remaining: DAILY_LIMIT - used - 1 });
  } catch (e) {
    return json({ error: "server", detail: String(e) }, 500);
  }
});
