import { responseCollection } from "./mongo.js";

export class ParsedResponse {
    code;
    message;

    headers;

    body;

    constructor(response) {
        this.code = response.statusCode;
        this.message = response.statusMessage;

        this.headers = response.headers;

        this.body = "";
    }

    async save(requestId) {
        const record = {
            code: this.code,
            message: this.message,

            headers: this.headers,
            body: this.body,

            requestId,
        }

        await responseCollection.insertOne(record);
        return record._id;
    }

    appendBody(chunk) {
        this.body += chunk.toString();
    }

    finish() { }
}
