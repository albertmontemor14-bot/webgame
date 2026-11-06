# Calculus Adventure: The Math Kingdom

A pixel-style web adventure game. Walk the overworld map, enter castles, and fight zombie swarms with a sword and a pistol.

## Play it

- **On your computer:** open `index.html` in your browser.
- **On GitHub Pages:** Settings -> Pages -> branch `main`, folder `/ (root)`.

## Controls

| Action | Keyboard | Phone |
| --- | --- | --- |
| Walk (map) | Arrows or WASD | arrow buttons |
| Move (castle) | A / D or arrows | left / right buttons |
| Jump | W, Up arrow, or Space | Jump button |
| Sword | J or X | Sword button |
| Pistol | K or Z, or click the screen | Gun button |
| Reload | R | (auto when empty) |
| Talk / open chest / shop | E | Act button |

## Files (all in the repo root, no folders)

```
index.html        title screen
game.html         the game (loading screen, map, castles)
home.css          title screen styles
game.css          game styles
game.js           map, castles, zombies, pistol, health, loading
sound.js          sound effects (Web Audio API)
music.js          music player
overworld-day.mp3 map music
terraria-theme.mp3 title and castle music
```

## Notes

- The music belongs to its original creators. Check you have the right to share it before making the repository public.

## v3 features

- **Coins:** zombies, chests, friendly villagers and castle clears give coins (saved in your browser).
- **Upgrade shop:** talk to the blacksmith (gold coin above his head). Upgrade hearts, armor, boots, sword, pistol power, magazine and reload speed (5 levels each).
- **Chests and villagers:** press E next to them.
- **Frozen Tundra:** a second map with a snow biome, pine trees and two ice castles. Clear the 3 first castles, then walk into the purple portal at the east end of the road.
- **Boss:** the Castle of Infinity ends with Lord Infinity, who lunges and summons zombies.
