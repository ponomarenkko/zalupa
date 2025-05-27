import Card from "./Card.js";
import Board from "./Board.js";
import HiddenCard from "./HiddenCard.js";

class Game {

    static AVATAR_PLACEHOLDER_PATH = "assets/avatar_placeholder.png"
    constructor(socket) {

        this.socket = socket;
        this.field = null;
        
        this.timerId = null;
        
        this.setGameEvents();
        this.setBtnEvents();
        this.init();

    }

    setGameEvents() {

        this.socket.on('initPlayersData', (playersData) => {
            playersData = JSON.parse(playersData);
            
            let playerHTMLEl = this.displayPlayer(playersData.player, true);
            let opponentHTMLEl = this.displayPlayer(playersData.opponent, false);

            this.field = new Board({...playersData.player, socket: this.socket}, playerHTMLEl, opponentHTMLEl);

            this.renderDeckCardsFor("player");
            this.renderDeckCardsFor("opponent");

            this.field.player.hand = [];
            this.updateCards(playersData.player.hand);
            this.updateOpponentCards(playersData.opponent.handLength);
        })

        this.socket.on('oppMoveCardToBoard', (oppCard) => {
            this.field.addOpponentCard(oppCard);
        });

        this.socket.on('attackCard', (target, attacker) => {

            let targetCard = this.field.findCardById(target.id, true);
            let attackerCard = this.field.findCardById(attacker.id, false);

            if (target.defense_points <= 0) {
                this.field.removeCard(targetCard, true);
            } else {
                targetCard.updateCardData(target);
            }
            
            if (attacker.defense_points <= 0) {
                this.field.removeCard(attackerCard, false);
            } else {
                attackerCard.updateCardData(attacker);
            }

        });

        this.socket.on('updateCards', (newCard) => {
            this.updateCards(newCard);
        });

        this.socket.on('updateOppCards', (numOfNewCards) => {
            this.updateOpponentCards(numOfNewCards);
        });

        this.socket.on('updatePlayerHp', (userHp) => {
            this.field.player.health = userHp;
            this.field.playerHTMLEl.health.textContent = userHp;
        });

        this.socket.on('updateOppHp', (oppHp) => {
            this.field.opponentHTMLEl.health.textContent = oppHp;
        });
        
        this.socket.on('replenishMana', (mana) => {
            this.field.player.mana = mana;
            this.field.updateMana(true);
        });

        this.socket.on('warning', (msg) => {
            
            let overlay = document.querySelector(".overlay");
            let overlayHeading = document.querySelector(".overlay .overlay-heading");
            let overlayText = document.querySelector(".overlay .overlay-text");
            overlay.hidden = false;
            overlayHeading.textContent = "Warning";
            overlayText.textContent = msg;
            
            const hideOverlay = () => {
                overlay.hidden = true;
                overlayHeading.textContent = "";
                overlayText.textContent = "";
                overlay.removeEventListener("click", hideOverlay);
                clearTimeout(hideOverlay);
            }

            overlay.addEventListener("click", hideOverlay);
            setTimeout(hideOverlay, 2000);

        });

        this.socket.on('turn', (board) => {
            this.setPlayerTurn();
        });

        this.socket.on('oppTurn', () => {
            this.setOppTurn();
        });

        this.socket.on('gameOver', (isWinner) => {
            const url = new URL(window.location.href);
            
            var gameover = document.querySelector(".overlay");
            gameover.hidden = false;
            document.querySelector(".overlay .overlay-heading").textContent = "Game over";
            
            if (isWinner) {
                console.log('winner');
                document.querySelector(".overlay .overlay-text").textContent = "You win";
            }
            else {
                console.log('loser');
                document.querySelector(".overlay .overlay-text").textContent = "You lose";
            }
            document.querySelector(".overlay").addEventListener("click", () => {
                window.location.href = `/${url.search}`;
            });

            this.socket.emit('gameOver', {id: url.searchParams.get('id')});
        });

    }

    setPlayerTurn() {

        this.field.player.turn = true;
        const btn = document.querySelector(".turn-submit-btn");
        btn.disabled = false;
        let count = 30;
        const timerText = document.querySelector(".turn-time > .turn-timer");
        this.timerId = setInterval(() => {
            let countText = count < 10 ? `0${count}` : `${count}`;
            if (count <= 0) {
                clearInterval(this.timerId);
                this.socket.emit('turnEnd');
            }
            timerText.textContent = `00:${countText}`;
            count--;
        }, 1000);
        this.field.clearChosenCards();   
        this.field.setAvailableCards();    

    }

    setOppTurn() {

        this.field.player.turn = false;
        const timerText = document.querySelector(".turn-time > .turn-timer");
        timerText.textContent = `Opponent's turn`;
        clearTimeout(this.timerId);
        const btn = document.querySelector(".turn-submit-btn");
        btn.disabled = true;
        this.field.clearChosenCards();

    }

    setBtnEvents() {

        const turnBtn = document.querySelector(".turn-submit-btn");
        turnBtn.addEventListener("click", () => {
            this.socket.emit("turnEnd");
        });

        const giveupBtn = document.querySelector(".giveup-btn");
        giveupBtn.addEventListener("click", () => this.socket.emit("giveUp"));

    }

    updateCards(cards) {

        cards.forEach(card => {
            let newCard = new Card(card, this.field, false);
            this.field.player.hand.push(newCard);
            newCard.render(".player-container .card-container");
        });
        
    }
    
    updateOpponentCards(cardCount) {
        
        for (let i = 0; i < cardCount; ++i) {
            new HiddenCard(
                "enemy-card",
                ".opponent-container .card-container"
            );
        }

    }

    renderDeckCardsFor(playerClass) {
        
        let cardClass = `${playerClass}-deck-card`;
        let card = new HiddenCard(
            cardClass,
            `.turn-container .${playerClass}-deck`
        );
        card.setDeckCardEvent(this.socket, `${playerClass}DeckSize`);

    }

    displayPlayer(player, isCurrent) {

        let containClass = isCurrent ? ".player" : ".opponent";
        const container = document.querySelector(`${containClass}-container .inner`);
        const template = document.getElementById("player-template");

        let playerClone = template.content.firstElementChild.cloneNode(true);
        playerClone.setAttribute("id", `player-${player.id}`);
        container.appendChild(playerClone);

        let health = document.querySelector(`#player-${player.id} .player-health`);
        health.textContent = player.health;

        let nickname = document.querySelector(`#player-${player.id} .player-nickname`);
        nickname.textContent = player.nickname;

        let img = document.querySelector(`#player-${player.id} .player-avatar > img`);
        if (player.avatar)
            img.src = `data:image/jpeg;base64,${player.avatar}`;
        else
            img.src = Game.AVATAR_PLACEHOLDER_PATH;

        return { template: playerClone, health: health, avatar: document.querySelector(`#player-${player.id} .player-avatar`) };

    }

    init() {

        const url = new URL(window.location.href);
        const playerId = url.searchParams.get('id');
        this.socket.emit('initGame', {id: playerId});

    }

}

export default Game;
