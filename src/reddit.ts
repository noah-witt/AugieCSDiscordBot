import reddit from 'reddit-wrapper-v2';
import * as tiny from 'tiny-json-http';
import {getRedditChannel, client} from './discord';
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
export async function postMemes(){
    try {
        let result = await tiny.get({
            url:"https://www.reddit.com/r/ProgrammerHumor/top.json",
        });
        const data: subredditResult = result.body;
        const channel = await getRedditChannel();
        channel.send(`Top post on reddit. `)
    }
    catch(error){
        console.log(error);
    }
}
