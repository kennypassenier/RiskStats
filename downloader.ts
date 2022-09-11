import { PrismaClient } from '@prisma/client'
import axios from "axios";
import cheerio, { Cheerio } from "cheerio";
const cliProgress = require("cli-progress");
import colors from "ansi-colors";

const prisma = new PrismaClient();

type newPlayerObject = {id: string, name: string, position: number};


async function main(){

  // Number of pages to scrape  
  const LIMIT = await getPageLimit();

  // Time how long this script runs
  console.time("Runtime");

  // Create a progress bar so we can visually see the progress
  const progressBar = new cliProgress.SingleBar({
    format: colors.cyanBright('Page {value}/{total} ') + colors.redBright('{bar}'),
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  progressBar.start(LIMIT, 0);
  for(let i = 1; i <= LIMIT; i++){
    
    const url = `https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/${i}`;
    const players = await scrapePlayers(url);
    // console.log(players.length);
    for(let player of players){
      await prisma.player.upsert({
        where: {
          id: player.id
        },
        create:{
          id: player.id,
          name: player.name,
          position: player.position
        },
        update: {
          position: player.position
        }
      });
    }
    progressBar.increment(1);
  }
  progressBar.stop();

  // Stop the timer
  console.timeEnd("Runtime");
}

async function scrapePlayers(url: string): Promise<newPlayerObject[]>{
  const players: newPlayerObject[] = [];
  try {    
    const {data} = await axios.get(url);
    const $ = cheerio.load(data);
    const rows: Cheerio<any> = $(".risk-stats tr");
    rows.each((index, row) => {
      // First one is the heading of the table
      // We can safely ignore it
      if(index === 0) return;
      let newPlayer: newPlayerObject = {
        id: "",
        name: "",
        position: 0,
      };
  
      // Get the ID out of the URL
      let playerUrl = $(row).find("a").attr("href") ?? "notfound";
      // console.log(playerUrl);
      newPlayer.id = playerUrl.substring(playerUrl.length - 8);
      // Get the name
      newPlayer.name = $(row).find("a").text() ?? "notfound";
      // Get the position
      // Position has a , as delimiter for thousands, we replace it with nothing
      newPlayer.position = parseInt($(row).find("td").text().replace(",", "") ?? "0");    
      // console.log(newPlayer);
      players.push(newPlayer);
    });
  } catch (error) {
    
  }
  return players;
}



async function getPageLimit(): Promise<number>{
  let limit = 0;
  try {
    const { data } = await axios.get("https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints");
    const $ = cheerio.load(data);

    const rawlink = $("ul.pagination > li:last-child > a").attr("href") ?? "";
    const cleanedLink = rawlink.split("rankPoints/")[1];
    limit = parseInt(cleanedLink);
  } catch (error) {
    console.error("Couldn't get page limit");
  }
  return limit;
}

main();
