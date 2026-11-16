# Pip's Pots 1.0.0 (release-1)

- **Branch:** `release-1`, from `5ace6ad` (0.12.9).
- **Android:** `com.lochlans.pipspots`, versionCode 11, versionName 1.0.0, compile/target SDK 36, min SDK 24.
- **Signing:** the new upload key `pipspots-release.jks`, signer SHA-256 `a5:60:ca:61:01:90:07:09:df:89:76:08:0b:cd:fa:0e:54:55:4d:7b:ed:be:9a:8a:60:3f:be:df:69:76:ae:9f`. The keystore and its password live outside the repo (`/home/box/secrets/`). **Back them up:** losing the key means asking Google for an upload-key reset.
- **Review this answers:** `review_shots/pre_play_review/REVIEW.md` (item numbers below).
- **Before/after shots and data:** `review_shots/release_1/` (`before/`, `after/`, `compare/*.png`, `*.json`).

## Where the changes are
| What | Where |
|---|---|
| App source (Vite/React/TS), 6 commits | `review/release-1/0001…0006-*.patch` (apply on 0.12.9 `s5src/game`) |
| Painted train (c12) | `c12/*`, `assets/c12.css` (commit "release-1 train (c12)") |
| Built web app | `index.html`, `spa.html`, `assets/`, `audio/`, `THIRD_PARTY_NOTICES.txt`, `CREDITS.txt` |
| Android wrapper | `review/android/release-1/` (changed files and `wrapper-release-1.patch` against the 0.12.7 wrapper) |

## MUST
- **1. Target API 36.** AGP 8.5.2 → 8.13.2, Gradle 8.7 → 8.14.3, build-tools 36.0.0. `android:appCategory="game"` is set, so the landscape lock still holds on tablets.
- **2. App id** is now `com.lochlans.pipspots`. Testers must **uninstall the preview app** (`com.lochlans.pipspots.preview`, debug-signed) first. The two can sit side by side, but the preview will never update to this build.
- **3. Signing and format.** The release build is signed with the new upload key. `bundleRelease` gives the AAB for Play, and a signed APK is built for sideloading testers.
- **7. CC BY attribution.** There's a new **Credits** sheet in the grown-up panel (menu only, behind the 3 s hold). It has the music credits, the version, and the full open-source licences, read from the bundled file with no network.
- **8. Train icon blank in the panel.** Fixed. The c12 hide rule now targets only the R3F canvas.
- **9. "6 colours" in the train.** The train now offers 2, 3 or 4 colours, which is what it can actually play.
- **4–6 (Families forms, store art, closed test)** need you. See "Still needs you" below.

## SHOULD: bugs and polish
- **10. Hidden 3D redraw.** The three.js loop stops outside Balloon Pop, and the hidden canvas drops to DPR 1. GL clears per second in Colouring, Piano, Stars and the train went from 45–60 to **0** (`glidle.json`).
- **11. Colouring Pip** stands on a little shelf with his feet showing. He's no longer clipped at 1280x800.
- **12. Colouring bunting** now starts clear of the home button. The crayons stay inside the bottom edge.
- **13. Loudness** (`soak_loudness.json`, output RMS mean while playing):
  - Colouring: −54.9 → **−38.6 dB**. The pad is up 18 dB and the brush sounds about 8 dB.
  - Piano: −27.6 → **−34.7 dB**. The keys are down 7 dB.
  - The other modes are unchanged: menu −38.3, Balloon Pop −35.4, Train −33.5, Stars −35.5 dB.
  - So every mode now sits within about 5 dB of the others, where the spread used to be 27 dB.
- **14. Balloons and the cut-out.** Balloons are born inside the safe area, and fade at the cut-out edge instead of drifting through it.
- **15. Home button** sits at `max(16px, inset + 12px)`.
- **16. Piano wall notes** are now drawn in full colour with navy outlines, placed where there's room above the piano. On short screens there's one note to the right. They're never behind the piano.
- **17. Train rails** run off both edges, so there's no stub cap.
- **18. Train on tablets.** The scene is laid out in a bottom band shaped like a phone screen, and the train and Pip scale with it, so they're bigger at 1280x800.

## SHOULD: off theme
- **19. One Pip.** Balloon Pop paints the master Pip at the master's own scale, so the navy line has the same weight everywhere. The train calls the app's master painter (`window.__housePip`), with a local copy as a fallback. Stars uses the master with a lighter night tint.
- **20. Shooting Stars.**
  - The stars, jar, moon and Pip have the navy line, with a faint pale rim so it reads on the night sky.
  - The photo-like galaxies are replaced with painted swirls at lower opacity.
  - It's still a calm mode.
- **21. Train menu card** is redrawn: a big smiling engine pulling three wagons (apple, banana, duck) on rails, with spoked wheels, layered hills, a sun and steam.
- **22. Train depth.** New mid-ground hills with field stripes, and a near grass bank with tufts, flowers and corner bushes.
- **23. Menu grown-up icon** is now a padlock. It still needs the 3 s hold, and in a game it's still the house.

## SHOULD: Android hardening
- **24. Locked down.**
  - No `INTERNET` permission (verified: the app loads and runs from `appassets.androidplatform.net` with none).
  - `allowFileAccess`/`allowContentAccess` are off, as are geolocation and multiple windows.
  - `shouldOverrideUrlLoading` keeps everything inside the app. Any non-app request gets an empty 404.
  - `allowBackup=false` plus data-extraction rules (no cloud backup, no device transfer).
- **25. Edge-to-edge and back.**
  - On API 30+ it uses `WindowInsetsController` (bars hidden, swipe to peek), with the legacy flags below that. The cut-out mode is `shortEdges`/`always`.
  - Back does nothing (toddler-safe): there's an `OnBackInvokedCallback` on 33+ and `onBackPressed` below. Leaving the app is Home, and going back to the menu is the 3 s home hold.
- **26. Dead weight removed.**
  - Fish Nets, Shape Box, the 3D pots table and bubble tubes: their code, scenes, audio and assets (about 20k lines of source).
  - The m4a duplicates, plus `aquaria`, `underwater` and `wholesome`.
  - The 3D fish models, the stray arena thumbs, `og.jpg` and the draco URL.
  - 208 dead CSS rules.
  - **The APK went from 20.8 MB to 7.8 MB.**
- **27. Open-source notices.** A build plugin writes `THIRD_PARTY_NOTICES.txt` listing only the npm packages actually in the bundle, with each licence in full. It's linked from the Credits sheet.
- **28. Old WebViews.** On WebView/Chrome below 111 (or Safari below 16.4), a picture-only "please update" screen shows instead of a blank page. Verified on the API 30 emulator (WebView 83).

## NICE
- **29. DOM node creep.** It's smaller, but not gone:
  - In the 10-minute soak, nodes went 107 → 352 (0.12.9: 91 → 373) and the heap 4.0 → 11.0 MB (0.12.9: 7.8 → 14.8).
  - Growth slows each cycle. Layout objects stay flat (57–59) and listeners stay flat (184).
  - A heap snapshot after 3 cycles shows no detached DOM trees, so the growth is in non-layout nodes held by caches.
  - Not a blocker. A real-device memory check during the closed test is still worth doing.
- **30. Double-tap race.** One game start per menu visit: a second tile tap during the zoom-in is ignored. In 20/20 pairs the first tile wins (`race.json`).
- **31. Piano first-tap long frame.** A silent pre-warm note at voice setup brought the max frame from 283 to 233 ms (844x390, 4x CPU).
- **32. Stars DPR cap.** Not done on purpose: the house rule is full DPR.
- **33. THREE.Clock warning.** This comes from inside @react-three/fiber. It goes away when R3F moves to `THREE.Timer`. `PCFSoftShadowMap` is gone, because shadows are off.
- **34 and 35** (panel icon tint, song list): left as they were.

## Verification (desktop Chrome, swiftshader, DPR 3, 4x CPU)
- **Screens:** 36 loads × 2 (with and without the panel) at 844x390, 915x412, 1000x450 (plain, left cut-out and right cut-out) and 1280x800. Console: warnings only ("THREE.Clock", "KHR_parallel_shader_compile"). Compare sheets are in `review_shots/release_1/compare/`.
- **Fast switching** (`race.json`): 20 double-tap pairs and 5 quick in/out rounds per game. Every time it ended with 1 mode, 1 AudioContext, ≤1 music loop and 0 errors.
- **Perf, main-thread busy, 844x390 before → after:**
  - menu 0.14 → 0.12
  - Balloon Pop 0.21 → 0.20
  - Colouring 0.08 → 0.04
  - Piano idle 0.08 → 0.05
  - Piano tapping 4×/s 0.34 → 0.32
  - train 0.07 → 0.06
  - Stars 0.20 → 0.17
  - The menu at 1280x800 went from 4.9 to 59 fps.
  - The train still shows a low fps in swiftshader with only ~6% main-thread busy (raster-bound on 2 full-DPR canvases, the same as 0.12.9).
- **Old WebView:** checked on the API 30 emulator (WebView 83). Back was swallowed there.
- **10-minute soak** (`soak_loudness.json`): 17 mode visits through the menu tiles with play in each.
  - 0 errors, always 1 AudioContext and 1 GL context, at most 1 music loop.
  - 0 intervals and 0 pending timeouts at the menu.
- **Not met:** Piano with 4 taps a second is 32% main-thread busy at 4x CPU, over the 25% house budget (it was 34%). Normal tapping is well under. Everything else is under 25%.

---

# 1.0.1 (versionCode 12): the Shooting Stars freeze

**What happened on a real phone (1.0.0):** opening Shooting Stars froze the game. Going back to the menu still worked, but every other game stayed frozen afterwards.

**Root cause** (confirmed on an Android 11 emulator's WebView with a test page; the full app wasn't run there):
1. In the Android app, a game track that hadn't been decoded yet started by streaming the file through an `<audio>` element. Träumerei, the Shooting Stars track, is the longest file (195 s), so it streams the longest.
2. When a WebView `<audio>` element plays, Chromium requests Android audio focus for it (`AudioFocusDelegate`). The app's own `MainActivity` listener then gets `AUDIOFOCUS_LOSS` (−1, permanent).
3. From 0.12.7, the wrapper answered any focus loss with `__pipLifecycle.pause()`, the same "app in the background" pause as `onPause`. That suspends the sound and stands **every** game loop still (sim step, stars, pots, colouring, piano song).
4. A permanent loss never hands the focus back while the app stays in front, so the pause was never lifted. The menu UI still worked, but every game stayed frozen until the app went to the background and came back.

On the emulator, the logs showed `requestAudioFocus … org.chromium.content.browser.AudioFocusDelegate`, then `onAudioFocusChange -1 resumed=true`, then `pause`.

**Fix:**
- **Wrapper:** audio focus now only affects sound. A loss calls `__pipLifecycle.audioOff()` (sound suspended, games keep running) and a gain calls `audioOn()`. `onResume` brings both the games and the sound back.
- **Web app, Android only:**
  - No more `<audio>` streaming inside the Android app.
  - Every track now has a 12 s intro segment, sample-aligned with the full file and decoded in a blink, so the music still starts at once. The full loop takes over at the same sample.
- **Safety nets:**
  - A touch on a visible page clears any stale "native"/"freeze" pause.
  - Only the current track and the menu loop stay decoded. Träumerei alone is about 70 MB of PCM, so this cuts memory on phones.
  - A game that fails to start, or a game screen that throws, goes back to the menu.
  - A failed sim step can't stop the loop.

---

# 1.0.2 (versionCode 13): Pip launcher icon, Bach for Colouring

**Launcher icon** (replaces the placeholder heart and star):
- Pip with two balloons and a sparkle, painted with the app's own master Pip (`window.__housePip`) in the same layout as the store icon (`play_store/icon_512.png`). Scripts: `review/android/release-1/icon/icon.mjs` (paints the layers) and `layers.py` (cuts every size).
- Adaptive icon (`mipmap-anydpi-v26`): a background layer (sky, hill, flowers, two small sparkles) and a foreground layer (Pip, balloons, top sparkle). The whole foreground group sits inside a 65.4 dp circle, within the 66 dp safe zone, so circle, squircle, rounded-square and teardrop masks never clip ears, crest or balloons.
- Monochrome layer for Android 13+ themed icons: navy outlines solid, fills at about 40 % alpha.
- Legacy `ic_launcher` (rounded square) and `ic_launcher_round` for Android 7.x. All five densities, mdpi to xxxhdpi.
- The old `drawable/ic_launcher_foreground.xml` and the `ic_launcher_background` colour are removed.
- Previews: `review/android/release-1/icon/masks.png`, `themed_and_legacy.png`, `safe_zone.png`, `home_size.png`.

**Colouring music:** J.S. Bach, Prelude No. 1 in C major, BWV 846, performed by Kimiko Ishizaka (Open Well-Tempered Clavier, CC0).
- Cut from 1.39 s to 155.1 s of the recording. The final chord's 2.2 s ring-out is laid over the opening, so the loop is seamless: the wrap step is 0.0012, against a typical sample step of 0.02. The loop is 153.71 s (6,778,612 samples).
- Loudness-matched to −20 LUFS integrated (peak −3.8 dBFS), the same as the other four tracks, and played at level 0.14 like the game tracks. Ogg Vorbis, 160 kb/s.
- `prelude-intro.ogg` is the first 12 s of the same loop, so it starts instantly in the Android app with no `<audio>` streaming (the 1.0.1 freeze fix still applies).
- The soft synth pad that Colouring used before is gone, along with all its code (`startMusic`/`stopMusic`, the pad chords and the pad background restart). The house rule stays: no recorder or flute music.
- The Credits sheet and `CREDITS.txt` are updated, and the prelude is prefetched with the other game tracks.

**Name:** still Pip's Pots everywhere. A rename is waiting for the final name. The app name on the Credits sheet is now one constant (`APP_NAME` in `credits.ts`), and its comment lists the other places a rename touches: the spa.html title, `__root.tsx`, `og/site.json`, `CREDITS.txt`, the notices and the Android `app_name`.

**Checks (1.0.2 build):**
- **Stars first, then menu, then every game** (Android WebView user agent, apk build, DPR 2.625):
  - Each screen plays only its own loop: Stars Träumerei 195.7 s, Balloon Pop 60 s, Colouring prelude 153.7 s, Piano none, sorting 46.8 s, menu 96.6 s.
  - Always 1 AudioContext, 0 media elements played, never paused, no errors.
- **Audio focus** loss and gain in Stars: the game keeps moving, and a touch clears a native pause.
- **Background pause** (`bgtest`): all checks pass except "hidden during game start: nodesHidden ≤ 2". It found 4 (intro plus loop, all on the suspended context, silent). 1.0.1 fails the same check the same way, so it is the test's old threshold from before the intros, not a regression.
- **Fast switching** (`race.mjs`): 25 cases, never two loops, one context, no errors.
- **Perf**, 4x CPU, 844x390, A/B against 1.0.1 on the same machine, two runs each:
  - Colouring idle 0.06–0.07 vs 0.06–0.08; Colouring tapping 0.16–0.17 vs 0.14–0.15.
  - Stars 0.23 vs 0.21–0.22; menu the same.
  - The differences are within run-to-run noise, and everything stays under the 25 % budget except Piano 4 taps/s, as before.
- Signed with the same upload key (SHA-256 A5:60:CA:…:AE:9F, the same as 1.0.1).
