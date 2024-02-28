import { MongoClient } from "mongodb";

const mongoClient = new MongoClient("mongodb://admin:admin@mongo:27017/");

const db = mongoClient.db("proxy");

const requestCollection = db.collection("requests");
const responseCollection = db.collection("responses");

export { requestCollection, responseCollection };