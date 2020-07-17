import * as discord from 'discord.js';
import * as db from './db';
export const client = new discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function processDbResponse( r: db.dbResponse,c: discord.TextChannel | discord.DMChannel | discord.NewsChannel): boolean {
    if (typeof r.msg == 'undefined') r.msg = ""; 
    if(r.worked) c.send("it worked. "+r.msg);
    else c.send("it didn't work. "+r.msg);
    return r.worked;
}

async function printRank(m: discord.Message){
    const numToPrint = 10;
    const data = await db.getHighScores(numToPrint);
    if(!data.worked) {
        m.channel.send("something went wrong.");
        return false;
    }
    let msg = "Top Scores\n------\nname\t\t\tscore\t\t\temail\n";
    data.results.forEach((e)=>{
        msg+=(e.name+"\t\t\t"+e.score+"\t\t\t"+e.email+"\n");
    });
    m.channel.send(msg);
    return true;
}  


client.on('message', async message => {
    //dont look at anything from bots.
    if(message.author.bot) return;
    //if(message.type)
    //only look at this channel.
    if(message.channel.valueOf()!=process.env.discordChannelId) return;

    switch(message.content) {
        case "help": message.channel.send(  "Hello. Your talking to the Augie CS club ranking bot. \n\n"+
                                            "Commands\n\n"+
                                            "----------\n\n"+
                                            "create user {email} {name}. Creates user with email and name\n"+
                                            "adjust {email,email2,email3} {points} {adjustment name}. adds or removes points the emails should be comma seperated with no spaces.\n");
            return;
        case "rank":
            printRank(message);
            return;
    }
    if(message.content.startsWith("create user ")) {
        let cmds = message.content.substr("create user ".length).split(' ');
        for(let i=0; i<cmds.length; i++) cmds[i] = cmds[i].trim();

        //re concat the names
        for(let i=cmds.length; i>2;i--) {
            cmds[i-2]+=" "+cmds.pop();
        }
        if(cmds.length!=2) {
            message.channel.send("you either have too many or two few arguments.");
            return;
        };
        
        const response = await db.newPerson(cmds[0], cmds[1]);
        if(!processDbResponse(response, message.channel)) return;
        return;
    }
    if(message.content.startsWith("adjust ")) {
        let cmds = message.content.substr("adjust ".length).split(' ');
        for(let i=0; i<cmds.length; i++) cmds[i] = cmds[i].trim();
        //re concat the name
        for(let i=cmds.length; i>3;i--) {
            cmds[i-2]+=" "+cmds.pop();
        }
        if(cmds.length!=3) {
            message.channel.send("you either have too many or two few arguments.");
            return;
        }
        let points = 0;
        try {
            points = Number.parseFloat(cmds[1]);
        } catch {
            message.channel.send('there was some problem with your number. This is paramter 2.');
        }
        //send to db
        const response = await db.newAdjustment(cmds[2], cmds[0].split(','), points);
        if(!processDbResponse(response, message.channel)) return;
        return;
    }
  });