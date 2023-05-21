const base_url = "http://localhost:8080/";

window.addEventListener("load", async() => {
    
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    console.log(sessionId);

    const resp = await fetch(`${base_url}session?sessionId=${sessionId}`);
    const data = await resp.json();
    console.log(data);
    const session = data.session;
    console.log(session);

    document.getElementById('did').innerText = session.from;

    fetch(base_url+'query')
    .then(r => Promise.all([Promise.resolve(r.headers.get('x-id')), r.json()]))
    .then(([id, data]) => {
        console.log(data)
        makeQr(document.getElementById('qrcode_img'), data)
        return id
    })
    .catch(err => console.log(err));
})

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