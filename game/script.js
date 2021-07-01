let socket = io();
let id = sessionStorage.getItem('id');

let main_text = document.querySelector('#main-text');
let main_text_title = document.querySelector('#main-text-title');
let main_text_desc = document.querySelector('#main-text-desc');
let ready_btn = document.querySelector('#ready-btn');
let vote_btn = document.querySelector('#vote-btn');
let submit_btn = document.querySelector('#submit-btn');
let reveal = document.querySelector('.heavy');
let svg_holder = document.querySelector('#svg-holder');

const create = (template, selector) => {
    let parent = document.querySelector(selector);
    let element = document.createElement('template');
    element.innerHTML = template;
    parent.appendChild(element.content);
};

function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

svg_holder.style = 'display:none;';
socket.on('game end', (users) => {
    document.querySelector('#users').style = 'display: none;';
    main_text_title.style = 'display: none;';
    main_text_desc.style = 'display: none;';
    submit_btn.style = 'display: none;';
    svg_holder.style = 'display:block;';

    let most_voted = users.sort(function (a, b) {
        return a.voted + b.voted;
    })[0];

    let id = null;
    let intervals = 0;
    let limit = 15;
    reveal.innerHTML = users[getRandomArbitrary(0, users.length - 1)].user.name;
    id = setInterval(() => {
        let names = users.map((user) => user.user.name);
        names.splice(
            names.findIndex((e) => e == reveal.innerHTML),
            1
        );

        reveal.innerHTML = names[getRandomArbitrary(0, names.length - 1)];
        intervals += 1;
        if (intervals >= limit) {
            clearInterval(id);
            let convUser = users.find((user) => !user.conv);
            reveal.innerHTML = `${convUser.user.name} ${
                most_voted.id == convUser.id ? 'خسران' : 'فائز'
            }`;
            reveal.style =
                most_voted.id == convUser.id ? 'fill:red;' : 'fill:green;';

            setTimeout(function () {
                window.location.href = window.location.origin;
            }, 5000);
        }
    }, 200);
});

ready_btn.addEventListener('click', () => {
    socket.emit('game player ready', id);
});
vote_btn.addEventListener('click', () => {
    socket.emit('game vote', id);
});
submit_btn.addEventListener('click', () => {
    socket.emit('game vote submit', id);
    document.querySelector('#users').style =
        'opacity: 0.5;pointer-events: none;';
});
let last_voted = null;
socket.on('game show vote', () => {
    vote_btn.style = 'display: block;';
});

socket.on('game vote', (users) => {
    main_text_title.innerHTML = 'خمن مين الي برا السالفة!';
    main_text_desc.innerHTML = '';

    ready_btn.style = 'display: none;';
    vote_btn.style = 'display: none;';
    submit_btn.style = 'display: block;';
    Array.from(document.querySelector('#users').children).map((e) =>
        e.remove()
    );
    users.map((user) => {
        if (user.id == id) return;

        create(
            `<div class="btn player" alt="${user.id}">${user.user.name} ${
                user.voted
            }/${users.length - 1}</div>`,
            '#users'
        );

        Array.from(document.querySelector('#users').children).map((e) => {
            if (e.getAttribute('alt') == user.id) {
                e.addEventListener('click', () => {
                    socket.emit('game vote player', user.id, last_voted);
                    last_voted = user.id;
                });
            }
        });
    });
});

socket.on('game display', (data) => {
    if (data.ask) {
        main_text_title.innerHTML = 'وقت الأسئلة';
        main_text_desc.innerHTML = `<strong>${data.ask.user1.user.name}</strong> يسأل <strong>${data.ask.user2.user.name}</strong> سؤال عن السالفة! إختار سؤالك بعناية عشان ما تنقفط`;
        // data.ask.user1
    }
});

socket.on('game player info', (conv, users_ready, users, display, word) => {
    if (display == null) {
        main_text.style = 'display:flex;';
        main_text_title.innerHTML = conv ? 'داخل السالفة' : 'برا السالفة';
        main_text_desc.innerHTML = conv
            ? `أنت داخل السالفة<br/><strong
                >${word}</strong
            ><br/>هدفك إنك تطلع الي برا السالفة`
            : `أنت برا السالفة! حاول تخمن وش السالفة من كلام اللاعبين أو اقنعهم يصوتون على اللاعب الخطأ`;
    }

    if (users_ready == users) {
        ready_btn.innerHTML = 'جاهز';
        ready_btn.innerHTML += `0/${users}`;
    } else {
        ready_btn.innerHTML = 'جاهز';
        ready_btn.innerHTML += `${users_ready}/${users}`;
    }
});

socket.emit('game ready load', id);
