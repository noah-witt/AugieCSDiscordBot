import * as dotenv from "dotenv";
dotenv.config();
import * as discord from "./discord";
import * as db from "./db";
import * as webApp from './web';
discord.client.login(process.env.discordLogin);
if(process.env.enableWeb=="true") webApp.app.listen(8080, () => console.log(`Example app listening at http://localhost:8080`))