<div align="center">

<img src="images/og-image.png" alt="Pannaball" width="100%">

**A fast, top-down arcade football game that runs in the browser.**<br>
Play 1v1, 2v2 or 3v3 against bots, with your own bot teammates.

<a href="https://vuxenn1.github.io/pannaball/"><img src="https://img.shields.io/badge/PLAY%20NOW-22e6ff?style=for-the-badge&logoColor=060a1a&labelColor=060a1a" alt="Play now" height="40"></a>

![HTML5](https://img.shields.io/badge/HTML5-060a1a?style=flat-square&logo=html5&logoColor=ff8a1f)
![JavaScript](https://img.shields.io/badge/JavaScript-060a1a?style=flat-square&logo=javascript&logoColor=ffe14f)
![No dependencies](https://img.shields.io/badge/dependencies-none-060a1a?style=flat-square&labelColor=060a1a&color=a24bff)
![License: MIT](https://img.shields.io/badge/license-MIT-060a1a?style=flat-square&labelColor=060a1a&color=22e6ff)

</div>

## Screenshots

<img src="images/screenshot-match.png" alt="A 3v3 match in progress" width="100%">

<img src="images/screenshot-menu.png" alt="Main menu with modes and settings" width="100%">

## Features

- Three modes: 1v1, 2v2 and 3v3, each with its own pitch size
- Bot teammates and opponents with easy, medium and hard difficulty
- Bots take roles (chaser, keeper, support), pass, and pick open corners when shooting
- Match length of 2, 3 or 5 minutes, with an optional goal limit
- Golden goal overtime when the match ends in a draw
- Boost with a stamina bar (steady and flicker-free for all bots and players)
- Full mobile phone & touch support with virtual joystick and action buttons
- Match stats at full time: scorers, shots and possession
- English and Turkish language options

## Controls

### Desktop
| Key / Input | Action |
| --- | --- |
| WASD / Arrow keys / Mouse | Move (keyboard or fluid mouse-follow) |
| Left click | Shoot toward the mouse |
| Shift | Boost (consumes stamina) |
| Esc | Pause |
| 1 / 2 / 3 | Start a mode from the menu |
| Enter | Play again after a match |

### Mobile (Touch)
| Touch Control | Action |
| --- | --- |
| Virtual Joystick (Left) | 360° Movement & aiming |
| Shoot Button (Right) | Shoot toward current movement / aim |
| Boost Button (Right) | Boost sprint (consumes stamina) |
| Pause Button (Top-Right) | Pause match |

> **Note on Bot Stamina**: Bot stamina bars are rendered continuously with steady opacity and position, completely resolving any previous flickering or threshold oscillations during bot boost sprints.

## Changelog

### v2.1 — mobile support & stamina flickering fix
- **Mobile phone support**: Added dedicated touch controls including an intuitive virtual joystick on the left for fluid 360° movement and aiming, responsive Shoot and Boost action buttons on the right, and an on-screen pause button. Touch controls automatically show on touch-enabled devices and stay hidden on desktop.
- **Responsive mobile viewport**: Enhanced scaling, safe-area padding, and strict `touch-action: none` rules to prevent unwanted gestures, zooming, or page scrolling on mobile browsers.
- **Bot stamina flickering fixed**: Added sprint hysteresis to bot decision logic and stabilized stamina ring rendering for all bots (teammates and opponents), eliminating rapid on/off flickering.
- **Restored keyboard controls**: Reintroduced WASD and Arrow keys alongside mouse-follow so players can choose keyboard, mouse, or hybrid controls.

### v2 — vertical + mouse control
- **Vertical format (portrait)**: Pitch layout converted to portrait format (9:16 aspect ratio) with responsive scaling, goals positioned top and bottom, and rebalanced pitch physics.
- **Mouse-only movement**: Completely removed WASD/Arrow keys in favor of fluid mouse-follow steering with smooth deceleration near cursor and strict pitch boundary clamping.
- **Boost & stamina meter**: Shift sprint revamped into an agile 1.8x boost with integrated HUD stamina bar and on-player visual glow effects.

## Run locally

No build step or install needed. Download the project and open `index.html` in a browser.

## Built with

Plain HTML, CSS and JavaScript, drawn on a canvas. No libraries.

## License

[MIT](LICENSE)
