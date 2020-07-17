import * as dotenv from "dotenv";
dotenv.config();
import * as discord from "./discord";
import * as db from "./db";
discord.client.login(process.env.discordLogin);
