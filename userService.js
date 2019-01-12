const MongoClient = require('mongodb').MongoClient;
const user = 'moedelo';
const password = 'moedelo1';
const dbname = 'auto_deploy_bot';

const url = `mongodb://${user}:${password}@ds259410.mlab.com:59410/${dbname}`;

module.exports = {
    save () {
        const mongoClient = new MongoClient(url, { useNewUrlParser: true });
        mongoClient.connect((err, client) => {
            if (!err) {
                console.log('Connected successfully to server');
            } else {
                return console.log('connect', err);
            }
            // if (err) {
            //     return console.log('connect', err);
            // }
            // const db = client.db(dbname);
            // const collection = db.collection('users');
            // let user = { name: 'Tom', age: 23 };
            // collection.insertOne(user, function (err, result) {
            //     if (err) {
            //         return console.log('insertOne', err);
            //     }
            //     console.log(result.ops);
            //     client.close();
            // });
        })
    }
};
