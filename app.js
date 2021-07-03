const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use('/lobby', express.static(path.join(__dirname, '/lobby')));
app.use('/main', express.static(path.join(__dirname, '/main')));
app.use('/game', express.static(path.join(__dirname, '/game')));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/lobby', (req, res) => res.sendFile(__dirname + '/lobby.html'));
app.get('/game', (req, res) => res.sendFile(__dirname + '/game.html'));

function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

{
    /* <div class="card" alt="animals">حيوانات</div>
<div class="card" alt="clothes">ملابس</div>
<div class="card" alt="sweets">حلويات</div>
<div class="card" alt="drinks">مشروبات</div>
<div class="card" alt="food">أكلات</div>
<div class="card" alt="anime">أنمي</div> */
}

let rooms = [];
let words = {
    animals: ['كوالا', 'خروف', 'ثعلب', 'فيل', 'جمل', 'دب قطبي', 'بقره', 'دب'],
    clothes: ['سلسال', 'تنوره', 'حلق', 'غترة', 'ثوب', 'كعب', 'عباية'],
    anime: ['ون بيس', 'بليتش', 'هجوم العمالقة', 'مذكرة الموت', 'توكيو رفنجرز'],
    sweets: ['كرمل', 'شوكولاته', 'قمي', 'حلاوة مصاص', 'علك'],
    drinks: ['مويه', 'حليب', 'قهوه', 'شاي', 'هوت شكلتا', 'عصير', 'مشروب غازيه'],
    food: ['سمك', 'لحم', 'دجاج', 'خبز', 'جبن', 'خصروات', 'فواكه'],
};

const getIndicesByProp = (m, p) => {
    return new Promise((resolve, reject) => {
        let room_index, user_index;
        try {
            room_index = rooms.findIndex((x) => x.users.find((y) => y[p] == m));
            user_index = rooms[room_index].users.findIndex((x) => x[p] == m);
        } catch (err) {
            // reject(
            //     `Error: \u001b[1;31m${err}\u001b[0m\n    Match: ${m}\n    Property: ${p}`
            // );
        }

        resolve({
            room: room_index,
            user: user_index,
        });
    });
};

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        // error occurs because either the user left a destroyed room or the user socket disconnected from main
        getIndicesByProp(socket.id, 'socket')
            .then((index) => {
                if (rooms[index.room] == undefined) return;
                if (!rooms[index.room].started) {
                    if (
                        rooms[index.room].users[index.user].id ==
                        rooms[index.room].owner
                    ) {
                        console.log(`user is owner destroy room`);
                        rooms[index.room].users.map((e) =>
                            io.to(e.socket).emit('room destroy')
                        );
                        rooms.splice(index.room, 1);
                    } else {
                        console.log(`user is member leave room`);
                        rooms[index.room].users.splice(index.user, 1);
                        rooms[index.room].users.map((user) => {
                            io.to(user.socket).emit(
                                'room info',
                                rooms[index.room]
                            );
                        });
                    }
                } else {
                    if (rooms[index.room].users.every((x) => x.loaded)) {
                        console.log(
                            `user left during game and all loaded destroy room`
                        );
                        rooms[index.room].users.map((e) =>
                            io.to(e.socket).emit('room destroy')
                        );
                        rooms.splice(index.room, 1);
                    }
                }
            })
            .catch(console.log);
    });

    socket.on('game vote submit', (id) => {
        getIndicesByProp(id, 'id')
            .then((index) => {
                rooms[index.room].users[index.user].submit = true;
                if (rooms[index.room].users.every((x) => x.submit)) {
                    console.log('All votes have been submitted');
                    rooms[index.room].users.map((e) => {
                        io.to(e.socket).emit(
                            'game end',
                            rooms[index.room].users
                        );
                    });
                    rooms.splice(index, 1);
                }
            })
            .catch(console.log);
    });

    socket.on('game vote player', (vote, prev_vote, id) => {
        getIndicesByProp(vote, 'id')
            .then((index) => {
                rooms[index.room].users[index.user].voted = rooms[
                    index.room
                ].users[index.user].voted.concat([id]);

                if (prev_vote != null) {
                    rooms[index.room].users[
                        rooms[index.room].users.findIndex(
                            (x) => x.id == prev_vote
                        )
                    ].voted.splice(
                        rooms[index.room].users[
                            rooms[index.room].users.findIndex(
                                (x) => x.id == prev_vote
                            )
                        ].voted.findIndex((x) => x == id),
                        1
                    );
                }

                rooms[index.room].users.map((user) => {
                    io.to(user.socket).emit(
                        'game vote',
                        rooms[index.room].users
                    );
                });
            })
            .catch(console.log);
    });

    socket.on('game vote', (id) => {
        getIndicesByProp(id, 'id')
            .then((index) => {
                rooms[index.room].voting = true;
                rooms[index.room].users.map((user) => {
                    io.to(user.socket).emit(
                        'game vote',
                        rooms[index.room].users
                    );
                });
            })
            .catch(console.log);
    });

    socket.on('game player ready', (id) => {
        getIndicesByProp(id, 'id')
            .then((index) => {
                rooms[index.room].users[index.user].ready = true;
                rooms[index.room].users.map((user) => {
                    io.to(user.socket).emit(
                        'game player info',
                        user.conv,
                        rooms[index.room]
                    );
                });

                if (rooms[index.room].users.every((e) => e.ready)) {
                    console.log('All users are ready for the next question');

                    let users = rooms[index.room].users;

                    let user1 = users[getRandomArbitrary(0, users.length - 1)];
                    if (rooms[index.room].display != null) {
                        let altUsers1 = users.filter(
                            (user) =>
                                ![
                                    rooms[index.room].display.ask.user1.id,
                                    rooms[index.room].display.ask.user2.id,
                                ].includes(user.id)
                        );

                        user1 =
                            altUsers1[
                                getRandomArbitrary(0, altUsers1.length - 1)
                            ];
                    }

                    let altUsers = users.filter((user) => user.id != user1.id);
                    let user2 =
                        altUsers[getRandomArbitrary(0, altUsers.length - 1)]; // dont be user1
                    if (rooms[index.room].display != null) {
                        altUsers = users.filter(
                            (user) =>
                                ![
                                    rooms[index.room].display.ask.user2.id,
                                    user1.id,
                                ].includes(user.id)
                        );

                        user2 =
                            altUsers[
                                getRandomArbitrary(0, altUsers.length - 1)
                            ];
                    }

                    rooms[index.room].asked += 1;
                    rooms[index.room].display = {
                        ask: {
                            user1: user1,
                            user2: user2,
                        },
                    };

                    if (
                        rooms[index.room].asked >
                        rooms[index.room].users.length - 1
                    ) {
                        rooms[index.room].users.map((user) => {
                            io.to(user.socket).emit('game show vote');
                        });
                    }

                    rooms[index.room].users = rooms[index.room].users.map(
                        (x) => {
                            x.ready = false;
                            io.to(x.socket).emit(
                                'game display',
                                rooms[index.room].display
                            );
                            return x;
                        }
                    );
                }
            })
            .catch(console.log);
    });

    socket.on('game ready load', (id) => {
        getIndicesByProp(id, 'id')
            .then((index) => {
                rooms[index.room].users[index.user].socket = socket.id;
                rooms[index.room].users[index.user].loaded = true;
                if (rooms[index.room].users.every((x) => x.loaded)) {
                    console.log('All users have loaded');

                    rooms[index.room].users[
                        getRandomArbitrary(
                            0,
                            rooms[index.room].users.length - 1
                        )
                    ].conv = false;

                    rooms[index.room].users.map((user) => {
                        io.to(user.socket).emit(
                            'game player info',
                            user.conv,
                            rooms[index.room]
                        );
                    });
                }
            })
            .catch(console.log);
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

        rooms[index].started = true;

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

        console.log(index);

        rooms[index].mode = data.mode;
        rooms[index].users.map((user) => {
            if (user.id != data.id) {
                io.to(user.socket).emit('room mode change', data.mode);
            }
        });
    });

    socket.on('room info', (id) => {
        getIndicesByProp(id, 'id')
            .then((index) => {
                rooms[index.room].users[index.user].socket = socket.id;
                rooms[index.room].users.map((user) => {
                    io.to(user.socket).emit('room info', rooms[index.room]);
                });
            })
            .catch(console.log);
    });

    // room creation and joining
    socket.on('join room', (data) => {
        let index = rooms.findIndex((x) => x.id == data.room);

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
                    voted: [],
                },
            ]);
            socket.emit('room transfer');
        } else {
            socket.emit('room error', 'ما لقيت الغرفة');
        }
    });

    socket.on('create room', (data) => {
        if (rooms.find((e) => e.id == data.room) != undefined) {
            socket.emit('room error', 'الغرفة موجودة');
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
                    voted: [],
                },
            ],
            mode: 'animals',
            asked: 0,
            word: null,
            display: null,
            started: false,
        });
        socket.emit('room transfer');
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log(`listening on *:${process.env.PORT || 3000}`);
});
