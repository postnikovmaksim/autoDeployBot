const { getConnect } = require('./mongoService');
const dbname = 'auto_deploy_bot';
const collectionname = 'users';

module.exports = {
    async saveOrUpdateUser ({ activity, options }) {
        const users = await getAllUsers();
        const userExist = users.find(user => user.userId === activity.from.id);

        if (!userExist && activity) {
            await saveUser({
                userId: activity.from.id,
                activity: activity,
                options: options
            })
        } else if (options) {
            await updateUser({
                user: userExist,
                options: options
            })
        }
    },

    async getUsers () {
        return getAllUsers();
    },

    async getAllSubscription ({ activity }) {
        const collection = await getCollection();
        const user = await collection.findOne({ userId: activity.from.id });
        return user.options;
    }
};

async function getAllUsers () {
    const collection = await getCollection();
    return collection.find().toArray();
}

async function saveUser ({ userId, activity }) {
    const collection = await getCollection();
    await collection.insertOne({ userId, activity })
}

async function updateUser ({ user, options }) {
    const collection = await getCollection();
    return collection.updateOne(
        { id: user.id },
        { $set: { options: mapOptions({ user, options }) } }
    );
}

async function getCollection () {
    const connect = await getConnect();
    const db = connect.db(dbname);
    return db.collection(collectionname);
}

function mapOptions ({ user, options }) {
    const oldOptions = user.options;

    if (!oldOptions) {
        return options;
    }

    return {
        ...user.options,
        deploy: {
            ...user.options.deploy,
            ...options.deploy
        }
    }
}
