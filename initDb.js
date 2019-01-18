const { query } = require('./app/mysqlServices');

(async () => {
    try {
        await query({
            sqlString: 'CREATE TABLE `Users` (\n' +
                ' `id` mediumint(9) NOT NULL AUTO_INCREMENT,\n' +
                ' `userId` varchar(100) NOT NULL,\n' +
                ' `userName` varchar(100) DEFAULT NULL,\n' +
                ' `activity` text NOT NULL,\n' +
                ' PRIMARY KEY (`id`)\n' +
                ') ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1'
        });
    } catch (e) {
        console.log(e);
    }

    try {
        await query({ sqlString: 'CREATE TABLE `UsersSubscriptions` (\n' +
                ' `id` mediumint(9) NOT NULL AUTO_INCREMENT,\n' +
                ' `userId` mediumint(9) NOT NULL,\n' +
                ' `eventName` varchar(100) NOT NULL,\n' +
                ' PRIMARY KEY (`id`),\n' +
                ' KEY `userId` (`userId`),\n' +
                ' CONSTRAINT `UsersSubscriptions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`)\n' +
                ') ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1' })
    } catch (e) {
        console.log(e);
    }
})();
