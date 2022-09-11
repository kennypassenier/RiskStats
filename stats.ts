import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


async function main(){
  console.log("Database tests");
  let amount = await prisma.player.count();
  let distinctNames = await prisma.player.findMany({
    where: {},
    distinct: ["name"]
  })
  let distinctIds = await prisma.player.findMany({
    where: {},
    distinct: ["id"]
  })
  console.log("Amount of records: " + amount);
  console.log(`Distinct names: ${distinctNames.length} / ${amount - distinctNames.length}`);
  console.log(`Distinct ids: ${distinctIds.length} / ${amount - distinctIds.length}`);

}

main();
