const create = (template, selector) => {
    let parent = document.querySelector(selector);
    let element = document.createElement('template');
    element.innerHTML = template;
    parent.appendChild(element.content);
};

let socket = io();

let content = document.querySelector('#content');
let selected = 'animals';
let start_btn = document.querySelector('#start-button');

const setCard = (card) => {
    console.log('Changed card');
    cards.map((x) => (x.style = 'background-color: #bcbcbc;'));
    card.style = 'background-color: #363636;';
};

start_btn.addEventListener('click', () => {
    socket.emit('room start', sessionStorage.getItem('id'));
});

let cards = Array.from(document.querySelectorAll('.card'));
cards.map((e) =>
    e.addEventListener('click', () => {
        setCard(e);

        selected = e.getAttribute('alt');

        socket.emit('room mode change', {
            mode: selected,
            id: sessionStorage.getItem('id'),
        });
    })
);

socket.on('room destroy', () => {
    window.location.href = window.location.origin;
});

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

socket.on('room mode change', (mode) => {
    console.log('Room mode change');
    setCard(cards.find((card) => card.getAttribute('alt') == mode));
});

socket.on('room info', (room) => {
    let id = sessionStorage.getItem('id');

    setCard(cards.find((card) => card.getAttribute('alt') == room.mode));

    if (room.owner == id) {
        content.style = 'pointer-events: all;';
    } else {
        start_btn.remove();
    }

    document.querySelector('#users').innerHTML = room.users
        .map((e) => e.user)
        .concat([''])
        .join(' و')
        .slice(0, -2);
});
socket.emit('room info', sessionStorage.getItem('id'));
