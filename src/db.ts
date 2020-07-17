import * as mongoose from 'mongoose';
mongoose.connect(process.env.MONGO, {useNewUrlParser: true, useUnifiedTopology: true});
import * as models from './models';
import { prependOnceListener } from 'process';
export interface matchObj {
    name: string;
    teams: teamObj[];
}
export interface teamObj {
    winner: boolean;
    members: string[];
    points: number;
}

export function isTeamobj(o: any|teamObj): o is teamObj {
    if(typeof o.winner != "boolean") return false;
    if(typeof o.points !="number") return false;
    if(!Array.isArray(o.members)) return false;
    o.members.array.forEach(element => {
        if(typeof element != "string") return false;
    });
    return true;
}

export function isMatchObj(o: any|matchObj): o is matchObj {
    if(!Array.isArray(o.teams)) return false;
    if(typeof o.name != 'string') return false;
    o.teams.array.forEach(element => {
        if(!isTeamobj(element)) return false;
    });
    return true;
}
/**
 * @returns true if worked.
 * @param m the new match object
 */
export async function newTeam(m: matchObj): Promise<boolean> {
    let store = new models.Match();
    store.name = m.name;
    m.teams.forEach(async (e) => {
        if(typeof e.winner == 'undefined') e.winner = false;
        const member = {points: e.points, win: e.winner, people:[]};
        e.members.forEach( async (i) =>{
            let p = models.Person.find({email: i}).exec();
            try {
                let temp = await p;
                if(temp.length<1) return false;
                member.people.push(temp[0]._id);
            } catch {
                return false;
            }
        });
        //@ts-ignore
        store.members.push(member);
    });
    await store.save();
    return true;
}