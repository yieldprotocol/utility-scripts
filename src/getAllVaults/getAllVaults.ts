import { AbstractProvider, JsonRpcProvider, ethers } from "ethers";
import fs from "fs";
import csvWriter from "csv-write-stream";

require("dotenv").config();

export interface Vault {
  id: string;
  owner: string;
  ilkId: string;
  seriesId: string;
}

async function getAllVaults_(provider: AbstractProvider): Promise<Vault[]> {
  // const vaults = [] as Vault[];
  const cauldronContract = new ethers.Contract(
    "0xc88191F8cb8e6D4a668B047c1C8503432c3Ca867", // '0x23cc87FBEBDD67ccE167Fa9Ec6Ad3b7fE3892E30'
    [
      "event VaultBuilt(bytes12 indexed vaultId, address indexed owner, bytes6 indexed seriesId, bytes6 ilkId)",
    ],
    provider
  );

  /* Get a list of the vaults that were BUILT */
  const vaultsBuiltFilter = cauldronContract.filters.VaultBuilt(null, null, null, null);
  const vaultsBuilt = await cauldronContract.queryFilter(vaultsBuiltFilter!);

  const vaults = vaultsBuilt.map((x:any) => {
    const { vaultId: id, ilkId, seriesId, owner } = x.args;
    return {
      id,
      seriesId,
      ilkId,
      owner,
    };
  });
  return vaults;
}

export const getAllVaults = async (writeToCSVFile: boolean = false) => {
  const provider = new JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
  );

  const vaults = await getAllVaults_(provider);

  /* write token holders to csv file */
  if (writeToCSVFile) {
    const writer = csvWriter({
      headers: ["Owner", "ilkId", "seriesId", "id"],
    });
    writer.pipe(
      fs.createWriteStream("./src/getAllVaults/output/vaults.csv")
    );
    vaults.forEach((vault: Vault) => {
      writer.write([
        vault.owner,
        vault.ilkId,
        vault.seriesId,
        vault.id,
      ]);
    });
    writer.end();
  }

  /* write token holders to json file */
  fs.writeFileSync(__dirname + `/output/vaults.json`, JSON.stringify(vaults));
  /* also, return token holders a for standalone fun */
  return vaults;
};

getAllVaults(true);
