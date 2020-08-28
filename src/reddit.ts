import * as tiny from 'tiny-json-http';
import {getRedditChannel, client} from './discord';
import {RedditPost} from './models';
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
 * @description posts most recent meme to the discord channel.
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
        while(await notSentBefore(target)) {
            target = data.data.children[i];
            i++;
        }
        const p = new RedditPost();
        p.subId = target.data.subreddit_id;
        p.postId = target.data.id;
        p.save();

        channel.send(`${target.data.url}`);
    }
    catch(error){
        console.log(error);
    }
}
