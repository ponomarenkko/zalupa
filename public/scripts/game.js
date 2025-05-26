const socket = io();

import Game from "./game/Game.js";
new Game(socket);
