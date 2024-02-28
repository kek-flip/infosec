import { createServer, request } from "node:http";
import tls from 'node:tls';
import { readFileSync } from "node:fs";
import { spawn } from 'node:child_process';

import { ParsedRequest } from "./parsedRequest.js";
import { ParsedResponse } from "./parsedResponse.js";

const PORT = 8080;

const server = createServer(function (req, res) {
    const parsedRequest = new ParsedRequest(req);
    parsedRequest.clear();

    const options = {
        method: parsedRequest.method,
        host: parsedRequest.url.host,
        port: parsedRequest.url.port,
        path: parsedRequest.url.pathname + parsedRequest.url.search,
        headers: parsedRequest.headers,
    };

    const proxyReq = request(options, (proxyRes) => {
        const parsedResponse = new ParsedResponse(proxyRes);

        res.statusCode = proxyRes.statusCode;
        res.statusMessage = proxyRes.statusMessage;

        Object.entries(proxyRes.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        proxyRes.on("data", (chunk) => {
            res.write(chunk);
            parsedResponse.appendBody(chunk);
        });

        proxyRes.on("end", async () => {
            res.end();
            parsedResponse.finish();

            const requestId = await parsedRequest.save();
            await parsedResponse.save(requestId);
        });
    });

    req.on("data", (chunk) => {
        proxyReq.write(chunk);
        parsedRequest.readBody(chunk);
    });

    req.on("end", () => {
        parsedRequest.finish();
        proxyReq.end();
    });
});

server.listen(PORT, () => {
    console.log(`Proxy-server is listening on ${PORT}`);
});
