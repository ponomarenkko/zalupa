import db from "../models/index.js";

const Card = db.sequelize.models.card;

class Game {
    constructor(p1, p2) {
        this.players = [p1, p2];

        this.#setPlayersEvents();
        this.#startGame();
    }
    
    #setPlayersEvents() {
        this.players.forEach((player, idx) => {
            const opponent = this.players[(idx + 1) % 2];

            player.socket.on("checkCardIsActive", (cardId) => {
                if (player.checkCardIsActive(cardId))
                    player.socket.emit('cardIsActive', cardId);
            });

            player.socket.on('moveCardToBoard', (cardId) => {
                if (player.moveCardToBoard(cardId)) {
                    player.socket.emit('moveCardToBoard', cardId);
                    opponent.socket.emit('oppMoveCardToBoard', player.board[player.board.length - 1]);
                }
            });

            player.socket.on('attackCard', (attackerId, targetId) => {
                let attacker = player.board.find(elem => elem.id === attackerId);
                let target = opponent.board.find(elem => elem.id === targetId);

                player.attackCardOnBoard(attackerId, target.attack_points);
                opponent.attackCardOnBoard(targetId, attacker.attack_points);
                attacker.isActive = false;

                player.socket.emit('attackCard', attacker, target);
                opponent.socket.emit('attackCard', target, attacker);

                console.log('player.board');
                console.log(player.board);
                console.log('opponent.board');
                console.log(opponent.board);
            });

            player.socket.on('attackOpponent', (attackerId) => {
                let attacker = player.board.find(elem => elem.id === attackerId);

                opponent.reduceHp(attacker.attack_points);

                opponent.socket.emit('updatePlayerHp', opponent.hp);
                player.oppSocket.emit('updateOppHp', opponent.hp);

                this.checkGameOver();
            });

            player.socket.on('selectCard', (cardId, isTarget, attackerId) => {
                opponent.socket.emit('selectCard', cardId, isTarget, attackerId);
            });

            player.socket.on('unselectCard', (cardId) => {
                opponent.socket.emit('unselectCard', cardId);
            });
            
            player.socket.on('turnEnd', () => {
                this.startTurn((idx + 1) % 2);
            });

            player.socket.on('playerDeckSize', () => {
                let cardCount = player.cardDeck.length;
                player.socket.emit('playerDeckSize', cardCount);
            });

            player.socket.on('opponentDeckSize', () => {
                let cardCount = opponent.cardDeck.length;
                player.socket.emit('opponentDeckSize', cardCount);
            });

            player.socket.on('giveUp', () => {
                player.socket.emit('gameOver', false);
                opponent.socket.emit('gameOver', true);
            })
        });
    }

    #startGame() {
        let goesFirstIdx = Math.round(Math.random());

        this.#getStartCards(goesFirstIdx);

        this.players.forEach((player, idx) => {
            const opponent = this.players[(idx + 1) % 2];

            player.socket.emit('initPlayersData', JSON.stringify({
                "player": {nickname: player.nickname, hand: player.hand, avatar: player.avatar, health: player.hp, mana: player.currMana},
                "opponent": {nickname: opponent.nickname, handLength: opponent.hand.length, avatar: opponent.avatar, health: opponent.hp}
            }));
            
        });

        this.startTurn(goesFirstIdx);
    }

    getCardsToHand(playerIdx, numOfCards) {
        const player = this.players[playerIdx];
        const opponent = this.players[(playerIdx + 1) % 2];

        for (let i = 0; i < numOfCards; i++) {

            let card = player.drawCard();

            if (card) {
                player.socket.emit('updateCards', [card]);
                opponent.socket.emit('updateOppCards', [card].length);
            }
            this.checkGameOver();
        }
    }

    #getStartCards(goesFirstIdx) {
        const goesFirst = this.players[goesFirstIdx];
        const goesSecond = this.players[(goesFirstIdx + 1) % 2];
        
        for (let i = 0; i < 3; i++) {
            goesFirst.drawCard();
        }

        for (let i = 0; i < 4; i++) {
            goesSecond.drawCard();
        }
    }

    startTurn(playerIdx) {
        const player = this.players[playerIdx];
        const opponent = this.players[(playerIdx + 1) % 2];

        player.setBoardCardsActive();

        player.socket.emit('turn', player.board);
        opponent.socket.emit('oppTurn');
        
        this.getCardsToHand(playerIdx, 1);
        player.replenishMana();
    }

    checkGameOver() {
        if (this.players[0].hp <= 0) {
            this.gameOver(this.players[1], this.players[0]);
        }

        if (this.players[1].hp <= 0) {
            this.gameOver(this.players[0], this.players[1]);
        }
    }

    gameOver(winner, loser) {
        winner.socket.emit('gameOver', true);
        loser.socket.emit('gameOver', false);
    }
}

export default Game;
