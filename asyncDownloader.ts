import { PrismaClient } from '@prisma/client'
import axios from "axios";
import cheerio, { Cheerio } from "cheerio";
const cliProgress = require("cli-progress");
import colors from "ansi-colors";

const prisma = new PrismaClient();
const WORKER_AMOUNT = 200;
let LIMIT = 0;
let finishedRequests = 0;

type newPlayerObject = {id: string, name: string};
const progressBar = new cliProgress.SingleBar({
  format: colors.cyanBright('Page {value}/{total} ') + colors.redBright('{bar}'),
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});


async function main(){
  
  // Number of pages to scrape  
  LIMIT = await getPageLimit();
  console.log("LIMIT: " + LIMIT);
  progressBar.start(LIMIT, 0);

  // Time how long this script runs
  // console.time("Runtime");
  for(let i = 1; i <= WORKER_AMOUNT; i++){    
    scrape(i);    
  }
  
  // Stop the timer
  // console.timeEnd("Runtime");
}

async function scrape(pageNumber: number): Promise<any>{
  if(finishedRequests >= LIMIT){
    progressBar.stop();
  }
  if(pageNumber > LIMIT) {
    return;
  };
  const url = `https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/${pageNumber}`;
  scrapePlayers(url, pageNumber);
  
}

async function scrapePlayers(url: string, pageNumber: number): Promise<any>{
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
        name: ""
      };
  
      // Get the ID out of the URL
      let playerUrl = $(row).find("a").attr("href") ?? "notfound";
      // console.log(playerUrl);
      newPlayer.id = playerUrl.substring(playerUrl.length - 8);
      // Get the name
      newPlayer.name = $(row).find("a").text() ?? "notfound";  
      // console.log(newPlayer);
      players.push(newPlayer);
    });
  } catch (error) {
    progressBar.setTotal(++LIMIT);
    scrape(pageNumber);


  }
  try {
    for(let player of players){
      await prisma.player.upsert({
        where: {
          id: player.id
        },
        create:{
          id: player.id,
          name: player.name,
        },
        update: {
          
        }
      });
    }
    finishedRequests++;
    progressBar.increment(1);
    scrape(pageNumber + WORKER_AMOUNT);
    
  } catch (error) {
    // console.error("Problem upserting player");
    // console.error(error);
  }
  
}



async function getPageLimit(): Promise<number>{
  let limit = 0;
  try {
    const { data } = await axios.get("https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints");
    // console.log(data);
    const $ = cheerio.load(data);
    const rawlink = $("ul.pagination > li:last-child > a").attr("href") ?? "";
    // console.log(rawlink);
    const cleanedLink = rawlink.split("rankPoints/")[1];
    limit = parseInt(cleanedLink);
    // console.log(cleanedLink);
  } catch (error) {
    console.error("Couldn't get page limit");
    main();
  }
  return limit;
}

main();
