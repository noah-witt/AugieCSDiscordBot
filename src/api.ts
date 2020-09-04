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
    key: string,
}


export interface user {
    name: string,
    value: string
}

export async function storeKey(key: string) {
    await models.KeyValue.remove({key:'auth'});
    const m = new models.KeyValue();
    m.key = 'auth';
    m.value = key;
    m.save();
}

async function validateRequest(request: message<any>): Promise<boolean>{
    let hash = crypto.enc.Base64.stringify(crypto.SHA3(request.key));
    let db = await models.KeyValue.find({key:'auth'});
    if(db.length ==0) return false;
    if(db[0].value!=hash) return false;
    //now we know there is an entry and it matches.
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

export interface userInspectQueryResult {
    person: models.PersonDoc,
    events: models.MatchDoc[],
}

export async function inspectUser(request: message<string>): Promise<userInspectQueryResult> {
    if(! (await validateRequest(request))) throw 'invalid auth';
    if(typeof request.content != 'string') throw 'invalid request';
    //the request is valid
    const temp = await models.Person.find({email:request.content}).sort('email').exec();
    if(temp.length==0) throw 'invalid email';
    const pObj = temp[0];
    const events = await models.Match.find({people: pObj._id}).populate('people').exec();
    return {
        person: pObj,
        events: events
    }
}

export interface adjustmentRequest {
    name: string,
    people: string[],
    points: number
}

export async function newAdjustment(request: message<adjustmentRequest>) {
    if(! (await validateRequest(request))) throw 'invalid auth';
    //valid request
    await db.newAdjustment(request.content.name, request.content.people, request.content.points);
    return {};
}

export async function remove(request: message<string>) {
    if(! (await validateRequest(request))) throw 'invalid auth';
    if(typeof request.content != 'string') throw 'invalid request';
    //valid request
    await db.removeByMatchId(request.content);
    return {};
}

interface highScores {
    name: string;
    email:string;
    score:number;
    id: string;
}

export async function getHighScores(request: message<number>): Promise<highScores[]> {
    if(! (await validateRequest(request))) throw 'invalid auth';
    if(typeof request.content!=='number') throw 'invalid content';
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
