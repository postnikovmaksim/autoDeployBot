const MongoClient = require('mongodb').MongoClient;
const user = 'moedelo';
const password = 'moedelo1';
const dbname = 'auto_deploy_bot';

const url = `mongodb://${user}:${password}@ds033400.mlab.com:33400/${dbname}`;
const mongoClient = new MongoClient(url, { useNewUrlParser: true });
let connect = null;

module.exports = {
    getConnect () {
        if (connect) {
            return connect;
        }
        connect = mongoClient.connect();
        return connect;
    }
};
