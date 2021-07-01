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

const saveData = () => {
    let name = name_field.value || name_field.placeholder;

    sessionStorage.setItem(
        'data',
        JSON.stringify({
            name: name,
            pfp: index,
        })
    );

    if (sessionStorage.getItem('id') == undefined) {
        sessionStorage.setItem('id', uuidv4());
    }
};

document.querySelector('.join-room').addEventListener('click', () => {
    saveData();
    window.location.href = window.location.origin + '/join';
});
document.querySelector('.create-room').addEventListener('click', () => {
    saveData();
    window.location.href = window.location.origin + '/create';
});
