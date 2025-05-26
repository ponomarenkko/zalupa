const socket = io();
const url = new URL(window.location.href);

const startGameBtn = document.querySelector(".start-menu > button");
if (startGameBtn) {
    startGameBtn.addEventListener('click', function () {
        socket.emit('startGame', {id: url.searchParams.get('id')});
    });
}

socket.on('waiting', function() {
    window.location.href = `/waiting?id=${url.searchParams.get('id')}`;
});

socket.on('startGame', function() {
    window.location.href = `/game?id=${url.searchParams.get('id')}`;
});
