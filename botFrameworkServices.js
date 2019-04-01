const { BotFrameworkAdapter, ConversationState, MemoryStorage } = require('botbuilder');
const { BotConfiguration } = require('botframework-config');
const { EchoBot } = require('./app/botServices');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));

let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error('\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.');
    console.error('\n - You can find the botFilePath and botFileSecret in the Azure App Service application settings.');
    console.error('\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.');
    console.error('\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n');
    process.exit();
}

const DEV_ENVIRONMENT = 'development';
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

let conversationState;

const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);

const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword,
    channelService: process.env.ChannelService,
    openIdMetadata: process.env.BotOpenIdMetadata
});

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${error}`);
    // Send a message to the user
    await context.sendActivity('Oops. Something went wrong!');
    // Clear out state
    await conversationState.clear(context);
    // Save state changes.
    await conversationState.saveChanges(context);
};

const bot = new EchoBot(conversationState);

const port = process.env.port || process.env.PORT || 3978;

process.adapter = adapter;
module.exports = { adapter, bot, port };
