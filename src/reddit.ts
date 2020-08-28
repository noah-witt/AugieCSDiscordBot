import * as tiny from 'tiny-json-http';
import {getRedditChannel, client} from './discord';
import {RedditPost} from './models';
import * as moment from 'moment-timezone';
//https://www.reddit.com/r/ProgrammerHumor/top/
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
 * makes sure it isnt posted before.
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
        channel.send(`${target.data.url}`);
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
    //console.log("next wakeup "+time.toString());
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
}