const request = require('request-promise-native');
const xmlParser = require('xml-parser');

module.exports = {
    async getCommitMessages ({ buildNumber }) {
        const build = await getBuild({ buildNumber });

        const packId = build.root.children
            .find(c => c.name === 'triggered').children
            .find(c => c.name === 'build').attributes.id;

        const pack = await getPack({ packId });

        const changeId = pack.root.children
            .find(c => c.name === 'change').attributes.id;

        const change = await getChange({ changeId });

        return change.root.children
            .filter(c => c.name === 'comment')
            .map(c => c.content);
    }
};

function getBuild ({ buildNumber }) {
    return get({ uri: `httpAuth/app/rest/builds/number:${buildNumber}` })
}

function getPack ({ packId }) {
    return get({ uri: `httpAuth/app/rest/changes?locator=build:(id:${packId}})` })
}

function getChange ({ changeId }) {
    return get({ uri: `httpAuth/app/rest/changes/id:${changeId}` })
}

async function get ({ uri }) {
    const options = {
        method: 'GET',
        uri: `https://ci.moedelo.org/${uri}`,
        auth: {
            'user': 'postnikov',
            'pass': 'L1mkZ68p1'
        }
    };

    const result = await request(options).catch(e => console.log(e));
    return xmlParser(result)
}
