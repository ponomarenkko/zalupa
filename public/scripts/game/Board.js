import Card from "./Card.js";

class Board {

    constructor(player, playerHTMLEl, opponentHTMLEl) {

        this.player = player;
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.cards = [];
        this.oppCards = [];
        this.playerHTMLEl = playerHTMLEl;
        this.opponentHTMLEl = opponentHTMLEl;
        this.updateMana(this.player.mana);
        this.setBoardEvents();
    
    }

    setBoardEvents() {

        this.player.socket.on('moveCardToBoard', (cardID) => {

            const cardContainer = document.querySelector(`.game-field .player-field`);
            let idx = this.player.hand.findIndex(elem => elem.cardData.id === cardID);
            const card = this.player.hand[idx];
            card.cardHTML.classList.add("played");
            card.cardHTML.classList.remove("available-card");
            card.cardHTML.addEventListener("click", () => {
                
                const attackClass = "attacker-card";
                if (card.cardHTML.classList.contains(attackClass)) {
                    card.cardHTML.classList.remove(attackClass);
                    card.cardHTML.classList.add("available-card");
                    this.clearAttacker();
                    return;
                }
                if (this.attackInProgress() || !this.player.turn)
                    return;

                this.player.socket.emit("checkCardIsActive", card.cardData.id);
    
            });
            
            cardContainer.appendChild(card.cardHTML);
            card.clearCardEvents();
            this.cards.push(card);
            this.player.mana -= card.cardData.cost;
            this.player.hand.splice(idx, 1);
            this.updateMana();

        });

        this.player.socket.on('cardIsActive', (cardId) => {
            const attackClass = "attacker-card";
            let card = this.findCardById(cardId, true);
            this.clearAttacker();
            this.selectedAttacker = card;
            card.cardHTML.classList.remove("available-card");
            card.cardHTML.classList.add(attackClass);
            this.player.socket.emit("selectCard", card.cardData.id, false);
        });

        this.player.socket.on('selectCard', (cardId, isTarget, attackerId) => {
            let obj = { cardHTML: this.playerHTMLEl.avatar };
            let card = cardId === -1 ? obj : this.findCardById(cardId, isTarget);

            if (isTarget) {
                let attacker = this.findCardById(attackerId, false);

                card.cardHTML.classList.add("target-card");

                setTimeout(() => {
                    attacker.cardHTML.classList.remove("attacker-card");
                    card.cardHTML.classList.remove("target-card");
                }, 3000);
            }
            else {
                card.cardHTML.classList.add("attacker-card");
            }
        });

        this.player.socket.on('unselectCard', (cardId) => {
            let card = this.findCardById(cardId, false);
            card.cardHTML.classList.remove("attacker-card");
        });

        this.opponentHTMLEl.template.addEventListener("click", () => {
            this.playerClick();
        });

    }

    findCardById(id, isYours) {

        let cardArr = isYours ? this.cards : this.oppCards;

        let card = cardArr.find((card) => {
            return card.cardData.id === id;
        });

        return card;

    }

    attackInProgress() {
        
        return this.selectedAttacker && this.selectedTarget;

    }

    clearAttacker(unselect = true) {
        
        if (!this.selectedAttacker) return;
        
        this.selectedAttacker.cardHTML.classList.remove("attacker-card");
        if (unselect)
            this.player.socket.emit("unselectCard", this.selectedAttacker.cardData.id);
        
        this.selectedAttacker = null;
        
    }
    
    clearTarget() {
        
        if (!this.selectedTarget) return;
        
        this.selectedTarget.cardHTML.classList.remove("target-card");
        this.selectedTarget = null;
    
    }

    clearAttack() {

        this.clearAttacker(false);
        this.clearTarget();

    }

    removeFromDOM (cardEl, seconds) {
    
        cardEl.style.transition = `all ${seconds}s ease`;
        cardEl.style.transform = `scale(0.8)`;
        cardEl.style.opacity = 0;
    
        setTimeout(() => {
            
            cardEl.remove();
        
        }, seconds * 1000);
    
    }

    removeCard(toRemove, isYours) {

        let filterCard = card => card.cardData.id !== toRemove.cardData.id;
        if (isYours) {
            this.cards = this.cards.filter(filterCard);
        } else {
            this.oppCards = this.oppCards.filter(filterCard);
        }
        this.removeFromDOM(toRemove.cardHTML, 0.6);

    }

    addOpponentCard(cardData) {

        let card = new Card(cardData, this, true);
        card.render(`.game-field .opponent-field`, true);
        card.fillCardData();
        card.cardHTML.classList.add("enemy-card", "played");

        card.cardHTML.addEventListener("click", () => {

            if (this.attackInProgress() || !this.player.turn)
                return;

            if (this.selectedAttacker) {
                this.selectedTarget = card;
                card.cardHTML.classList.add("target-card");
                this.player.socket.emit("selectCard", card.cardData.id, true, this.selectedAttacker.cardData.id);
                this.player.socket.emit("attackCard", this.selectedAttacker.cardData.id, this.selectedTarget.cardData.id);

                this.clearAttack();
            }

        });

        this.oppCards.push(card);

        const oppCards = document.querySelector(`.opponent-container .card-container`);
        oppCards.removeChild(oppCards.lastChild);

    }

    addPlayerCard(card) {
        
        this.player.socket.emit("moveCardToBoard", card.cardData.id);

    }

    updateMana(newTurn = false) {
        
        const manaCount = document.querySelector(".mana-count");
        let currentMana = this.player.mana;
        let allMana;
        if (newTurn) {
            allMana = this.player.mana;
        }
        else {
            if (manaCount.textContent) {
                allMana = manaCount.textContent.split('/')[1];
            }
            else {
                allMana = 0;
            }
        }
        manaCount.textContent = `${currentMana}/${allMana}`;
        const manaBar = document.querySelector(".mana-progress-bar");
        manaBar.style.width = `${currentMana * 10}%`;

        if (allMana !== 0) {
            this.setAvailableCardsInHand();
        }

    }
    
    setAvailableCardsInHand() {

        this.player.hand.forEach((card) => {
            if (card.cardData.cost <= this.player.mana) {
                card.cardHTML.classList.add("available-card");
            }
            else {
                card.cardHTML.classList.remove("available-card");
            }
        });

    }

    clearChosenCards() {

        this.cards.forEach((card) => {
            card.cardHTML.classList.remove("attacker-card");
            card.cardHTML.classList.remove("target-card");
            card.cardHTML.classList.remove("available-card");
        });

        this.oppCards.forEach((card) => {
            card.cardHTML.classList.remove("attacker-card");
            card.cardHTML.classList.remove("target-card");
        });

        this.playerHTMLEl.avatar.classList.remove("target-card");
        this.opponentHTMLEl.avatar.classList.remove("target-card");

        this.player.hand.forEach((card) => {
            card.cardHTML.classList.remove("available-card");
        });

    }

    setAvailableCards() {

        this.cards.forEach((card) => {
            card.cardHTML.classList.add("available-card");
        });

    }

    playerClick() {

        if (this.attackInProgress() || !this.player.turn)
            return;

        if (this.selectedAttacker) {

            var card = { cardHTML: this.opponentHTMLEl.avatar };
            this.selectedTarget = card;
            card.cardHTML.classList.add("target-card");
            this.player.socket.emit("selectCard", -1, true, this.selectedAttacker.cardData.id);
            this.player.socket.emit("attackOpponent", this.selectedAttacker.cardData.id);
            this.clearAttack();

        }

    }

}

export default Board;
