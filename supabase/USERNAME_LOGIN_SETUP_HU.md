# Fighter Reset Journal – felhasználónév-alapú bejelentkezés

Ez a megoldás a meglévő Supabase Auth e-mail/jelszó rendszerét tartja meg. A felhasználó a `profiles.username` értékével lép be; a háttérben a szerver megkeresi a hozzá tartozó regisztrált e-mail-címet, majd a Supabase Auth ellenőrzi a jelszót. A megerősített e-mail-címre vonatkozó Auth-szabályok változatlanok.

## A megoldás részei

- A `profiles.username` mező automatikusan létrejön a regisztrált e-mail `@` előtti részéből.
- Ütközés esetén sorszámot kap (például `teszt`, `teszt2`).
- A résztvevő a saját profiljában módosíthatja a felhasználónevét.
- A Coach Dashboard a felhasználónevet jeleníti meg.
- A tényleges belépést továbbra is a Supabase Auth végzi.
- A login Edge Functionnél a **Verify JWT BEKAPCSOLVA marad**. A frontend a projekt publikus kulcsát küldi a Supabase gatewaynek; a felhasználó személyazonosságát a username feloldása után a jelszóellenőrzés igazolja.
- A login végpont nem adja vissza az e-mail-címet, és azonos hibaüzenetet ad hibás jelszóra és nem létező felhasználónévre.
- A SQL rate-limit táblája 10 próbálkozást enged 15 perc alatt egy IP+felhasználónév párosra, és 100-at IP-nként.

## 1. SQL telepítése a Supabase Dashboardban

1. Nyisd meg a Supabase projektet.
2. Bal oldalt: **SQL Editor**.
3. Válaszd a **New query** lehetőséget.
4. Nyisd meg a projekt ZIP-ben található `supabase/username_login_migration.sql` fájlt, másold be a teljes tartalmát.
5. Kattints a **Run** gombra.
6. Az eredményben ellenőrizd:
   - `profiles_total` és `profiles_with_username` egyezzen.
   - `invalid_usernames = 0`.
   - `duplicate_usernames = 0`.
   - `user_can_update_username = true`.
   - `user_can_update_role = false`.
   - `anon_can_read_rate_limits = false`.

A migráció a meglévő Auth felhasználókat, jelszavakat, naplókat, csoportokat és szerepköröket nem törli. Előtte készíts biztonsági mentést.

## 2. Edge Function létrehozása a Supabase webes felületén

Nem szükséges VS Code vagy parancssor.

1. Supabase Dashboard → **Edge Functions**.
2. Válaszd a **Deploy a new function** lehetőséget, majd a **Via Editor** megoldást.
3. Function name: `login-with-username`.
4. A szerkesztőben levő mintakódot cseréld le a ZIP `supabase/functions/login-with-username/index.ts` fájljának teljes tartalmára.
5. A **Verify JWT** kapcsolót hagyd **BEKAPCSOLVA** (ON).
6. Kattints a **Deploy function** gombra.

A Supabase Edge Function futtatókörnyezete automatikusan biztosítja a `SUPABASE_URL`, `SUPABASE_ANON_KEY` és `SUPABASE_SERVICE_ROLE_KEY` szerveroldali változókat. A service role kulcsot ne másold a GitHubra, ne tedd a frontendbe és ne hozz létre hozzá `VITE_` változót.

### CORS-domain

A funkció alapértelmezésben ezeket engedi böngészőből: `https://fighterjournal.vercel.app`, `https://fighterreset.hu`, `https://www.fighterreset.hu` és helyi fejlesztéshez `http://localhost:5173`.

Ha a Vercel alkalmazásod tényleges címe más, a Supabase Edge Function `index.ts` fájljában az `ALLOWED_ORIGINS` listában add hozzá a pontos `https://...` domaint, majd telepítsd újra a funkciót a Dashboardból.

## 3. GitHub / Vercel

1. A ZIP tartalmát töltsd fel a jelenlegi GitHub-repozitóriumba.
2. A Vercel a meglévő projektbeállítások alapján automatikusan készít új deploymentet.
3. A Vercel meglévő `VITE_SUPABASE_URL` és `VITE_SUPABASE_ANON_KEY` környezeti változói változatlanul maradnak.

A ZIP tartalmazza az Edge Function forrását a `supabase/functions/login-with-username/index.ts` útvonalon, de a GitHub → Vercel deployment önmagában nem telepíti a Supabase Edge Functiont. A 2. pont szerinti Dashboard-telepítés egyszer szükséges.

## 4. Tesztelés

1. A migration után nézd meg a `profiles` táblát: mindegyik profilhoz legyen `username`.
2. Egy `teszt@gmail.com` felhasználó alapértelmezett neve `teszt` (ha foglalt, `teszt2`, stb.).
3. Jelentkezz be a felhasználónévvel és a meglévő jelszóval.
4. A belépés után a **Felhasználónév** beállításnál módosítsd a nevet.
5. Jelentkezz ki, majd lépj be az új névvel.
6. Az edzői felületen ellenőrizd, hogy az új felhasználónév jelenik meg.

Ha egy e-mail prefixe speciális karaktert tartalmaz, a generálás az angol kisbetűket, számokat, pontot, aláhúzást és kötőjelet tartja meg. A 32 karakternél hosszabb név csonkolódik. Ütközéskor sorszám kerül hozzá.

## 5. Fontos biztonsági megjegyzés

A **Verify JWT nem kapcsolódik ki**. A Supabase gateway a projekt API-kulcsát ellenőrzi a kérésnél; ez publikus kulcs, ezért önmagában nem azonosít be egy felhasználót. A tényleges felhasználói hitelesítést a feloldott e-mail-cím + jelszó páros Supabase Auth ellenőrzése végzi. A Service Role kulcs kizárólag az Edge Function szerveroldali futtatókörnyezetében van használva.

A bejelentkezési végpont nyilvánosan elérhető kell legyen azok számára, akik még nincsenek bejelentkezve. A rate limit korlátozza a próbálkozásokat; a Supabase Auth saját rate limitjei is érvényben maradnak. A JWT platformellenőrzés csak erre a függvényre nem kerül kikapcsolásra, és a többi Edge Function beállítását ez nem érinti.
