// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// bot.js is your bot's main entry point to handle incoming activities.

const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser } = require('./userService');

// Turn counter property
const TURN_COUNTER_PROPERTY = 'turnCounterProperty';

class EchoBot {
    /**
     *
     * @param {ConversationState} conversation state object
     */
    constructor (conversationState) {
        // Creates a new state accessor property.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors
        this.countProperty = conversationState.createProperty(TURN_COUNTER_PROPERTY);
        this.conversationState = conversationState;
    }
    /**
     *
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn (context) {
        saveOrUpdateUser({ activity: context.activity });

        if (context.activity.type === ActivityTypes.Message) {
            // read from state.
            let count = await this.countProperty.get(context);
            count = count === undefined ? 1 : ++count;
            await context.sendActivity(`${count}: You said "${context.activity.text}"`);
            // increment and set turn counter.
            await this.countProperty.set(context, count);
        } else {
            // Generic handler for all other activity types.
            await context.sendActivity(`[${context.activity.type} event detected]`);
        }
        // Save state changes
        await this.conversationState.saveChanges(context);
    }
}

exports.EchoBot = EchoBot;
