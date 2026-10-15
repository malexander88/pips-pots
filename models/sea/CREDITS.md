# Sea models

No CC0 glTF files were downloaded. The build environment could not be relied on to fetch Poly Pizza, Kenney or ambientCG assets, so every reef row is the procedural fallback described in the fish spec. Nothing here is a bare sphere standing in for a creature: spheres are used only where the spec names them (urchin body, octopus head, bubbles, eyes, motes).

| Item | Source | Licence |
|---|---|---|
| Water, sand, kelp, coral, fans, anemones, seagrass, starfish, crab, clams, urchins, seahorse, turtle, jellyfish, schools, octopus, wreck, chest, shells, whale, motes, bubbles, far cards, foreground cards | Procedural geometry in `src/game/sea/Reef.tsx` | Original, made for this game |
| Caustic field | Generated at startup into a 512² `DataTexture` (Voronoi) | Original |
| God-ray gradient | Generated canvas texture in `src/game/sea/caustics.ts` | Original |
| Play fish | Procedural chunky lathe body, forked tail, fins and a separate cartoon face in `src/game/sea/fishMesh.ts` and `FishFace.tsx` | Original |
| Whale | Procedural rounded body, belly, eye, smile and fins in `src/game/sea/Reef.tsx`. Quaternius Cute Series Animals could not be downloaded in this environment. | Original |
| Treasure chest | Procedural rounded box, plank texture, gold bands and lock in `src/game/sea/Reef.tsx`. No CC0 glTF was fetched. | Original |

Quaternius, MiniPoly, Kenney, ambientCG and Poly Haven were the preferred CC0 sources. They were not bundled. If those files are added later, list the file name, source URL and licence in this table and keep the total under 6 MB.
