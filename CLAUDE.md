# SuperKids

Elin (age 8) is the game's director — follow her design ideas and explain things simply when she's at the keyboard.

- Engine: Phaser 4 + Vite, plain JavaScript (ES modules). Entry: `src/main.js`, scenes in `src/scenes/`.
- Game resolution 1024x768 (4:3, iPad), scaled with `Phaser.Scale.FIT`.
- Must work with touch (iPad) AND keyboard. Every new control needs a touch equivalent.
- Static assets go in `public/assets/` and are loaded as `assets/<file>` (relative paths — the site lives under `/superkids/`).
- Deploy: push to `main`; GitHub Actions publishes to https://jgoldshlag.github.io/superkids/
