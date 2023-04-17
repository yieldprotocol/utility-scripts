import axios from "axios";
import * as fs from "fs";

import * as previousScreens from './screeningOutput.json';

require("dotenv").config();

const timeout = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))

const registerAddress = async (address: string): Promise<string> => {
  const { data } = await axios.post(
    "https://api.chainalysis.com/api/risk/v2/entities",
    { address },
    {
      headers: {
        Token: process.env.CHAINALYSIS_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return data.address;
};

const screenAddress = async (address: string) => {
  // await timeout(1000);
  // const data = {address: address, risk: "UNKNOWN"}
  const { data } = await axios.get(
    `https://api.chainalysis.com/api/risk/v2/entities/${address}`,
    {
      headers: {
        Token: process.env.CHAINALYSIS_API_KEY,
        "Content-Type": "application/json",
      },
    }
  ).catch(() => { return { data: {address: address, risk: "UNKNOWN"} }} );
  return data;
};

const getAddressesFromFile = (
  path: string = "./src/addressScreening/addressList.csv"
): string[] => {
  var addresses = fs
    .readFileSync(path)
    .toString() // convert Buffer to string
    .split("\n") // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(",").map((e) => e.trim())) // split each line to array
    .flat(); // remove empty values & flatten array
  return addresses;
};


export const runScreening = async (
  addressList: string[],
  registerAddresses: boolean = true
) => {

  const addresses = addressList;
  console.log(addresses.length, "Addresses provided.");
  const uniqueAddresses = [...new Set(addresses)];
  console.log(uniqueAddresses.length, "Unique addresses to screen.");

  let screened = previousScreens;
  const screenedAddresses = previousScreens.map((a:any)=> a.address);
  console.log( screenedAddresses );

  registerAddresses &&
    (await Promise.all(
      uniqueAddresses.map((address: string, index: number) =>
        registerAddress(address)
      )
    ));

  console.log("Screening in progress...");

  for (const add of uniqueAddresses) {
    if (screened.find((a:any)=> a.address === add) ) {
      console.log('Skipped: ', add)
    } else {
      const res = await screenAddress(add);
      screened.push( res as any )
      console.log('Screened: ', res)
    }
  }

  const jsonResult = JSON.stringify(screened, null, 2);
  fs.writeFile(
    "./src/addressScreening/screeningOutput.json",
    jsonResult,
    (err) => {
      if (err) throw err;
      console.log("Data written to file");
    }
  );

  return screened
};

runScreening(getAddressesFromFile(), false);


export const report = (severity: "HIGH" | "MEDIUM" | "LOW") => {
  const data = fs.readFileSync("./src/addressScreening/screeningOutput.json");
  const dataJson = JSON.parse(data as unknown as string);
  // console.log(JSON.parse(data as unknown as string));
  console.log(dataJson);
  // console.log(dataJson.filter((a:any)=> a.  ) )
};

// report( 'MEDIUM' );
