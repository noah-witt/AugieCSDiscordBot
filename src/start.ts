import * as dotenv from "dotenv";
dotenv.config();
import * as discord from "./discord";
discord.client.login(process.env.discordLogin);
