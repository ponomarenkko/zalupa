import Game from "./game/Game.js";
import Player from "./game/Player.js";
import db from "./models/index.js";

const User = db.sequelize.models.user;

// Queue for players waiting for a match
let waitingQueue = [];

// Active player pairs [player1Id, player2Id, initializedUserObject]
let activePairs = [];

/**
 * Finds the socket ID associated with a user ID.
 * @param {Map} sockets - Collection of all active sockets.
 * @param {string} userId - User's unique ID.
 * @returns {string|null} - Socket ID or null if not found.
 */
function extractSocketId(sockets, userId) {
    for (const [_, socket] of sockets) {
        const refererUrl = socket.handshake.headers.referer;
        const queryStart = refererUrl.indexOf('?');

        if (queryStart !== -1) {
            const queryString = refererUrl.slice(queryStart + 1);
            const params = Object.fromEntries(
                queryString.split('&').map(part => part.split('='))
            );

            if (params.id === userId) {
                return socket.id;
            }
        }
    }
    return null;
}

/**
 * Retrieves the ID of the opponent in a pair.
 * @param {string} userId - User's ID.
 * @returns {string|null} - Opponent's ID or null.
 */
function getOpponentId(userId) {
    const match = getPair(userId);
    return match ? (match[0] === userId ? match[1] : match[0]) : null;
}

/**
 * Finds a pair of users that includes the given ID.
 * @param {string} userId
 * @returns {Array|null}
 */
function getPair(userId) {
    return activePairs.find(([a, b]) => a === userId || b === userId);
}

/**
 * Fetches user and opponent data from the database.
 * @param {string} userId
 * @returns {Promise<Object>} - Object containing both users' info.
 */
async function fetchUserInfo(userId) {
    const opponentId = getOpponentId(userId);

    const [user, opponent] = await Promise.all([
        User.findOne({ where: { id: userId } }).catch(console.error),
        User.findOne({ where: { id: opponentId } }).catch(console.error)
    ]);

    return {
        id: userId,
        nickname: user?.nickname,
        oppId: opponentId,
        oppNickname: opponent?.nickname
    };
}

/**
 * Initializes a game instance between two players.
 * @param {Object} playerData1 - First player's data and socket.
 * @param {Object} playerData2 - Second player's data and socket.
 * @returns {Promise<Game>} - Game instance.
 */
async function setupGame(playerData1, playerData2) {
    const p1 = new Player(playerData1, playerData2.socket);
    const p2 = new Player(playerData2, playerData1.socket);

    await Promise.all([p1.init(), p2.init()]);

    return new Game(p1, p2);
}

/**
 * Main export function that attaches event handlers to a socket.
 * @param {Socket} socket - Current socket connection.
 */
export default function (socket) {
    const io = this;
    console.log(`User connected: ${socket.id}`);

    // Handle game start request
    socket.on('startGame', (data) => {
        if (waitingQueue.length > 0) {
            const opponentId = waitingQueue.shift();
            activePairs.push([data.id, opponentId, null]);

            const socketA = extractSocketId(io.of('/').sockets, data.id);
            const socketB = extractSocketId(io.of('/').sockets, opponentId);

            io.to(socketA).emit('startGame');
            io.to(socketB).emit('startGame');
        } else {
            waitingQueue.push(data.id);
            const socketId = extractSocketId(io.of('/').sockets, data.id);
            io.to(socketId).emit('waiting');
        }
    });

    // Handle game initialization once both players are ready
    socket.on('initGame', (data) => {
        fetchUserInfo(data.id)
            .then(user => {
                const match = getPair(data.id);
                if (match) {
                    if (match[2]) {
                        user.socket = socket;
                        return setupGame(user, match[2]);
                    } else {
                        user.socket = socket;
                        match[2] = user;
                    }
                }
            })
            .catch(console.error);
    });

    // Handle game end by removing the pair from active matches
    socket.on('gameOver', (data) => {
        activePairs = activePairs.filter(([a, b]) => a !== data.id && b !== data.id);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
}

