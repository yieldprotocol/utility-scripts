# Random Utility-scripts

## getAllTokenHolders
Fetches all the token holders and balances ( >0) for a list of tokens.
Usage: 
1. Add token addresses to the ```./src/getAllTokenHolders/tokenList.json``` file.
2. run ```yarn && yarn getAllTokenHolders``` 


## getAllVaults
Fetches all the vaults that were built in a particular cauldron.
Usage: 
1. Set to the desired chainId in the  ```./src/getAllVaults/chainId.json``` file. (currently only "1" or "42161")
2. run ```yarn && yarn getAllVaults``` 
