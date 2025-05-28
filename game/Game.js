import db from "../models/index.js";
const Card = db.sequelize.models.card;

class Game {
    constructor(playerOne, playerTwo) {
        this.players = [playerOne, playerTwo];

        this.#setupEventHandlers();
        this.#initializeGame();
    }

    /**
     * Attach all necessary socket event listeners for both players.
     */
    #setupEventHandlers() {
        this.players.forEach((player, index) => {
            const opponent = this.players[(index + 1) % 2];

            // Allow player to check if a card is currently active
            player.socket.on("checkCardIsActive", (cardId) => {
                if (player.checkCardIsActive(cardId)) {
                    player.socket.emit("cardIsActive", cardId);
                }
            });

            // Handle card being moved from hand to board
            player.socket.on("moveCardToBoard", (cardId) => {
                if (player.moveCardToBoard(cardId)) {
                    player.socket.emit("moveCardToBoard", cardId);
                    opponent.socket.emit("oppMoveCardToBoard", player.board.at(-1));
                }
            });

            // Handle attacking an opponent's card
            player.socket.on("attackCard", (attackerId, targetId) => {
                const attacker = player.board.find(card => card.id === attackerId);
                const target = opponent.board.find(card => card.id === targetId);

                player.attackCardOnBoard(attackerId, target.attack_points);
                opponent.attackCardOnBoard(targetId, attacker.attack_points);
                attacker.isActive = false;

                player.socket.emit("attackCard", attacker, target);
                opponent.socket.emit("attackCard", target, attacker);
            });

            // Handle attacking opponent directly
            player.socket.on("attackOpponent", (attackerId) => {
                const attacker = player.board.find(card => card.id === attackerId);

                opponent.reduceHp(attacker.attack_points);

                opponent.socket.emit("updatePlayerHp", opponent.hp);
                player.oppSocket.emit("updateOppHp", opponent.hp);

                this.#checkGameOver();
            });

            // Card selection (for attack/target logic)
            player.socket.on("selectCard", (cardId, isTarget, attackerId) => {
                opponent.socket.emit("selectCard", cardId, isTarget, attackerId);
            });

            // Unselect previously selected card
            player.socket.on("unselectCard", (cardId) => {
                opponent.socket.emit("unselectCard", cardId);
            });

            // End of turn logic
            player.socket.on("turnEnd", () => {
                this.startTurn((index + 1) % 2);
            });

            // Report the size of the player's own deck
            player.socket.on("playerDeckSize", () => {
                player.socket.emit("playerDeckSize", player.cardDeck.length);
            });

            // Report the size of the opponent's deck
            player.socket.on("opponentDeckSize", () => {
                player.socket.emit("opponentDeckSize", opponent.cardDeck.length);
            });

            // Handle surrender/give up
            player.socket.on("giveUp", () => {
                player.socket.emit("gameOver", false);
                opponent.socket.emit("gameOver", true);
            });
        });
    }

    /**
     * Start the initial state of the game, deal cards and notify players.
     */
    #initializeGame() {
        const firstPlayerIndex = Math.round(Math.random());
        this.#dealInitialCards(firstPlayerIndex);

        this.players.forEach((player, index) => {
            const opponent = this.players[(index + 1) % 2];

            player.socket.emit("initPlayersData", JSON.stringify({
                player: {
                    nickname: player.nickname,
                    hand: player.hand,
                    avatar: player.avatar,
                    health: player.hp,
                    mana: player.currMana
                },
                opponent: {
                    nickname: opponent.nickname,
                    handLength: opponent.hand.length,
                    avatar: opponent.avatar,
                    health: opponent.hp
                }
            }));
        });

        this.startTurn(firstPlayerIndex);
    }

    /**
     * Deal starting cards to both players.
     */
    #dealInitialCards(firstPlayerIndex) {
        const first = this.players[firstPlayerIndex];
        const second = this.players[(firstPlayerIndex + 1) % 2];

        for (let i = 0; i < 3; i++) first.drawCard();
        for (let i = 0; i < 4; i++) second.drawCard();
    }

    /**
     * Start a new turn for a player.
     */
    startTurn(playerIndex) {
        const current = this.players[playerIndex];
        const opponent = this.players[(playerIndex + 1) % 2];

        current.setBoardCardsActive();
        current.socket.emit("turn", current.board);
        opponent.socket.emit("oppTurn");

        this.drawCards(playerIndex, 1);
        current.replenishMana();
    }

    /**
     * Draw a number of cards for a player and inform both players.
     */
    drawCards(playerIndex, number) {
        const player = this.players[playerIndex];
        const opponent = this.players[(playerIndex + 1) % 2];

        for (let i = 0; i < number; i++) {
            const card = player.drawCard();
            if (card) {
                player.socket.emit("updateCards", [card]);
                opponent.socket.emit("updateOppCards", 1);
            }
        }

        this.#checkGameOver();
    }

    /**
     * Check whether either player's health has dropped to zero.
     */
    #checkGameOver() {
        if (this.players[0].hp <= 0) {
            this.#endGame(this.players[1], this.players[0]);
        } else if (this.players[1].hp <= 0) {
            this.#endGame(this.players[0], this.players[1]);
        }
    }

    /**
     * End the game and notify both players of the outcome.
     */
    #endGame(winner, loser) {
        winner.socket.emit("gameOver", true);
        loser.socket.emit("gameOver", false);
    }
}

export default Game;