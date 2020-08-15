import * as mongoose from 'mongoose';
import * as moment from 'moment-timezone';
import * as fs from 'fs';
mongoose.connect("mongodb://localhost:27018/results2020", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
interface dataStore {
    id: string;
    photo ? : string;
    name: string;
    phone ? : string;
    status: string;
    location: string;
    box ? : string;
    email: string;
};
interface dateStoreFile {
    data: dataStore[];
}
import * as models from './models';
const rawdata = fs.readFileSync('./result.json');
//@ts-ignore
const people: dateStoreFile = JSON.parse(rawdata);

async function doUpdate(person: dataStore) {
    try {
        const result = await models.Person.find({
            email: person.email
        });
        if (result.length == 0) {
            let user = new models.Person();
            user.name = person.name;
            user.email = person.email;
            await user.save();
        } else if (result.length == 1) {
            result[0].name = person.name;
            await result[0].save();
        } else {
            console.log("failed to update");
            console.log(person);
        }
    } catch(error){
        console.log('failed');
        console.log(person);
        console.log(error);
    }
}

async function go(people: dateStoreFile) {
    for (let i = 0; i < people.data.length; i++) {
        await doUpdate(people.data[i]);
    }
    console.log("Done");
}
go(people);