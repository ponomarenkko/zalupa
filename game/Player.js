import db from "../models/index.js";

const Card = db.sequelize.models.card;
const User = db.sequelize.models.user;

class Player {

    static START_HP = 30;
    static MAX_MANA = 10;
    static START_MANA = 0;
    static MAX_CARDS_IN_HAND = 7;
    static MAX_CARDS_ON_BOARD = 5;

    constructor (user, oppSocket) {
        this.socket = user.socket;
        this.userID = user.id;

        this.oppSocket = oppSocket;
        
        this.nickname = '';
        this.avatar = '';

        this.cardDeck = [];
        this.hand = [];
        this.board = [];
        
        this.hp = Player.START_HP;
        this.allMana = Player.START_MANA;
        this.currMana = Player.START_MANA;
        this.fatigueDamage = 0;
    }
    
    async init() {
        
        try {
            let user = await User.findByPk(this.userID);
            this.nickname = user.nickname;
            if (user.avatar) {
                this.avatar = Buffer.from(user.avatar, "binary").toString("base64");
            } else {
                this.avatar = null;
            } 

            await this.initDeck();        
        }
        catch (err) {
            console.error(err);
        }

    }

    replenishMana() {
        if (this.allMana < Player.MAX_MANA)
            this.allMana++;
        this.currMana = this.allMana;
        this.socket.emit('replenishMana', this.allMana);
    }

    reduceHp(value) {
        this.hp -= value;
        this.socket.emit('updatePlayerHp', this.hp);
        this.oppSocket.emit('updateOppHp', this.hp);
    }

    fatigue() {
        this.fatigueDamage++;
        this.reduceHp(this.fatigueDamage);
        this.socket.emit('warning', `The cards in your deck are over, you get ${this.fatigueDamage} damage!`,);
    }

    drawCard() {
        if (!this.cardDeck.length) {
            this.fatigue();
            return null;
        }

        if (this.hand.length >= Player.MAX_CARDS_IN_HAND) {
            this.cardDeck.pop();
            this.socket.emit('warning', `The maximum amount of cards in hand is ${Player.MAX_CARDS_IN_HAND}`);
            return null;
        }

        let card = this.cardDeck.pop();
        this.hand.push(card);

        return card;
    }

    checkCardIsActive(cardId) {
        let card = this.board.find(elem => elem.id === cardId);

        if (!card.isActive) {
            this.socket.emit('warning', `Cards may only attack once per turn!`);
            return false;
        }

        return true;
    }

    setBoardCardsActive() {
        this.board.forEach(card => {
            card.isActive = true;
        })
    }

    moveCardToBoard(cardId) {
        let idx = this.hand.findIndex(elem => elem.id === cardId);

        if (this.board.length >= Player.MAX_CARDS_ON_BOARD) {
            this.socket.emit('warning', `You can have a maximum of ${Player.MAX_CARDS_ON_BOARD} cards on the board at once!`);
            return false;
        }

        if (this.hand[idx].cost > this.currMana) {
            this.socket.emit('warning', `Not enough mana!`);
            return false;
        }

        let card = this.hand.splice(idx, 1)[0];
        this.board.push(card);
        this.currMana -= card.cost;

        return true;
    }

    attackCardOnBoard(targetId, reduceHp) {
        let idx = this.board.findIndex(elem => elem.id === targetId);
        const cardUnderAttack = this.board[idx];
        cardUnderAttack.defense_points -= reduceHp;

        if (cardUnderAttack.defense_points <= 0)
            this.board.splice(idx, 1);
    }
    
    async initDeck() {

        let cards = await Card.findAll({
            attributes: {
                exclude: ["id", "created_at", "updated_at"]
            }
        });

        this.cardDeck = [...cards].map((card, idx) => {
            let cardData = card.dataValues;     // {id:num, defense_points:num, attack_points:num, cost:num}
            cardData.id = idx;                  //set unique id for all cards in deck
            cardData.isActive = false;
            return {...cardData};
        }).sort(() => 0.5 - Math.random());
    }

}

export default Player;