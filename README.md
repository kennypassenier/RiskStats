# RiskStats

## Why?

The developers of Risk: Global Domination have removed the ability to view the statistics of your opponents. These stats are still available on the website. 
I wanted to be able to see those statistics. I also wanted to practice writing TypeScript. 

## How?

There are a couple of files that perform different functions. There are commands (found in package.json) to run these commands. 
Run these by opening up a terminal and entering "npm run" + the name of the command

* "devStart": "nodemon downloader.ts" => Runs downloader.ts and reloads the script every time we save a file. Only useful in development
* "compile": "tsc --watch" => Everytime a file gets saved, this command will compile our project into JavaScript
* "clean": "ts-node cleanDatabase.ts" => Removes all player information out of the database
* "scrape": "ts-node asyncDownloader.ts" => Runs our scraper, get information about every Risk: Global Domination player and save it in the DB 
* "start": "ts-node playerInfo.ts" => Asks the user to input names and gets the most recent information about their games (Needs the scraped data from above to work)
