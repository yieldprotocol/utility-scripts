import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import {
  TokenHolder,
  getAllTokenHolders,
} from "../getAllTokenHolders/getAllTokenHolders";

import tokenList from "./tokenList.json";

const generateMerkleTree_ = async (token: string) => {
  const tokenHolders = await getAllTokenHolders([token]);
  
  const values = tokenHolders.map((tokenHolder: TokenHolder) => {
    return [ tokenHolder.holderAddress, tokenHolder.holderBalance ];
  });

  const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
  console.log("Merkle Root:", tree.root);
  fs.writeFile(__dirname +`/output/${token}.json`, JSON.stringify(tree.dump()), ()=>console.log("done"));
};

export const generateMerkleTrees = async(tokens: string[]) =>{ 
  for (const token of tokens) {
    await generateMerkleTree_(token)
  }
  // generateMerkleTree_("0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD")
}

generateMerkleTrees(tokenList);