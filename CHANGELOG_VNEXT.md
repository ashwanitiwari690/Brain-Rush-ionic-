# Brain Rush - Daily Challenge & Score Economy Update

## Included changes
- Daily challenge target is now **60,000 points**.
- Daily challenge completion reward is **30 coins**, credited only once after the target is completed.
- Home and Daily Challenge progress bars use the live 60,000-point target.
- Removed the Home coin-rules section and the Daily Challenge coin-guide section to reduce UI clutter.
- Reward-video cooldown now displays only the remaining time, with no "AVAILABLE IN" label.
- Reward-video flow remains **100 coins every 2 hours** in the current offline/demo implementation.
- Reduced gameplay score values so points accumulate more slowly and predictably.
- Level-completion coin rewards remain first-completion-only and are issued centrally by `GameService`.
- Kept the existing 10-level progression and increasing difficulty across all six game modes.
- Removed unused translation keys belonging to deleted coin-guide UI.
- Minor mobile UI/CSS cleanup for the reward section.

## Verification
- TypeScript syntax validation: PASS.
- Home/Daily HTML structural validation: PASS.
- Full Angular `ng build`: could not be executed in this isolated environment because npm dependencies were unavailable and npm registry DNS resolution was unavailable.
