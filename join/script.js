let socket = io();
let join_field = document.querySelector('#join-field');
const error = (error) => {
    join_field.disabled = true;
    join_field.style = 'color: red;';
    join_field.value = error;
    setTimeout(() => {
        join_field.disabled = false;
        join_field.value = '';
        join_field.style = 'color: black;';
    }, 500);
};

socket.on('room error', () => {
    error('فشل البحث عن الغرفة');
});

socket.on('room joined', () => {
    window.location.href = window.location.origin + '/lobby';
});

document.querySelector('.submit').addEventListener('click', () => {
    if (join_field.value == '') {
        error('ادخل رقم الغرفة');
    } else {
        let room = join_field.value;
        let id = sessionStorage.getItem('id');

        socket.emit('join room', {
            id: id,
            room: room,
            user: JSON.parse(sessionStorage.getItem('data')),
        });
    }
});
