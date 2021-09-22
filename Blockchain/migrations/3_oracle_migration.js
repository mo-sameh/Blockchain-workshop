const oracle = artifacts.require("oracle");
const mainContract = artifacts.require("bedaNFT");
// const fs = require('fs');
// const account = fs.readFileSync("secret.txt").toString().trim();
module.exports = function (deployer,network,accounts) {
	console.log(accounts[1])
  deployer.deploy(oracle,{from: accounts[0]}).then( async ()=>{
  		 let nft = await mainContract.deployed()
  		let myoracle = await oracle.deployed()
  		myoracle.setcallBackContract(nft.address,{from: accounts[0]})
  		nft.setOracleContract(myoracle.address,{from: accounts[0]})

  })
 

};
