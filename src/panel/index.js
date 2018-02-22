const bodyParser = require("body-parser");
const config = require("../../config");
const express = require("express");
const oauth = require("../oauth/index");
const path = require("path");

const app = express();
app.set("env", process.env.NODE_ENV);
app.set("x-powered-by", false);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "public")));
require("http").createServer(app).listen(config.panelPort, () => process.output({ op: "ready" }));

app.get("/api/config", async (req, res) => {
	res.status(200).json({
		clientID: config.clientID,
		owners: config.owners
	});
});

app.get("/api/info", async (req, res) => {
	if(!req.query.path) {
		res.status(400).send({ error: "No path" });
		return;
	}

	let auth;
	try {
		auth = JSON.parse(req.headers.authorization);
	} catch(err) {
		res.status(400).send({ error: "Authorization not JSON" });
		return;
	}

	try {
		const info = await oauth.info(auth, req.query.path);
		res.status(200).json(info);
	} catch(err) {
		res.status(400).send({ error: "Invalid path or token" });
		return;
	}
});

app.post("/api/callback", async (req, res) => {
	if(!req.body.code) {
		res.status(400).send({ error: "No code" });
		return;
	}

	try {
		const token = await oauth.token(req.body.code, config.panelURL);
		res.status(200).json(token);
	} catch(err) {
		res.status(400).send({ error: "Invalid code" });
		return;
	}
});

app.get("*", (req, res) => res.status(200).sendFile(path.resolve(__dirname, "index.html")));
module.exports = { app };
