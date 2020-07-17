import * as discord from 'discord.js';
import * as db from './db';
export const client = new discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});



client.on('message', message => {
    //only look at this channel.
    if(message.channel.valueOf()!=process.env.discordChannelId) return;

    switch(message.content) {
        case "help": message.channel.send("help msg."); return;
        case "newMatch": message.channel.send("Specify a match object"); return;
    }
    if(message.content.startsWith("newMatch ")) {
        const text = message.content.substr("newMatch ".length);
        const inObj = JSON.parse(text);
        if(!db.isTeamobj(inObj)) {
            message.channel.send("That team object you sent is malformed. Try Again. You can use "+process.env.generatorLink+" to make this.");
            return false;
        }
        
    }
  });