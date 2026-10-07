# Admin Studio and Game Windows

## Goal
Make the admin studio the authoritative place for ship and rocket presentation, restore the island/ocean worlds, and polish the settings and tribe windows without changing the seven dock destinations.

## What will change

### 1. Functional admin studio
- Show every store ship and every rocket in searchable catalog lists.
- Let an admin select an item, edit its store name, description, price, currency, and gameplay values already used by the game.
- Add pose slots for ships and rockets, with transparent-image upload, live preview, replacement, and deletion.
- Add visual positioning controls per pose: scale, horizontal/vertical offset, and rotation, with an in-studio preview.
- Save published item settings and pose records to the database under admin-only write rules.
- Make the store, ship market, and live sea fleet read the published records and fall back safely to repository defaults when no override exists.

### 2. Image ownership and backgrounds
- Remove scene links that point at another project and use this project’s existing scene asset pointers directly.
- Verify day/night videos and poster images for every store background.
- Keep bundled default art in the repository asset flow; admin-uploaded replacement art remains in managed game storage so it can be changed without a code release.

### 3. Settings window
- Remove the floating sound button above the top bar.
- Keep sound on/off inside settings and connect it to the same real mute behavior.
- Recompose the player window with a clear captain identity area, polished setting rows, and admin-studio entry only for admins.

### 4. Tribe window
- Keep the tribe destination in the bottom dock and display it as a polished in-game window over the sea.
- Improve hierarchy for current tribe, creation/joining, members, and rankings while preserving the existing real tribe actions and honest empty states.

## Technical details
- Add a catalog-override table with public read access and admin-only insert/update/delete policies; include explicit grants and service access.
- Extend artwork records with stable item IDs and transform metadata, and keep all storage writes restricted to admins.
- Use the existing separated role table and server-validated database policies; no client-side admin trust.
- Keep all leaf-page metadata complete and verify the final preview at desktop and phone dimensions.

## Validation
- Confirm an admin can upload and publish a ship/rocket pose and that it appears in the relevant game/store view.
- Confirm price and presentation edits survive refresh.
- Confirm all world posters/videos load without requests to the old project.
- Confirm sound is controlled from settings only, and both settings and tribe open correctly over the sea.