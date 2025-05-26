import Game from "./game/Game.js";
import Player from "./game/Player.js";
import db from "./models/index.js";
const User = db.sequelize.models.user;

var findOpp = [];
var pairs = [];

function findSocketId(sockets, id) { //sockets = io.of('/').sockets
    for (let s of sockets) {
        var get = s[1].handshake.headers.referer;
        var param = {};
        var index = get.indexOf('?');
        if (index !== -1) {
            var tmp = [];
            var tmp2 = [];

            tmp = get.substring(index + 1).split('&');
            for (let i = 0; i < tmp.length; i++) {
                tmp2 = tmp[i].split('=');
                param[tmp2[0]] = tmp2[1];
            }

            if (param.id === id) {
                return s[1].id;
            }
        }
    
    }
}

function findOppId(id) {
    let pair = findPair(id);
    return pair[0] !== id ? pair[0] : pair[1];
}

function findPair(id) {
    return pairs.find((pair) => {
        if (pair[0] === id || pair[1] === id) {
            return true;
        }
        return false;
    });
}

async function getInfo(id) {
    let obj = {
        id: id,
        oppId: findOppId(id)
    };

    let user = await User.findOne({
        where: {
            id: obj.id
        }
    }).catch(err => console.log(err));

    obj.nickname = user.nickname;

    user = await User.findOne({
        where: {
            id: obj.oppId
        }
    }).catch(err => console.log(err));

    obj.oppNickname = user.nickname;

    return obj;
}

async function initGame(user1, user2) {

    let player1 = new Player(user1, user2.socket);
    let player2 = new Player(user2, user1.socket);
    let players = [ player1, player2 ];
    
    let promises = [];
    players.forEach(player => {
        promises.push(player.init());
    });
    await Promise.all(promises);

    return new Game(player1, player2);

}

export default function (socket) {
    var io = this;
    console.log('Connected ' + socket.id);

    socket.on('startGame', function(data) {
        if (findOpp.length !== 0) {
            let oppId = findOpp.shift();
            pairs.push([data.id, oppId, null]);
            io.to(findSocketId(io.of('/').sockets, data.id)).emit('startGame');
            io.to(findSocketId(io.of('/').sockets, oppId)).emit('startGame');
        }
        else {
            findOpp.push(data.id);
            io.to(findSocketId(io.of('/').sockets, data.id)).emit('waiting');
        }
    });

    socket.on('initGame', function(data) {
        getInfo(data.id)
        .then(user => {
            var pair = findPair(data.id);
            if (pair[2]) {
                user.socket = socket;
                return initGame(user, pair[2]);
            }
            else {
                user.socket = socket;
                pair[2] = user;
                return null;
            }
        })
        .catch(err => console.error(err));
    });

    socket.on('gameOver', function(data) {
        pairs = pairs.filter(pair => pair[0] !== data.id && pair[1] !== data.id);
    });

    socket.on('disconnect', function() {
        console.log('Disconnected ' + socket.id);
    });
}
