<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all seven in-game dock destinations as windows over the sea, retaining their existing icon artwork; this preserves the game's navigation context.
- Render the captain portrait as a tall square beside two compact resource/identity rows; this keeps the captain visible at the stage's fixed aspect ratio.
- Keep unavailable inventory, commerce, battle, and ranking records as honest empty or disabled states until authoritative gameplay records exist; fabricated results would mislead players.

- Resolve live boat poses by catalog product ID, not lane ID, with custom pose then idle then bundled fallback; studio and sea must share keys.
- Broadcast artwork updates and renew signed image URLs; mounted sea and store views must not retain stale art.
- Use Nitro’s Vercel preset for external deployment; the Lovable harness retains its own managed target.
- Scope social windows to the fixed stage and shared HUD tokens; viewport-sized children must not overflow embedded windows.
