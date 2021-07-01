const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use('/join', express.static(path.join(__dirname, '/join')));
app.use('/create', express.static(path.join(__dirname, '/create')));
app.use('/lobby', express.static(path.join(__dirname, '/lobby')));
app.use('/main', express.static(path.join(__dirname, '/main')));
app.use('/game', express.static(path.join(__dirname, '/game')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});
app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, '/join.html'));
});
app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '/create.html'));
});
app.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, '/lobby.html'));
});
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '/game.html'));
});

function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

let rooms = [];
let words = {
    animals: ['كوالا', 'خروف', 'ثعلب', 'فيل', 'جمل', 'دب قطبي', 'بقره', 'دب'],
    clothes: ['سلسال', 'تنوره', 'حلق', 'غترة', 'ثوب', 'كعب', 'عباية'],
};
io.on('connection', (socket) => {
    // game
    socket.on('game vote submit', (id) => {
        let index = rooms.findIndex((room) =>
            room.users.find((user) => user.id == id)
        );
        if (index < 0) return;

        let userIndex = rooms[index].users.findIndex((user) => user.id == id);
        if (userIndex < 0) return;

        rooms[index].users[userIndex].submit = true;
        if (rooms[index].users.every((e) => e.submit)) {
            console.log('All submit');

            rooms[index].users.map((e) => {
                io.to(e.socket).emit('game end', rooms[index].users);
            });
            rooms.splice(index, 1);
        }
    });

    socket.on('game vote player', (vote, last_voted) => {
        let index = rooms.findIndex((room) =>
            room.users.find((user) => user.id == vote)
        );
        if (index < 0) return;

        let vote_i = rooms[index].users.findIndex((e) => e.id == vote);
        rooms[index].users[vote_i].voted += 1;

        if (last_voted != null) {
            let last_voted_i = rooms[index].users.findIndex(
                (e) => e.id == last_voted
            );
            rooms[index].users[last_voted_i].voted -= 1;
        }

        rooms[index].users.map((user) => {
            io.to(user.socket).emit('game vote', rooms[index].users);
        });
        ///ASDIAOIDSJOADOJASDJIOAJKODADJKOADJKAAZDJIOADADJIOADJIOASJKOD
    });

    socket.on('game vote', (id) => {
        let index = rooms.findIndex((room) =>
            room.users.find((user) => user.id == id)
        );
        if (index < 0) return;

        rooms[index].voting = true;
        rooms[index].users.map((user) => {
            io.to(user.socket).emit('game vote', rooms[index].users);
        });
    });

    socket.on('game player ready', (id) => {
        let index = rooms.findIndex((room) =>
            room.users.find((user) => user.id == id)
        );
        if (index < 0) return;

        let userIndex = rooms[index].users.findIndex((user) => user.id == id);
        if (userIndex < 0) return;

        console.log(`${rooms[index].users[userIndex].user.name} is ready`);

        rooms[index].users[userIndex].ready = true;

        rooms[index].users.map((user) => {
            io.to(user.socket).emit(
                'game player info',
                user.conv,
                rooms[index].users.filter((e) => e.ready).length,
                rooms[index].users.length,
                rooms[index].display,
                rooms[index].word
            );
        });

        if (rooms[index].users.every((e) => e.ready)) {
            console.log('All ready');

            let users = rooms[index].users;

            let user1 = users[getRandomArbitrary(0, users.length - 1)];
            if (rooms[index].display != null) {
                let altUsers1 = users.filter(
                    (user) =>
                        ![
                            rooms[index].display.ask.user1.id,
                            rooms[index].display.ask.user2.id,
                        ].includes(user.id)
                );

                user1 = altUsers1[getRandomArbitrary(0, altUsers1.length - 1)];
            }

            let altUsers = users.filter((user) => user.id != user1.id);
            let user2 = altUsers[getRandomArbitrary(0, altUsers.length - 1)]; // dont be user1
            if (rooms[index].display != null) {
                altUsers = users.filter(
                    (user) =>
                        ![rooms[index].display.ask.user2.id, user1.id].includes(
                            user.id
                        )
                );

                user2 = altUsers[getRandomArbitrary(0, altUsers.length - 1)];
            }

            rooms[index].display = {
                ask: {
                    user1: user1,
                    user2: user2,
                },
            };

            rooms[index].asked += 1;

            if (rooms[index].asked > 3) {
                rooms[index].users.map((user) => {
                    io.to(user.socket).emit('game show vote');
                });
            }

            rooms[index].users = rooms[index].users.map((e) => {
                e.ready = false;
                io.to(e.socket).emit('game display', rooms[index].display);
                return e;
            });
        }
    });

    socket.on('game ready load', (id) => {
        let index = rooms.findIndex((room) =>
            room.users.find((user) => user.id == id)
        );
        if (index < 0) return;

        let userIndex = rooms[index].users.findIndex((user) => user.id == id);
        if (userIndex < 0) return;

        console.log(`${rooms[index].users[userIndex].user.name} has loaded`);

        rooms[index].users[userIndex].socket = socket.id;
        rooms[index].users[userIndex].loaded = true;
        if (rooms[index].users.every((e) => e.loaded)) {
            rooms[index].users[
                getRandomArbitrary(0, rooms[index].users.length - 1)
            ].conv = false;

            console.log('All loaded');
            rooms[index].users.map((user) => {
                io.to(user.socket).emit(
                    'game player info',
                    user.conv,
                    0,
                    rooms[index].users.length,
                    null,
                    rooms[index].word
                );
            });
        }
    });

    // info
    socket.on('room start', (id) => {
        let index = rooms.findIndex((room) => room.owner == id);
        if (index < 0) return;

        let ownerIndex = rooms[index].users.findIndex((user) => user.id == id);
        if (ownerIndex < 0) return;

        if (rooms[index].users.length < 3) {
            io.to(rooms[index].users[ownerIndex].socket).emit('room error');
            return;
        }

        let chosenWords = words[rooms[index].mode];
        rooms[index].word =
            chosenWords[getRandomArbitrary(0, chosenWords.length - 1)];
        rooms[index].users.map((user) => {
            io.to(user.socket).emit('room start confirm');
        });
    });

    socket.on('room mode change', (data) => {
        let index = rooms.findIndex((room) => room.owner == data.id);
        if (index < 0) return;

        rooms[index].mode = data.mode;

        rooms[index].users.map((user) => {
            if (user.id != data.id) {
                io.to(user.socket).emit('room mode change', data.mode);
            }
        });
    });

    socket.on('room info', (id) => {
        if (rooms.length < 1) return;
        let index = rooms.findIndex((room) =>
            room.users.find((user) => user.id == id)
        );
        if (index < 0) return;

        let userIndex = rooms[index].users.findIndex((user) => user.id == id);
        if (userIndex < 0) return;

        rooms[index].users[userIndex].socket = socket.id;

        rooms[index].users.map((user) => {
            io.to(user.socket).emit('room info', rooms[index]);
        });
    });

    // room creation and joining
    socket.on('join room', (data) => {
        let index = rooms.findIndex((e) => e.id == data.room);

        if (index != -1) {
            rooms[index].users = rooms[index].users.concat([
                {
                    id: data.id,
                    user: data.user,
                    socket: null,
                    loaded: false,
                    ready: false,
                    conv: true,
                    submit: false,
                    voted: 0,
                },
            ]);
            socket.emit('room joined');
        } else {
            socket.emit('room error', 'Cant find room');
        }
    });

    socket.on('create room', (data) => {
        if (rooms.find((e) => e.id == data.room) != undefined) {
            socket.emit('room error');
            return;
        }

        rooms.push({
            id: data.room,
            owner: data.id,
            users: [
                {
                    id: data.id,
                    user: data.user,
                    socket: null,
                    loaded: false,
                    ready: false,
                    conv: true,
                    submit: false,
                    voted: 0,
                },
            ],
            mode: 'animals',
            asked: 0,
            word: null,
            display: null,
        });
        socket.emit('room created');
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log(`listening on *:${process.env.PORT || 3000}`);
});
