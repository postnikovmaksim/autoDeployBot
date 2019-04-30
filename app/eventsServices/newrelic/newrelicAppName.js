const request = require('request-promise-native');

module.exports = {
    async isValidName (appName) {
        const mainAppName = await getMainApps();
        const outAppName = await getOutApps();

        let appNames = [].concat([{ name: `all` }]);
        appNames = appNames.concat(mainAppName.applications);
        appNames = appNames.concat(outAppName.applications);

        return appNames.find(app => app.name.toLowerCase() === appName.toLowerCase());
    },

    async getApps () {
        const main = await getMainApps();
        const out = await getOutApps();

        return { mainApp: main.applications, outApp: out.applications };
    }
};

function getMainApps () {
    return request.get(`https://rpm.newrelic.com/accounts/667664/applications.json`, {
        auth: {
            user: process.env.NewRelickLogin,
            pass: process.env.NewRelickPassword
        },
        json: true
    });
}

function getOutApps () {
    return request.get(`https://rpm.newrelic.com/accounts/1636928/applications.json`, {
        auth: {
            user: process.env.NewRelickLogin,
            pass: process.env.NewRelickPassword
        },
        json: true
    });
}
