const express = require('express');
const path = require('path')
const {auth, resolver, loaders} = require('@iden3/js-iden3-auth')
const getRawBody = require('raw-body')
var crypto = require('crypto');

const app = express();
const port = 8080;

app.use(express.static('static'));
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get("/api/sign-in", (req, res) => {
    console.log('get Auth Request');
    GetAuthRequest(req,res);
});

app.post("/api/callback", (req, res) => {
    console.log('callback');
    Callback(req,res);
});

app.get('/login', (req, res) => {
	res.render('index');
})

app.get('/claim', async(req, res) => {
	res.render('claim');
})

app.get('/verify', (req, res) => {
	res.render('verifier');
})

app.get('/session', async (req, res) => {
	const {sessionId} = await req.query;
	console.log(sessionId);
	const session = sessionMap.get(`${sessionId}`);
	console.log(session);
	return res.status(200).json({
		"session": session,
	})
})

app.get('/query', async (req, res) => {
	console.log("query");
	createProofRequest(req, res);
})

app.listen(port, () => {
    console.log('server running on port 8080');
});

const requestMap = new Map();
const sessionMap = new Map();
const sessionIdMap = new Map();

async function createProofRequest(req, res) {
	const hostUrl = "http://18.183.117.233:8080";
	const sessionId = 1;
	const callbackURL = "/api/callback"
	const audience = "did:polygonid:polygon:mumbai:2qNSCm5cpWFEpCQajc489c5Mfn92CvBqft71XqFzYN"

	const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

	const request = auth.createAuthorizationRequest(
		'test flow',
		audience,
		uri,
	);

	const proofRequest = {
		id: 1,
		circuitId: 'credentialAtomicQuerySigV2',
		query: {
			allowedIssuers: ['*'],
			type: 'ProofOfAccountOwnership',
			context: 'https://raw.githubusercontent.com/ari4325/polygon-id-schemas-komet/main/schemas/proof-of-account-ownership.json-ld',
			credentialSubject: {
				value: {
					$eq: req.query.address,
				},
			},
		},
	};
	let scope = [];
	if(request.body.scope) {
		scope = request.body.scope
	}
	request.body.scope = [...scope, proofRequest];

	requestMap.set(`${sessionId}`, request);

	return res.status(200).set('Content-Type', 'application/json').send(request);
}

		// GetQR returns auth request
async function GetAuthRequest(req,res) {
	// Audience is verifier id
	const hostUrl = "http://18.183.117.233:8080";
	const sessionId = crypto.randomBytes(16).toString('base64');
	const callbackURL = "/api/callback"
	const audience = "did:polygonid:polygon:mumbai:2qNSCm5cpWFEpCQajc489c5Mfn92CvBqft71XqFzYN"

	const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;
	const request = auth.createAuthorizationRequest(
		'test flow',
		audience,
		uri,
	);
	requestMap.set(`${sessionId}`, request);

	return res.status(200).set('Content-Type', 'application/json').send(request);
}

async function Callback(req,res) {

	const sessionId = req.query.sessionId;
	const raw = await getRawBody(req);
	const tokenStr = raw.toString().trim();

	const ethURL = 'https://polygon-mumbai.infura.io/v3/cf0f0659fb084ae2bc6f502039078311';
	const contractAddress = "0x134B1BE34911E39A8397ec6289782989729807a4"
	const keyDIR = "../keys"

	const ethStateResolver = new resolver.EthStateResolver(
		ethURL,
		contractAddress,
		);

	const resolvers = {
		['polygon:mumbai']: ethStateResolver,
	};
						
	const authRequest = requestMap.get(`${sessionId}`);

	console.log(authRequest);

	const verificationKeyloader = new loaders.FSKeyLoader(keyDIR);
	const sLoader = new loaders.UniversalSchemaLoader('ipfs.io');

	const verifier = new auth.Verifier(
		verificationKeyloader,
		sLoader,
		resolvers,
	);


	try {
		const opts = {
			AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minute
			};		
		authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);
		sessionMap.set(`${sessionId}`, authResponse);
		//sessionIdMap.set(authResponse.from, `${sessionId}`);
	} catch (error) {
		return res.status(500).send(error);
	}
	console.log(authResponse.from);
	return res.status(200).set('Content-Type', 'application/json').send("user with ID: " + authResponse.from + " Succesfully authenticated");
}
