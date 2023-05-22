const base_url = "http://18.183.117.233:8080/";

let sessionId;
window.onload = () => {
    const qrBtnEl = document.querySelector('.btn-qr');
    const qrCodeEl = document.querySelector('#qrcode');

    qrBtnEl.addEventListener('click', (e) => {
        makeDisabled(qrBtnEl, false)

        fetch(base_url+'api/sign-in')
            .then(r => Promise.all([Promise.resolve(r.headers.get('x-id')), r.json()]))
            .then(([id, data]) => {
                console.log(data.body.callbackUrl)
                const urlParams = new URLSearchParams("?"+data.body.callbackUrl.split("?")[1]);
                console.log("?"+data.body.callbackUrl.split("?")[1])
                sessionId = urlParams.get('sessionId');
                sessionId = sessionId.replace(" ", "+");
                console.log(sessionId);
                makeQr(qrCodeEl, data)
                handleDisplay(qrCodeEl, true)
                handleDisplay(qrBtnEl, false);
                return id
            })
            .catch(err => console.log(err));

    });

    setInterval(updateUI, 5000);

}

async function updateUI() {
    //window.open("/verify","_self")
    const resp = await fetch(`${base_url}session?sessionId=${sessionId}`);
    const data = await resp.json();
    if (data.session != null) {
        const endpoint = `/claim?sessionId=${sessionId}`;
        window.open("http://10.12.22.94:8080"+endpoint, "_self");
    }
}

function makeQr(el, data) {
    return new QRCode(el, {
        text: JSON.stringify(data),
        width: 300,
        height: 300,
        colorDark: "#000",
        colorLight: "#e9e9e9",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function handleDisplay(el, needShow, display = 'block') {
    el.style.display = needShow ? display : 'none';
}

function makeDisabled(el, disabled, cls = 'disabled') {
    if (disabled) {
        el.disabled = true
        el.classList.add(cls);
    } else {
        el.classList.remove(cls);
        el.disabled = false;
    }
}