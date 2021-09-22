const mainContract = artifacts.require("bedaNFT");
const mumbai = {
	"linkToken": "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
	"vrfCordinator":"0x8C7382F9D8f56b33781fE506E897a4F1e2d17255",
	"keyHash":"0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4"
}

const kovan = {
	"linkToken": "0xa36085F69e2889c224210F603D836748e7dC0088",
	"vrfCordinator":"0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9",
	"keyHash":"0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4"
}
// const fs = require('fs');
// const account = fs.readFileSync("secret.txt").toString().trim();
module.exports = function (deployer,network,accounts) {
	console.log(accounts[0])
  deployer.deploy(mainContract,kovan["vrfCordinator"],kovan['linkToken'],kovan['keyHash'],{from: accounts[0]});
};
