import * as discord from 'discord.js';
export const client = new discord.Client();

enum clientStates {
    default, 
};
let clientState: clientStates = clientStates.default;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function defaultStateResponses(message: discord.Message) {
    switch(message.content) {
        case "help": message.channel.send("help msg.");
        case ""
    }
}

client.on('message', message => {
    //only look at this channel.
    if(message.channel.valueOf()!=process.env.discordChannelId) return;
    //handle responses that respond at all states.
    switch(message.content) {
        case "help": message.channel.send("help msg."); return;
    }
    switch(clientState) {
        case clientStates.default: defaultStateResponses(message); break;
    }
  });