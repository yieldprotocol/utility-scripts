import { AbstractProvider, JsonRpcProvider, ethers } from "ethers";
import fs from "fs";
import csvWriter from "csv-write-stream";
import tokenList from "./tokenList.json";

require("dotenv").config();

export interface TokenHolder {
  tokenAddress: string;
  holderAddress: string;
  holderBalance: string;
}

async function getAllTokenHolders_(
  provider: AbstractProvider,
  tokenAddresses: string[]
): Promise<TokenHolder[]> {
  const tokenHolders = [] as TokenHolder[];

  await Promise.all(
    tokenAddresses.map(async (tokenAddress) => {
      console.log(`Getting holders and balances for ${tokenAddress}`);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          // Some details about the ERC20 Token standard interface
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "event Transfer(address indexed from, address indexed to, uint amount)",
        ],
        provider
      );

      /* get all transfer events */
      const filter = tokenContract.filters.Transfer(null, null);
      const events = await tokenContract.queryFilter(filter, 0, "latest");

      /* get unique holders from event list */
      const addresses = events.map(
        (event) => tokenContract.interface.parseLog(event as any)!.args.to
      );
      const uniqueAddresses = [...new Set(addresses)];

      /* get balances for each holder, if non-zero- write to file */
      await Promise.all(
        uniqueAddresses.map(async (address) => {
          const balance = await tokenContract.balanceOf(address);      
          +balance.toString() > 0 &&
            tokenHolders.push({
              tokenAddress,
              holderAddress: address,
              holderBalance: balance.toString(),
            });
        })
      );
    })
  );

  return tokenHolders;
}

export const getAllTokenHolders = async (
  tokens: string[],
  writeToFile: boolean = false
) => {

  // const network = "mainnet";
  // const provider = ethers.getDefaultProvider(network, {
  //   etherscan: process.env.ETHERSCAN_API_KEY,
  //   infura: process.env.INFURA_API_KEY,
  //   alchemy: process.env.ALCHEMY_API_KEY,
  // });

  const provider = new JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
  );
 
  const tokenHolders = await getAllTokenHolders_(provider, tokens);

  /* write token holders to csv file */
  if (writeToFile) {
    const writer = csvWriter({
      headers: ["token address", "holder address", "holder balance"],
    });
    writer.pipe(
      fs.createWriteStream("./src/getAllTokenHolders/output/tokenHolders.csv")
    );
    tokenHolders.forEach((tokenHolder) => {
      writer.write([
        tokenHolder.tokenAddress,
        tokenHolder.holderAddress,
        tokenHolder.holderBalance,
      ]);
    });
    writer.end();
  }

  /* also, return token holders a for standalone fun */
  return tokenHolders;
};

getAllTokenHolders(tokenList, true);
