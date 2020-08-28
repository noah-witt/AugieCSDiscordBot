import * as tiny from 'tiny-json-http';
import {getRedditChannel, client} from './discord';
import {RedditPost, KeyValue} from './models';
import * as moment from 'moment-timezone';
interface subredditResult {
    kind: string;
    data: {
        moddash: string;
        dist: number;
        after: string|null;
        before: string|null;
        children: subredditPostResult[];
    }
}
interface subredditPostResult {
    kind: string,
    data: {
        approved_at_utc: any;
        subreddit: string;
        selftext: string;
        author_fullname: string;
        saved: boolean;
        mod_reason_title: string;
        gilded: number;
        clicked: boolean;
        title: string;
        subreddit_name_prefixed: string;
        hidden: boolean;
        pwls: number;
        downs: number;
        upvote_ratio: number;
        url: string;
        created_utc: number;
        author: string;
        subreddit_id: string;
        id: string;
        is_video: boolean;
    }
}

interface xkcdInfoJson {
    month: number,
    num: number,
    link: string,
    year: number,
    news: string,
    safe_title: string,
    transcript: string,
    alt: string,
    img: string,
    title: string,
    day: number
}
/**
 * the number of minutes between XKCD updates.
 */
const XKCDPollRate: number = 60;

/**
 * schedule the next XKCD update.
 */
export function scheduleNextXKCD() {
    setTimeout(pollXKCD, XKCDPollRate*60*1000);
}

/**
 * poll xkcd then schedule next update.
 */
export async function pollXKCD (){
    //bypass at night
    if(moment().hour()>Number.parseInt(process.env.quietHourBegin) || moment().hour()<Number.parseInt(process.env.quietHourEnd) ) {
        scheduleNextXKCD();
        return;
    }
    try {
        const newest: xkcdInfoJson = (await tiny.get({url: "https://xkcd.com/info.0.json"})).body;
        const latestPosted = await KeyValue.find({key:"latestXKCD"}).exec();
        if(latestPosted.length==0) {
            sendNewestXKCD();
            const latestPosted = new KeyValue();
            latestPosted.key = "latestXKCD";
            latestPosted.value = newest.num.toString();
            latestPosted.save();
        } else if(Number.parseInt(latestPosted[0].value)<newest.num) {
            sendNewestXKCD();
            latestPosted[0].value = newest.num.toString();
            latestPosted[0].save();
        }
    } catch (error){
        console.log(error);
    }
    scheduleNextXKCD();
}

/**
 * sends a random XKCD
 */
export async function sendRandomXKCD(){
    try {
        const newest: xkcdInfoJson = (await tiny.get({url: "https://xkcd.com/info.0.json"})).body;
        const num = Math.floor(Math.random()*(newest.num-1+1)+1);
        sendXKCD(num);

    } catch (error) {
        console.log(error);
    }
}

/**
 * sends the newest XKCD
 */
export async function sendNewestXKCD(){
    try {
        const newest: xkcdInfoJson = (await tiny.get({url: "https://xkcd.com/info.0.json"})).body;
        const channel = await getRedditChannel();
        channel.send(`XKCD ${newest.num}: ${newest.safe_title} \n ${newest.img}`);

    } catch (error) {
        console.log(error);
    }
}
/**
 * sends the number of XKCD
 * @param num the number
 */
export async function sendXKCD(num: number){
    try {
        const target: xkcdInfoJson = (await tiny.get({url: `https://xkcd.com/${num}/info.0.json`})).body;
        const channel = await getRedditChannel();
        channel.send(`XKCD ${target.num}: ${target.safe_title}\n ${target.img}`);
        channel.send(target.img);
    } catch (error) {
        console.log(error);
    }
}

/**
 * @returns true if the item has been sent before and is stored in the DB.
 * @param item the item to check
 */
async function notSentBefore(item: subredditPostResult): Promise<boolean>{
    const result = await RedditPost.find({postId: item.data.id, subId: item.data.subreddit_id});
    return result.length==0;
}

/**
 * records the record of posting.
 * @param item the meme.
 */
function storePost(item: subredditPostResult) {
    const p = new RedditPost();
    p.subId = item.data.subreddit_id;
    p.postId = item.data.id;
    p.save();
}

/**
 * @description posts most recent meme to the discord channel.
 * makes sure it isn't posted before.
 * this fails silently and just prints to log. This is to prevent any errors from killing the app.
 */
export async function postMemes(){
    try {
        let result = await tiny.get({
            url:"https://www.reddit.com/r/ProgrammerHumor/top.json",
        });
        const data: subredditResult = result.body;
        const channel = await getRedditChannel();
        let target = data.data.children[0];
        let i =1;
        while(!(await notSentBefore(target))) {
            target = data.data.children[i];
            i++;
        }
        storePost(target);
        channel.send(`${target.data.title} by ${target.data.author} \n${target.data.url}`);
    }
    catch(error){
        console.log(error);
    }
}

/**
 * @description generates the next time that a post should be sent.
 */
function getNextWakeupTime():moment.Moment {
    const time = moment().tz(process.env.TZ).startOf('day');
    while((!time.isAfter(moment())) || time.hour()>Number.parseInt(process.env.quietHourBegin) || time.hour()<Number.parseInt(process.env.quietHourEnd) ) time.add(process.env.minutesBetweenPosts, 'minutes');
    console.log("next meme send "+time.toString());
    return time;
}

/**
 * returns the seconds till next wakeup time.
 */
function secondsTillNextWakeupTime() {
    return getNextWakeupTime().unix()-moment().unix();
}

/**
 * schedules the next meme post using the wakeuptime system.
 * this will loop and then schedule the next wakeup.
 */
export function scheduleNextSend() {
    setTimeout(postMemeSchedule, secondsTillNextWakeupTime()*1000);
}

/**
 * posts memes and then schedules the next post.
 */
export async function postMemeSchedule() {
    await postMemes();
    scheduleNextSend();
}

/** 
 * bootstrap and waits a few seconds to hopefully make sure things are working at least sorta.
*/
export async function bootstrap() {
    setTimeout(scheduleNextSend, 15000);
    setTimeout(pollXKCD, 10000);
}