let socket = io();
let id = sessionStorage.getItem('id');

let main_text = document.querySelector('#main-text');
let main_text_title = document.querySelector('#main-text-title');
let main_text_desc = document.querySelector('#main-text-desc');
let ready_btn = document.querySelector('#ready-btn');
let vote_btn = document.querySelector('#vote-btn');
let submit_btn = document.querySelector('#submit-btn');

const create = (template, selector) => {
    let parent = document.querySelector(selector);
    let element = document.createElement('template');
    element.innerHTML = template;
    parent.appendChild(element.content);
};

socket.on('game end', (users) => {
    document.querySelector('#users').style = 'display: none;';
    console.log(users);
    let most_voted = users.sort(function (a, b) {
        return a.voted - b.voted;
    })[0];

    console.log(users.find((user) => user.conv).id);

    console.log(most_voted);
    console.log(
        users.sort(function (a, b) {
            return a.voted - b.voted;
        })
    );

    main_text_title.innerHTML = `${
        users.find((user) => !user.conv).user
    } برا السالفة`;

    main_text_desc.innerHTML = `${
        most_voted.id == users.find((user) => !user.conv).id ? 'خسران' : `فايز`
    }`;

    setTimeout(function () {
        window.location.href = window.location.origin;
    }, 5000);
    // main_text_desc.style = 'display: none;';
    // submit_btn.style = 'display: none;';
});

vote_btn.addEventListener('click', () => {
    socket.emit('game vote', id);
});

let can_vote = false;
submit_btn.addEventListener('click', () => {
    if (!can_vote) return;
    socket.emit('game vote submit', id);
    submit_btn.remove();
    document.querySelector('#users').style =
        'opacity: 0.5;pointer-events: none;';
});

socket.on('room destroy', () => {
    window.location.href = window.location.origin;
});

socket.on('game show vote', () => {
    vote_btn.style = 'display: flex;';
});

let last_voted = null;

socket.on('game vote', (users) => {
    console.log(users);
    main_text_title.innerHTML = 'صوت على الي تشك فيه';

    ready_btn.style = 'display: none;';
    vote_btn.style = 'display: none;';
    submit_btn.style = 'display: flex;';

    Array.from(document.querySelector('#users').children).map((e) =>
        e.remove()
    );
    users.map((user) => {
        if (user.id == id) return;

        create(
            `<div class="btn player" alt="${user.id}" ${
                user.voted.includes(id)
                    ? 'style="background-color: #363636;"'
                    : ''
            }>${user.user}</div>`,
            '#users'
        );

        Array.from(document.querySelector('#users').children).map((e) => {
            if (e.getAttribute('alt') == user.id) {
                e.addEventListener('click', () => {
                    // e.style = 'background-color: #363636;';
                    socket.emit('game vote player', user.id, last_voted, id);
                    last_voted = user.id;
                });
            }
        });
    });

    for (let i = 0; i < users.length; i++) {
        if (users[i].voted.includes(id)) {
            can_vote = true;
            break;
        } else {
            can_vote = false;
        }
    }
});

socket.on('game display', (data) => {
    if (data.ask) {
        main_text_title.innerHTML = `${data.ask.user1.user} اسال ${data.ask.user2.user}`;
        main_text_desc.innerHTML = '';

        ready_btn.innerHTML = 'تجهز';
        ready_btn.style = 'background-color: #bcbcbc;';
    }
});

ready_btn.addEventListener('click', () => {
    ready_btn.style = 'background-color: #363636;';
    ready_btn.innerHTML = 'جاهز';
    socket.emit('game player ready', id);
});

socket.on('game player info', (conv, room) => {
    if (room.display == null) {
        main_text.style = 'display:flex;';
        main_text_title.innerHTML = conv ? 'داخل السالفة' : 'برا السالفة';
        main_text_desc.innerHTML = conv ? room.word : '';
    }
});

socket.emit('game ready load', id);
