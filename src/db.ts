import * as mongoose from 'mongoose';
mongoose.connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
import * as models from './models';
export interface matchObj {
    name: string;
    teams: teamObj[];
}
export interface teamObj {
    people: string[];
    points: number;
}

export interface highScoreGetResponse {
    worked: boolean;
    results: {name: string; email:string; score:number;}[];
}

/**
 * @returns an object that describes the status. 
 * It returns results in sorted order.
 * @param results the number of results
 */
export async function getHighScores(results: number): Promise<highScoreGetResponse> {
    try {
        const result = await models.Person.find({}).sort({points: -1}).limit(results).exec();
        if(result.length==0) return {worked: false, results:[]}; 
        //there are results and now we process them and dump them out.
        let output: highScoreGetResponse = {worked: true, results:[]}
        for(let i=0;i<result.length; i++) {
            let targetUser = result[i];
            output.results.push({name: targetUser.name, email: targetUser.email, score: targetUser.points});
        }
        return output;
    } catch {
        return {worked: false, results:[]};
    }
    return {worked: false, results:[]};
}

export interface dbResponse {
    worked: boolean;
    msg ? : string;
}

/**
 * @returns an object describing the action taken.
 * @param title the title of the adjustment entry
 * @param emails the array of emails
 * @param points  the points to add to each person
 */
export async function newAdjustment(title: string, emails: string[], points: number): Promise < dbResponse > {
    try {
        const e = new models.Match();
        e.name = title;
        e.members.push({
            people: [],
            points: points,
        });
        //assert e.members.length ==1;
        for (let i = 0; i < emails.length; i++) {
            let email = emails[i];
            email = email.trim().toLowerCase();
            if (email.length < 1) return {worked: false,msg: "Check the emails; something looks wrong with them."};
            let emailRecords = await models.Person.find({email: email});
            if (emailRecords.length < 1) return {worked: false,msg: "email \"" + email + "\"  not present in the database."};
            if (emailRecords.length > 1) return {worked: false,msg: "email \"" + email + "\" contains more than one entry in the database. This must be fixed manually using mongoDB."};
            //assert emailRecords.length ==1;
            e.members[0].people.push(emailRecords[0]);
            //adjust the user record
            emailRecords[0].points+=points;
            await emailRecords[0].save();
        }
        await e.save();
    } catch {
        return {worked: false, msg:"there was some database error."};
    }
    return {worked: true};
}

/**
 * @returns and object describing if it worked.
 * @param email the users email
 * @param name the users name
 */
export async function newPerson(email: string, name: string): Promise < dbResponse > {
    try {
        email = email.trim().toLowerCase();
        //verify there is no such user.
        let emailRecords = await models.Person.find({email: email});
        if(emailRecords.length!=0) return {worked: false, msg:"this user already exists... update this user instead."};
        //no such user exists
        let user = new models.Person();
        user.email = email;
        user.name = name;
        await user.save();
    } catch {
        return {worked: false, msg:"there was some database error."};
    }
    return {worked: true};
}