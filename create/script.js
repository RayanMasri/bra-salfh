let socket = io();
let create_field = document.querySelector('#create-field');
const error = (error) => {
    create_field.disabled = true;
    create_field.style = 'color: red;';
    create_field.value = error;
    setTimeout(() => {
        create_field.disabled = false;
        create_field.value = '';
        create_field.style = 'color: black;';
    }, 500);
};

socket.on('room error', () => {
    error('الغرفة متواجدة');
});

socket.on('room created', () => {
    window.location.href = window.location.origin + '/lobby';
});

document.querySelector('.submit').addEventListener('click', () => {
    if (create_field.value == '') {
        error('ادخل رقم الغرفة');
    } else {
        let room = create_field.value;
        let id = sessionStorage.getItem('id');

        socket.emit('create room', {
            id: id,
            room: room,
            user: JSON.parse(sessionStorage.getItem('data')),
        });
    }
});
