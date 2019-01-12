const MongoClient = require('mongodb').MongoClient;
const user = 'moedelo';
const password = 'moedelo1';
const dbname = 'auto_deploy_bot';
const collectionname = 'users';

const url = `mongodb://${user}:${password}@ds033400.mlab.com:33400/${dbname}`;
const mongoClient = new MongoClient(url, { useNewUrlParser: true });

module.exports = {
    async saveOrUpdateUser ({ activity }) {
        const userIds = await getAllUserId();
        const userExist = userIds.find(id => id === activity.from.id);

        if (!userExist) {
            await saveUser({
                userId: activity.from.id,
                activity: mapActivity(activity)
            })
        }
    },

    async getUsers () {
        const collection = await getCollection();
        return collection.find().toArray();
    }
};

async function getAllUserId () {
    const collection = await getCollection();
    const result = await collection.find().toArray();
    return result.map(item => item.userId);
}

async function saveUser ({ userId, activity }) {
    const collection = await getCollection();
    await collection.insertOne({ userId, activity })
}

async function getCollection () {
    const client = await mongoClient.connect();
    const db = client.db(dbname);
    return db.collection(collectionname);
}

function mapActivity (activity) {
    return activity
}
