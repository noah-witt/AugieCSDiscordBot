import * as dotenv from "dotenv";
dotenv.config();
import * as discord from "./discord";
import * as db from "./db";
import * as webApp from './web';
import * as reddit from './reddit';
import * as moment from 'moment-timezone';
reddit.postMemes();
discord.client.login(process.env.discordLogin);
if(process.env.enableWeb=="true") webApp.app.listen(process.env.PORT, () => console.log(`server listening at http://localhost:8080`))