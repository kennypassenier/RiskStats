import { PrismaClient, Player } from '@prisma/client'
import axios from "axios";
import cheerio, { Cheerio } from "cheerio";
const cliProgress = require("cli-progress");
import colors from "ansi-colors";
const prompt = require('prompt-sync')({sigint: true}); // Signal Interrupt let's users quit the script with CTRL+C
import { DetailedPLayerInfo } from './types';

const hasbroUrl = "https://www.hasbrorisk.com/en/player/";

const prisma = new PrismaClient();

async function main(){
  // Prompt users for names and iterate through those players
  const players: Player[] = await getPlayersInfo();
  for(let player of players){    
    // console.log(player);
    const detailedInfo: DetailedPLayerInfo = await getDetailedPlayerInfo(player);
    console.log();
    logPlayer(detailedInfo);
  }
}

function logPlayer(player: DetailedPLayerInfo): void{
  if(player.position === 0){
    console.log(`${player.name} has not played online this season`);
  }
  else{
    console.log(`${player.name} is placed in position ${player.position}`);
  }
  console.log(`Games won: ${player.won}/${player.played} (${player.winPercentage})`);
  console.log(`${hasbroUrl}${player.id}`);
  console.log();
}

async function getDetailedPlayerInfo(player: Player | null): Promise<DetailedPLayerInfo>{
  const detailedPlayer = {
    name: player?.name ?? "",
    id: player?.id ?? "", 
    position: 0, 
    played: 0,
    won: 0, 
    lost: 0,
    winPercentage: "0.00%"
  }
  try {
    // Load the website
    const {data} = await axios.get(hasbroUrl + player?.id);
    // console.log(data);
    const $ = cheerio.load(data);
    // console.log($);
    // The table we are most interested in is the one called Global Domination
    // Which is a table inside a div#gametype-4
    // This is the table with the online information
    let rawPlayed = $("#gametype-4 > table > tbody > tr:nth-child(1) > td:nth-child(2)").text() ?? "0";
    // console.log("rawplayer: " + rawPlayed);
    // This value has a , as a delimiter for thousands, which messes up the parsing
    let correctedPlayed = rawPlayed.replace(",", "");
    detailedPlayer.played = parseInt(correctedPlayed);
    let rawWon = $("#gametype-4 > table > tbody > tr:nth-child(2) > td:nth-child(2)").text() ?? "0";
    // console.log("rawWon: " + rawWon);
    let correctedWon = rawWon.replace(",", "");
    detailedPlayer.won = parseInt(correctedWon);
    detailedPlayer.lost = detailedPlayer.played - detailedPlayer.won;
    // If games played = 0, we can't divide by zero
    if(detailedPlayer.played > 0){
      detailedPlayer.winPercentage = (detailedPlayer.won / detailedPlayer.played * 100).toFixed(2) + "%";
    }
    // Our online player ranking is in a similar table hidden inside div#season-2
    // Todo: Automatically resolve which season is the last season 
    // So we don't have to hardcode the value of the current season

    // We get the raw value from the website
    let rawPosition = $("#season-2 > table > tbody > tr:nth-child(1) >td:nth-child(3)").text() ?? "0";
    // This value has a , as a delimiter for thousands, which messes up the parsing 
    let correctedPosition = rawPosition.replace(",", "");
    detailedPlayer.position = parseInt(correctedPosition);
    
  } catch (error) {
    console.error("Couldn't get detailed player info: ");
    // console.error(error);
  }

  // console.log(detailedPlayer);
  return detailedPlayer;

}

async function getPlayersInfo(): Promise<Player[]>{
  const playerNames: string[] = [];
  for(let i = 0; i < 6; i++){
    const name: string = prompt("Enter a username or leave empty to exit: ");
    if(name.toLowerCase() === ""){
      break;
    }
    else{
      playerNames.push(name);
    }
  }
  return await prisma.player.findMany({
    where:{
      name: {
        in: playerNames
      }
    }
  });
}

main();