import express from "express";
import { ObjectId } from "mongodb";
import { request as httpRequest } from "node:http";


import { requestCollection, responseCollection } from "./mongo.js";

const PORT = 8000;

const app = express();

app.get("/requests", async (req, res) => {
    const requests = await requestCollection.find().toArray();
    res.json(requests);
});

app.get("/responses", async (req, res) => {
    const responses = await responseCollection.find().toArray();
    res.json(responses);
});

app.get("/requests/:id", async (req, res) => {
    const { id } = req.params;
    const mongoId = new ObjectId(id);
    const request = await requestCollection.findOne({ _id: mongoId });
    res.json(request);
});

app.get("/repeat/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const mongoId = new ObjectId(requestId);
    const request = await requestCollection.findOne({ _id: mongoId });

    const queryString = '?' + Object.entries(request.getParams).map(([key, value]) => `${key}=${value}`).join("&");
    const port = request.port ? `:${request.port}` : "";

    const options = {
        method: request.method,

        protocol: request.protocol,
        path: `${request.protocol}//${request.host}${port}${request.path}${queryString}`,

        host: "proxy",
        port: 8080,

        headers: request.headers,
    }

    const proxyReq = httpRequest(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        res.set(proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.write(request.body);
    proxyReq.end();
});

app.listen(PORT, () => {
    console.log(`Proxy-api is listening on ${PORT}`);
});
