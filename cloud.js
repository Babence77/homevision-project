// HomeVision AI — felhő-mentés és bejelentkezés (Supabase)
// Ugyanaz a minta, mint a viewer3d.js-nél: külön modul, window.HVCloud hídon
// keresztül beszél az app.js-sel. Ha nincs kitöltve a konfig, a modul alszik,
// és az app pontosan úgy működik, mint eddig (csak localStorage).

// ⬇️ IDE kell a Supabase projekt két adata (Project Settings → API):
const SUPABASE_URL = 'https://bawqlphksmkgmwnmbcqi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oyzo5ne7tJxXUfRIeMQKsA_u1IRtL6W'; // publikus kulcs (a biztonságot az RLS adja)

(function(){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || typeof supabase === 'undefined') return; // konfig nélkül: alvó mód

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let user = null;
  let saveTimer = null;

  // --- Bejelentkezés e-mailes "varázslinkkel" (nem kell jelszó!) ---
  async function signIn(email) {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname }
    });
    return error ? error.message : null; // null = siker, e-mail elküldve
  }
  async function signOut() { await client.auth.signOut(); }

  // --- Felhő-műveletek: a teljes "Házam" lista egyetlen JSON-ként ---
  async function fetchHouse() {
    const { data, error } = await client.from('houses').select('data').maybeSingle();
    if (error) return null;
    return data ? data.data : null; // null = még nincs felhő-mentése
  }
  async function pushHouse(houseArr) {
    if (!user) return;
    await client.from('houses').upsert({
      user_id: user.id, data: houseArr, updated_at: new Date().toISOString()
    });
  }
  // Rövid késleltetéssel mentünk, hogy gyors kattintgatásnál ne menjen
  // minden egyes változásról külön kérés (ezt hívják "debounce"-nak).
  function scheduleSave(houseArr) {
    if (!user) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => pushHouse(houseArr), 800);
  }

  // --- Bejelentkezés-figyelés: az app.js-t a callbackeken át értesítjük ---
  client.auth.onAuthStateChange((_event, session) => {
    user = session ? session.user : null;
    if (window.HVCloud.onAuthChange) window.HVCloud.onAuthChange(user);
  });

  window.HVCloud = {
    enabled: true,
    signIn, signOut, fetchHouse, pushHouse, scheduleSave,
    getUser: () => user,
    onAuthChange: null // az app.js állítja be
  };
})();
if (!window.HVCloud) window.HVCloud = { enabled: false };
