import { URL } from "node:url";

import { requestCollection } from "./mongo.js";

const APP_FORM_URLENCODED = "application/x-www-form-urlencoded";

function parseCookie(cookieString) {
    if (!cookieString) return undefined;

    const cookies = cookieString.split(";").map(cookie => cookie.trim()).filter(cookie => cookie !== "");
    return Object.fromEntries(cookies.map(cookie => cookie.split("=")));
}

function parsePostParams(postParamsString) {
    if (!postParamsString) return undefined;

    const postParams = postParamsString.split("&");
    return Object.fromEntries(postParams.map(postParam => postParam.split("=")));
}

export class ParsedRequest {
    method;

    url;

    headers;
    cookies;
    postParams;

    body;

    constructor(request) {
        this.method = request.method;

        this.url = new URL(request.url);

        this.headers = request.headers;
        this.cookies = parseCookie(request.headers.cookie);

        this.body = "";
    }

    async save() {
        const record = {
            method: this.method,

            protocol: this.url.protocol,
            host: this.url.host,
            port: this.url.port,
            path: this.url.pathname,

            getParams: Object.fromEntries(this.url.searchParams.entries()),
            headers: this.headers,
            cookies: this.cookies,
            postParams: this.postParams,

            body: this.body,
        }

        await requestCollection.insertOne(record);
        return record._id;
    }

    clear() {
        delete this.headers["proxy-connection"];
    }

    readBody(chunk) {
        this.body += chunk.toString();
    }

    finish() {
        if (this.headers["content-type"] === APP_FORM_URLENCODED) this.postParams = parsePostParams(this.body);
    }
}
