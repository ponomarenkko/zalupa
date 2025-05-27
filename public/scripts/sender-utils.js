function setStyleMsg (notify, type) {
    switch (type) {
        case 'error':
            notify.classList.remove('notify--success');
            notify.classList.add('notify--error');
            break;

        case 'success':
            notify.classList.remove('notify--error');
            notify.classList.add('notify--success');
            break;
    
        default:
            break;
    }
}

export function showMsg(data) {
    let notify = document.querySelector('.notify');
    notify.textContent = data.text;
    setStyleMsg(notify, data.type);
}

export async function sendUserData(userData, url) {
    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    let data = await res.json();

    return data;
}