import axios from "axios";
import fs from "fs";
require("dotenv").config();

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
    const { data } = await axios.get(
        `https://api.chainalysis.com/api/risk/v2/entities/${address}`,
        {
          headers: {
            Token: process.env.CHAINALYSIS_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
    return data;
};

const registerAndScreen = async (address: string) => {
    await registerAddress(address);
    screenAddress(address);
}

const getAddressesFromFile = ( path: string = './src/addressScreening/addressList.csv' ): string[] => {
    var addresses = fs.readFileSync(path)
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map(e => e.trim()) // remove white spaces for each line
    .map(e => e.split(',').map(e => e.trim())) // split each line to array
    .flat(); // remove empty values & flatten array
    return addresses
}

export const screenAddresses = async ( addressList: string[] ) => { 

    const addresses = addressList;
    console.log( addresses.length, 'addresses provided.' );

    const uniqueAddresses = [...new Set(addresses)];
    console.log( uniqueAddresses.length, 'unique addresses to screen.');

    const result = await Promise.all(
        uniqueAddresses
        .map(async (address:string) => {
            await registerAddress(address);
            return screenAddress(address);
        })
    );

    const jsonResult = JSON.stringify(result,null,2);

    fs.writeFile('screeningResults.json', jsonResult, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });

    return result;
}

screenAddresses( getAddressesFromFile() );