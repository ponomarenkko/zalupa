class HiddenCard {

    static assetsDir = "assets";
    static cardCount = 0;
    constructor (name, selector) {

        this.cardID = `${name}-${HiddenCard.cardCount++}`;
        this.card = this.getCardHTMLEl(name, selector);
        
    }
    
    setDeckCardEvent(socket, event) {

        this.card.insertAdjacentHTML("beforeend", 
            `<span class="deck-card-count"></span>`
        );
        const cardCountSpan = document.querySelector(`#${this.cardID} .deck-card-count`);
        this.card.addEventListener("mouseenter", () => {

            socket.emit(event);
            socket.on(event, (cardCount) => {
                const text = cardCount === 1 ? "card" : "cards";
                cardCountSpan.textContent = `${cardCount} ${text} left`;
                cardCountSpan.classList.remove("hidden");
            })

        });
        this.card.addEventListener("mouseleave", () => {

            cardCountSpan.classList.add("hidden");

        });

    }

    getCardTemplate() {

        const template = document.getElementById("card-template");
        let card = template.content.firstElementChild.cloneNode(true);
        return card;

    }

    getCardHTMLEl(name, selector) {
        
        const cardContainer = document.querySelector(selector);
        const card = this.getCardTemplate();
        
        card.classList.add(name, "hidden");
        card.setAttribute("id", this.cardID);
        cardContainer.appendChild(card);

        let img = document.querySelector(`#${this.cardID} .card-img > img`);
        
        return card;

    }

}

export default HiddenCard;