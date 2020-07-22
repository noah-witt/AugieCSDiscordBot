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

async function processDm(m: discord.Message){
    switch(m.content) {
        case "rank":
            printRank(m);
            return;
    }
    if(m.content.startsWith("inspect ")) {
        let eml = m.content.substr("inspect ".length);
        eml = eml.trim().toLowerCase();
        inspectUser(m,eml);
        return;
    }
    if(m.content.startsWith("inspect show id ")) {
        let eml = m.content.substr("inspect show id ".length);
        eml = eml.trim().toLowerCase();
        inspectUser(m,eml,true);
        return;
    }
    m.channel.send("rank: prints rankings.\n inspect {email}: inspects a user.")
}

async function inspectUser(m: discord.Message, email: string, showID?: boolean) {
    try {
        let response = await db.inspectUser(email);
        if(!response.worked) m.channel.send("Something went wrong.");
        let msg = response.name+" <"+response.email+">\n\n"+
        "points: "+response.points+" matches:"+response.events.length+"\n"+
        "matches list\n\n";
        response.events.forEach((e)=>{
            msg+="name: "+e.name+"\t date:"+e.date+"\t points:"+e.points+"\t with: "+(e.with.length==0?'none':e.with.toString());
            if(showID==true) msg+=" id:"+e.id;
            msg+="\n";
        });
        m.channel.send(msg);
    } catch {
        m.channel.send("something went wrong.");
    }
}

function printRmMsg(dbMsg: db.removedEventResponse, m: discord.Message){
    if(!dbMsg.worked){
        m.channel.send("did not work.");
        return;
    }
    if(typeof dbMsg.event == 'undefined') return;
    m.channel.send("removed record:\n name: "+dbMsg.event.name+" date:"+dbMsg.event.date+" points:"+dbMsg.event.points); 
}

client.on('message', async message => {
    //dont look at anything from bots.
    if(message.author.bot) return;

    //short circuit this on dm.
    if(message.channel.type=="dm") {
        processDm(message);
        return;
    } 
    //only look at this channel.
    if(message.channel.valueOf()!=process.env.discordChannelId) return;

    switch(message.content) {
        case "help": message.channel.send(  "Hello. Your talking to the Augie CS club ranking bot. \n\n"+
                                            "Anyone can DM me some commands\n"+
                                            "Commands\n"+
                                            "----------\n"+
                                            "create user {email} {name}. Creates user with email and name\n"+
                                            "adjust {email,email2,email3} {points} {adjustment name}. adds or removes points the emails should be comma separated with no spaces.\n"+
                                            "rank. prints the rankings\n"+
                                            "inspect {email} inspects the user. prints all results.\n"+
                                            "inspect show id {email}. inspects the user and prints ids for events.\n"+
                                            "rm recent. removes the most recent change. Think of this as undo.\n"+
                                            "rm {id}. removes the event with the stated id.\n"+
                                            "rename user {email} {name}. changes the users name" );
            return;
        case "rank":
            printRank(message);
            return;
        case "rm recent":
            const rmMsg = await db.removeMostRecentMatch();
            printRmMsg(rmMsg, message);
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
    if(message.content.startsWith("inspect show id ")) {
        let eml = message.content.substr("inspect show id ".length);
        eml = eml.trim().toLowerCase();
        inspectUser(message,eml,true);
        return;
    }
    if(message.content.startsWith("inspect ")) {
        let eml = message.content.substr("inspect ".length);
        eml = eml.trim().toLowerCase();
        inspectUser(message,eml);
        return;
    }
    if(message.content.startsWith("rm ")) {
        let id = message.content.substr("rm ".length);
        const rmMsg = await db.removeByMatchId(id);
        printRmMsg(rmMsg, message);
        return;
    }
    if(message.content.startsWith("rename user ")){
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
        
        const response = await db.renameUser(cmds[0], cmds[1]);
        if(response == false) message.channel.send('did not work.');
        else message.channel.send('worked.');
        return;
    }
    message.channel.send("Ask for help by sending \"help\".");
  });