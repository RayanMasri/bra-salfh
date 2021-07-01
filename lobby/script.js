const create = (template, selector) => {
    let parent = document.querySelector(selector);
    let element = document.createElement('template');
    element.innerHTML = template;
    parent.appendChild(element.content);
};

let icons = [
    'boar',
    'frog',
    'horse',
    'koala',
    'lion',
    'parrot',
    'pig',
    'rhino',
    'snake',
];
let socket = io();
let content = document.querySelector('#content');
let selected = 'animals';
let start_btn = document.querySelector('#start-button');

socket.on('room error', () => {
    start_btn.style = 'color: red;pointer-events: none;opacity:0.5;';
    start_btn.innerHTML = 'نحتاج 3 لاعبين';
    setTimeout(function () {
        start_btn.style = 'color: white;pointer-events: all;opacity:1;';
        start_btn.innerHTML = 'إبدا';
    }, 500);
});

socket.on('room start confirm', () => {
    window.location.href = window.location.origin + '/game';
});

start_btn.addEventListener('click', () => {
    socket.emit('room start', sessionStorage.getItem('id'));
});

let cards = Array.from(document.querySelectorAll('.card'));
cards.map((e) =>
    e.addEventListener('click', () => {
        cards.map((x) => (x.style = 'border:none;'));
        e.style = 'border:10px solid red;';
        selected = e.getAttribute('alt');

        socket.emit('room mode change', {
            mode: selected,
            id: sessionStorage.getItem('id'),
        });
    })
);

socket.on('room mode change', (mode) => {
    let card = cards.find((card) => card.getAttribute('alt') == mode);
    cards.map((x) => (x.style = 'border:none;'));
    card.style = 'border:10px solid red;';
});

socket.on('room destroy', () => {
    window.location.href = window.location.origin;
});

socket.on('room info', (room) => {
    let id = sessionStorage.getItem('id');

    let card = cards.find((card) => card.getAttribute('alt') == room.mode);
    cards.map((x) => (x.style = 'border:none;'));
    card.style = 'border:10px solid red;';

    if (room.owner == id) {
        content.style = 'opacity:1.0;pointer-events: all;';
    }

    Array.from(document.querySelector('#left-bar').children).map((e) =>
        e.remove()
    );
    room.users
        .sort((x, y) =>
            (x.id == id) === (y.id == id) ? 0 : x.id == id ? -1 : 1
        )
        .map((user) => {
            create(
                `
        <div class="user-div">
            <div class="user-icon">
                <img src="./icons/${icons[user.user.pfp]}.png" />
            </div>
            <div class="user-data-div">
                <div class="user-name">${user.user.name.toUpperCase()}</div>
                <div class="user-role">${
                    user.id == room.owner ? 'رئيس' : 'لاعب'
                }</div>
            </div>
        </div>
        `,
                '#left-bar'
            );
        });
});
socket.emit('room info', sessionStorage.getItem('id'));
