function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

let socket = io();
let data_field = document.querySelector('.data-field');
let name_field = document.querySelector('.name-field');

const saveData = () => {
    return new Promise((resolve, reject) => {
        if (name_field.value == '') {
            run_error('اكتب اسمك', name_field);
            reject();
        } else {
            sessionStorage.setItem('name', name_field.value);
            if (sessionStorage.getItem('id') == undefined) {
                sessionStorage.setItem('id', uuidv4());
            }
            resolve();
        }
    });
};

let error_done = true;
const run_error = (error, field) => {
    if (error_done) {
        let prev_data = field.value;

        error_done = false;

        field.style = 'color: red;pointer-events: none;';
        field.value = error;
        setTimeout(function () {
            field.style = 'color: black;pointer-events: all;';
            field.value = prev_data;

            error_done = true;
        }, 500);
    }
};

socket.on('room transfer', () => {
    window.location.href = window.location.origin + '/lobby';
});

socket.on('room error', (error) => {
    console.log(error);
    run_error(error, data_field);
});

document.querySelector('.join').addEventListener('click', () => {
    saveData().then(() => {
        if (data_field.value == '') {
            run_error('اكتب إسم الغرفة', data_field);
        } else {
            socket.emit('join room', {
                room: data_field.value,
                user: name_field.value,
                id: sessionStorage.getItem('id'),
            });
        }
    });
});
document.querySelector('.create').addEventListener('click', () => {
    saveData().then(() => {
        if (data_field.value == '') {
            run_error('اكتب إسم الغرفة', data_field);
        } else {
            socket.emit('create room', {
                room: data_field.value,
                user: name_field.value,
                id: sessionStorage.getItem('id'),
            });
        }
    });
});
