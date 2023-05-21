const base_url = "http://localhost:8080/";

var qrcode_img = document.getElementById('qrcode_img');
var qr = new QRCode(qrcode_img);

const issuer_did = "did:polygonid:polygon:mumbai:2qJiZTBRty3mrrYukXxRAtrRXaMtu8TZ25SbAkDiTv";

let account, provider, contract, signer, nft_balance;
let identifier;//"did:polygonid:polygon:mumbai:2qMHDN9Z9DXaRENBsFayk6ceKo6S5FEW2xZDoyy5eU";
let valuation = 0;
let qr_text = document.getElementById('qr_text');

//DID
let gen_did = document.getElementById('generate_did');
let did = document.getElementById('did');
did.style.display = 'none'

//CONNECT_WALLET
let wallect_connect, address;
wallect_connect = document.getElementById('wallet_connect');
document.getElementById('sign_msg').style.display='none';

//CLAIM
let bayc_owner;
let create_claim = document.getElementById('create_claim');
document.getElementById('claim').style.display='none';

//PROOF_CHOICE
let proof_div = document.getElementById('choice');
let proof_choice = document.getElementById('proof_choice');
proof_div.style.display='none';

window.addEventListener("load", async() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    console.log(sessionId);

    const resp = await fetch(`${base_url}session?sessionId=${sessionId}`);
    const data = await resp.json();
    console.log(data);
    const session = data.session;
    console.log(session);

    identifier = session.from;
    console.log(identifier);

    gen_did.style.display = 'none';
    document.getElementById('did_text').style.display='none';

    did.style.display="block";
    did.innerText += " "+identifier;
    document.getElementById('sign_msg').style.display='block';
    document.getElementById('balance').style.display = 'none';
    if(window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.send("eth_requestAccounts");
        if (accounts.result.length) {
            const account = accounts.result[0];
        }
    }else{
        alert("Metamask Not Installed");
    }
    qr_text.style.display = 'none';
});

const generateQr = async(object) => {
    qr_text.style.display = 'block';
    qr.makeCode(object);
}

wallect_connect.addEventListener("click", async() => {

    const message = "Komet <> Polygon ID";
    document.getElementById('sign_msg_text').style.display='none';
    wallect_connect.innerHTML = "<div>Connecting...</div>";

    signer = provider.getSigner();
    const signature = await signer.signMessage(message);
    const address = await signer.getAddress();

    const signerAddr = await ethers.utils.verifyMessage(message, signature);
    console.log(signerAddr);

    if(address === signerAddr) {

        console.log(identifier);

        const balance = await ethers.utils.formatEther(await provider.getBalance(address));

        wallect_connect.style.display='none';

        document.getElementById('balance').style.display = 'block';
        
        document.getElementById('balance').innerText+= " "+ address;

        const resp = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
        const json_resp = await resp.json();

        valuation = parseInt(balance * json_resp.USD);

        document.getElementById('choice').style.display='block';
        document.getElementById('contract_field').style.display = 'none';

    }
})


gen_did.addEventListener("click", async() => {
    // const response = await fetch('http://10.12.13.40:3001/v1/identities', {
    //     method: "POST",
    //     body: JSON.stringify({
    //         "didMetadata": {
    //             "method": "polygonid",
    //             "blockchain": "polygon",
    //             "network": "mumbai"
    //         }
    //     }),
    //     headers: {
    //         "Authorization": "Basic dXNlcjpwYXNzd29yZA==",
    //         "Content-Type": "application/json",
    //     }
    // });

    // const json_response = await response.json();
    // identifier = json_response.identifier;

    gen_did.style.display = 'none';
    document.getElementById('did_text').style.display='none';

    did.style.display="block";
    did.innerText += " "+identifier;
    document.getElementById('sign_msg').style.display='block';
    document.getElementById('balance').style.display = 'none';
})

proof_choice.addEventListener("change", async() => {

    let choice = proof_choice.value;
    console.log(choice);
    if(choice === 'holding') {

        const abi = [
            "function balanceOf(address owner) public view returns (uint256)"
        ];
    
        let contract_address = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
        contract = new ethers.Contract(contract_address, abi, signer);
    
        let address = await signer.getAddress();
        nft_balance = parseInt(await contract.balanceOf(address));
        //"0x317a8fe0f1c7102e7674ab231441e485c64c178a"
        console.log(nft_balance);
        bayc_owner = (nft_balance > 0) ? 1: 0;
        console.log(valuation);

        document.getElementById('contract_field').style.display = 'block';  
        document.getElementById('bayc_owner').innerText += ` ${(bayc_owner == 0)? false: true}`;
        document.getElementById('total_valuation').innerText += ` ${valuation}`;

    }
    else{
        document.getElementById('contract_field').style.display = 'none';
        //document.getElementById('claim').style.display='block';
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const oneYearInSeconds = 31536000;
        const newTimestamp = currentTimestamp + oneYearInSeconds;
        console.log(valuation);
        const claim_response = await fetch(`http://20.193.155.189:3001/v1/${issuer_did}/claims`, {
            method: "POST",
            body: JSON.stringify({
                "credentialSchema":"https://raw.githubusercontent.com/ari4325/polygon-id-schemas-komet/main/schemas/proof-of-valuation.json",
                "type": "ProofOfValuation",
                "credentialSubject": {
                    "id": identifier,
                    "value": valuation
                },
                "expiration": newTimestamp
            }),
            headers: {
                "Authorization": "Basic dXNlcjpwYXNzd29yZA==",
                "Content-Type": "application/json"
            },
        });

        const claim_json_response = await claim_response.json();
        const id = claim_json_response.id;

        console.log(id);

        const qr_response = await fetch(`http://20.193.155.189:3001/v1/${issuer_did}/claims/${id}/qrcode`, {
            method: 'GET',
            headers: {
                "Authorization": "Basic dXNlcjpwYXNzd29yZA==",
                "Content-Type": "application/json"
            }
        });
        const qr_json_response = await qr_response.json();
        //console.log(qr_json_response);

        create_claim.innerHTML = "<div>Claim Below</div>"
        generateQr(JSON.stringify(qr_json_response));
    }
})


create_claim.addEventListener("click", async() => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const oneYearInSeconds = 31536000;
    const newTimestamp = currentTimestamp + oneYearInSeconds;
    console.log(valuation);
    const claim_response = await fetch(`http://20.193.155.189:3001/v1/${issuer_did}/claims`, {
        method: "POST",
        body: JSON.stringify({
            "credentialSchema": "https://raw.githubusercontent.com/ari4325/polygon-id-schemas-komet/main/komet-generic-proof/komet-generic.json",
            "type": "KometGeneric",
            "credentialSubject": {
                "id": identifier,
                "bayc_owner": bayc_owner,
                "valuation": valuation
            },
            "expiration": newTimestamp
            }),
        headers: {
            "Authorization": "Basic dXNlcjpwYXNzd29yZA==",
            "Content-Type": "application/json"
        },
    });

    const claim_json_response = await claim_response.json();
    const id = claim_json_response.id;

    console.log(id);

    const qr_response = await fetch(`http://20.193.155.189:3001/v1/${issuer_did}/claims/${id}/qrcode`, {
        method: 'GET',
        headers: {
            "Authorization": "Basic dXNlcjpwYXNzd29yZA==",
            "Content-Type": "application/json"
        }
    });
    const qr_json_response = await qr_response.json();
    console.log(qr_json_response);

    create_claim.innerHTML = "<div>Claim Below</div>"
    generateQr(JSON.stringify(qr_json_response));
})
