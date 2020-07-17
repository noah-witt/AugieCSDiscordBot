import * as mongoose from 'mongoose';
mongoose.connect(process.env.MONGO, {useNewUrlParser: true, useUnifiedTopology: true});
import * as models from './models';
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
    const uids: mongoose.Types.ObjectId[] = [];
    m.teams.forEach(async (e) => {
        e.members.forEach( async (i) =>{
            let p = models.Person.find({email: i}).exec();
            try {
                let temp = await p;
                if(temp.length<1) return false;
                uids.push(temp[0]._id);
            } catch {
                return false;
            }
        });
    });
    
    return true;
}