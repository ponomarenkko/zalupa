import db from "../models/index.js";

const Card = db.sequelize.models.card;
const User = db.sequelize.models.user;

class Player {
    static STARTING_HP = 30;
    static STARTING_MANA = 0;
    static MAX_MANA = 10;
    static MAX_HAND_SIZE = 7;
    static MAX_BOARD_SIZE = 5;

    constructor(user, opponentSocket) {
        this.socket = user.socket;
        this.userID = user.id;
        this.oppSocket = opponentSocket;

        this.nickname = '';
        this.avatar = null;

        this.deck = [];
        this.hand = [];
        this.board = [];

        this.hp = Player.STARTING_HP;
        this.maxMana = Player.STARTING_MANA;
        this.currentMana = Player.STARTING_MANA;
        this.fatigueCounter = 0;
    }

    /**
     * Initialize player with user data and card deck.
     */
    async init() {
        try {
            const userData = await User.findByPk(this.userID);
            this.nickname = userData.nickname;
            this.avatar = userData.avatar
                ? Buffer.from(userData.avatar, "binary").toString("base64")
                : null;

            await this.#initializeDeck();
        } catch (err) {
            console.error("Failed to initialize player:", err);
        }
    }

    /**
     * Restore mana at the start of the turn.
     */
    replenishMana() {
        if (this.maxMana < Player.MAX_MANA) {
            this.maxMana++;
        }
        this.currentMana = this.maxMana;

        this.socket.emit("replenishMana", this.maxMana);
    }

    /**
     * Reduce player's health points and notify both sides.
     */
    reduceHp(amount) {
        this.hp -= amount;
        this.socket.emit("updatePlayerHp", this.hp);
        this.oppSocket.emit("updateOppHp", this.hp);
    }

    /**
     * Apply fatigue damage when no cards are left in the deck.
     */
    #applyFatigue() {
        this.fatigueCounter++;
        this.reduceHp(this.fatigueCounter);
        this.socket.emit(
            "warning",
            `No cards left in deck — you take ${this.fatigueCounter} fatigue damage!`
        );
    }

    /**
     * Draw one card from the deck.
     * Returns the card drawn or null.
     */
    drawCard() {
        if (this.deck.length === 0) {
            this.#applyFatigue();
            return null;
        }

        if (this.hand.length >= Player.MAX_HAND_SIZE) {
            this.deck.pop(); // discard the card
            this.socket.emit(
                "warning",
                `Hand limit reached (${Player.MAX_HAND_SIZE}). The card was discarded.`
            );
            return null;
        }

        const card = this.deck.pop();
        this.hand.push(card);
        return card;
    }

    /**
     * Check if a card is active and can act.
     */
    checkCardIsActive(cardId) {
        const card = this.board.find(c => c.id === cardId);

        if (!card?.isActive) {
            this.socket.emit("warning", "Cards can only attack once per turn!");
            return false;
        }

        return true;
    }

    /**
     * Reset board card activity at the start of turn.
     */
    setBoardCardsActive() {
        this.board.forEach(card => {
            card.isActive = true;
        });
    }

    /**
     * Move a card from hand to the board, if valid.
     */
    moveCardToBoard(cardId) {
        const handIndex = this.hand.findIndex(c => c.id === cardId);
        const card = this.hand[handIndex];

        if (!card) return false;

        if (this.board.length >= Player.MAX_BOARD_SIZE) {
            this.socket.emit(
                "warning",
                `You can have a maximum of ${Player.MAX_BOARD_SIZE} cards on the board.`
            );
            return false;
        }

        if (card.cost > this.currentMana) {
            this.socket.emit("warning", "Not enough mana to play this card.");
            return false;
        }

        this.hand.splice(handIndex, 1);
        this.board.push(card);
        this.currentMana -= card.cost;

        return true;
    }

    /**
     * Apply damage to a card on the board.
     * If its defense reaches 0, remove it.
     */
    attackCardOnBoard(cardId, incomingAttack) {
        const cardIndex = this.board.findIndex(c => c.id === cardId);
        const card = this.board[cardIndex];

        if (!card) return;

        card.defense_points -= incomingAttack;

        if (card.defense_points <= 0) {
            this.board.splice(cardIndex, 1);
        }
    }

    /**
     * Create and shuffle the player’s deck.
     */
    async #initializeDeck() {
        const baseCards = await Card.findAll({
            attributes: { exclude: ["id", "created_at", "updated_at"] },
        });

        this.deck = baseCards.map((card, index) => {
            const cardData = {
                ...card.dataValues,
                id: index,
                isActive: false,
            };
            return cardData;
        });

        // Shuffle the deck
        this.deck.sort(() => Math.random() - 0.5);
    }
}

export default Player;
