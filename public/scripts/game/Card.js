class Card {

    static assetsDir = "assets/cards";
    static cardCount = 0;
    constructor (cardData, field, isOppCard) {

        this.field = field;
        this.cardData = cardData;
        this.cardID = `card-${Card.cardCount++}`;
        this.cardHTML = null;
        this.isOppCard = isOppCard;
        this.onClickHandler = this.makeCardMove.bind(this);
        
    }

    updateCardData(cardData) {

        let defense = document.querySelector(`#${this.cardID} .card-defense > span`);
        defense.textContent = cardData.defense_points;
        this.cardData.defense_points = cardData.defense_points;
        
        let attack = document.querySelector(`#${this.cardID} .card-attack > span`);
        attack.textContent = cardData.attack_points;
        this.cardData.attack_points = cardData.attack_points;

    }

    clearCardEvents() {

        this.cardHTML.removeEventListener(
            "click",
            this.onClickHandler
        );

    }
    
    render(selector, disabled = false) {
        
        this.setCardHTMLEl(selector);
        if (!disabled) {
            this.cardHTML.addEventListener(
                "click",
                this.onClickHandler
            );
        }
        
    }
    
    fillCardData() {

        let cost = document.querySelector(`#${this.cardID} .card-cost`);
        cost.textContent = this.cardData.cost;
        
        let alias = document.querySelector(`#${this.cardID} .card-alias`);
        alias.textContent = this.cardData.alias;
        
        let attack = document.querySelector(`#${this.cardID} .card-attack span`);
        attack.textContent = this.cardData.attack_points;

        let defense = document.querySelector(`#${this.cardID} .card-defense span`);
        defense.textContent = this.cardData.defense_points;
        
        let img = document.querySelector(`#${this.cardID} .card-img > img`);
        img.setAttribute("src", `${Card.assetsDir}/${this.cardData.img}`);

        this.cardHTML.classList.add("revealed");

    }
    
    setCardHTMLEl(selector) {
        
        const cardContainer = document.querySelector(selector);
        const template = document.getElementById("card-template");
        this.cardHTML = template.content.firstElementChild.cloneNode(true);
        this.cardHTML.setAttribute("id", this.cardID);
        
        if (this.isOppCard)
            this.cardHTML.classList.add("enemy-card");
        else 
            this.cardHTML.classList.add("player-card");

        cardContainer.appendChild(this.cardHTML);

        this.fillCardData();

    }
    
    makeCardMove() {
    
        if (!this.field.player.turn)
            return;

        this.field.addPlayerCard(this);
    
    }

}

export default Card;