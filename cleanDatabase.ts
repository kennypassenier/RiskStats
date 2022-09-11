import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


async function cleanDB(){
  console.log("This one is supposed to clean the database");
  let result = await prisma.player.deleteMany();
  console.log(result);

}

cleanDB();
