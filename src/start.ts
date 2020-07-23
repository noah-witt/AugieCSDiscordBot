import * as dotenv from "dotenv";
dotenv.config();
import * as discord from "./discord";
import * as db from "./db";
import * as webApp from './web';
discord.client.login(process.env.discordLogin);
if(process.env.enableWeb=="true") webApp.app.listen(process.env.PORT, () => console.log(`Example app listening at http://localhost:8080`))