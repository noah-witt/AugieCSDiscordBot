import * as crypto from 'crypto-js';
import * as eccrypto from 'eccrypto';
import * as moment from 'moment-timezone';
import * as db from './db';
import * as models from './models';
import * as fs from 'fs';

export interface message<T> {
    content: T,
    nonce: string,
    unix: number,
    sig: string,
}


export interface user {
    name: string,
    value: string
}

const nonceUsed: string[] = [];
let publicKey: Buffer;
/**
 * the number of milliseconds to allow the clocks to be desynced.
 */
const MAX_MS_WINDOW = 1000;

async function validateRequest(request: message<any>): Promise<boolean>{
    const msDiff = moment(request.unix).diff(moment());
    if(Math.abs(msDiff)>MAX_MS_WINDOW) return false;
    const hash = crypto.SHA3(request.unix+'/'+request.nonce).toString();
    try {
        //@ts-expect-error
        const result = eccrypto.verify(publicKey, hash, request.sig);
    } catch (error) {
        return false;
    }
    if(nonceUsed.includes(request.nonce)) return false;
    nonceUsed.push(request.nonce);

    //only keep 1000 nonces. This should not be a problem as long as requests are not being flooded and times are not drifting too much.
    if(nonceUsed.length>1000) nonceUsed.shift();
    //if we are here it passed sig
    return true;
}

export async function getUserList(request: message<null>): Promise<user[]> {
    if(! (await validateRequest(request))) throw 'invalid auth';
    //the request is valid
    const result: user[]= [];
    const temp = await models.Person.find({}).sort('email').exec();
    for(let i=0; i< temp.length; i++) {
        const target = temp[i];
        result.push({name: `${target.name} <${target.email}>`, value: target.email});
    }
    return result;
}
interface highScores {
    name: string;
    email:string;
    score:number;
    id: string;
}

export async function getHighScores(request: message<number>): Promise<highScores[]> {
    if(! (await validateRequest(request))) throw 'invalid auth';
    //the request is valid
    const result = await models.Person.find({}).sort({points: -1}).limit(request.content).exec();
    const output: highScores[] = [];
    for(let i=0;i<result.length; i++) {
        let targetUser = result[i];
        output.push({name: targetUser.name, email: targetUser.email, score: targetUser.points, id: targetUser._id});
    }
    return output;
}

interface eventCreate {
    name: string;
    points: number;
    people: string[];
}

export async function createEvent(request: message<eventCreate>): Promise<boolean> {
    if(! (await validateRequest(request))) throw 'invalid auth';
    //the request is valid
    await db.newAdjustment(request.content.name, request.content.people, request.content.points);
    return true;
}

export async function loadKey(){
    try {
        publicKey = fs.readFileSync('public.key');
        console.log('loaded key');
    } catch (error) {
        console.log(error);
    }
}