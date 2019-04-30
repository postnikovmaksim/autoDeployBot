const request = require('request-promise-native');

module.exports = {
    async isValidName (appName) {
        let appNames = [].concat([{ name: `all` }]);
        // todo когда найдем где читатать - валидировать
        return { name: appName };

        return appNames.find(app => app.name.toLowerCase() === appName.toLowerCase());
    },

    async getApps () {
        // todo где-то начитать
        return [];
    }
};
