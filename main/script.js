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

data_field.value = '';
name_field.value = '';

const saveData = () => {
    return new Promise((resolve, reject) => {
        if (name_field.value.trim() == '') {
            run_error('اكتب اسمك', name_field);
            reject();
        } else {
            if (/[\u0621-\u064A]+$/.test(name_field.value.trim())) {
                sessionStorage.setItem('name', name_field.value.trim());
                if (sessionStorage.getItem('id') == undefined) {
                    sessionStorage.setItem('id', uuidv4());
                }
                resolve(name_field.value.trim());
            } else {
                run_error('حروف عربية بس', name_field);
                reject();
            }
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
    if (!error_done) return;
    saveData()
        .then((name) => {
            if (data_field.value.trim() == '') {
                run_error('اكتب إسم الغرفة', data_field);
            } else {
                socket.emit('join room', {
                    room: data_field.value.trim(),
                    user: name,
                    id: sessionStorage.getItem('id'),
                });
            }
        })
        .catch(() => {});
});
document.querySelector('.create').addEventListener('click', () => {
    if (!error_done) return;
    saveData()
        .then(() => {
            if (data_field.value == '') {
                run_error('اكتب إسم الغرفة', data_field);
            } else {
                socket.emit('create room', {
                    room: data_field.value,
                    user: name_field.value,
                    id: sessionStorage.getItem('id'),
                });
            }
        })
        .catch(() => {});
});
