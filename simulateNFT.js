const fs =require("fs")

const HDWalletProvider = require("@truffle/hdwallet-provider")
const Web3 = require('web3')
const axios = require('axios')
const BN = require('bn.js')

const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './Oracle/secret.txt'
//Owner that we will use to get all collections form open sea
const OWNER_PUBLIC_KEY = process.env.PUBLIC_KEY || "0x72471300312807b0557c00367a5499e0d0723c3c" 
const WEB3_PROVIDER_ADDRESS = process.env.WEB3_PROVIDER_ADDRESS || "wss://rpc-mumbai.maticvigil.com/ws/v1/353145229985d56b4e2fd27f57e72ae2c4a57e6b"
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3
const MAX_RETRIES = process.env.MAX_RETRIES || 5
const OracleJSON = require('./Final/build/contracts/bedaNFT.json')

// const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const privateKeyStr = fs.readFileSync(PRIVATE_KEY_FILE_NAME, 'utf-8')


 const wsProvider = new Web3.providers.WebsocketProvider(WEB3_PROVIDER_ADDRESS)
  HDWalletProvider.prototype.on = wsProvider.on.bind(wsProvider)
  const provider = new HDWalletProvider(privateKeyStr, wsProvider)
  const web3 = new Web3(provider)

const getAccount = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err === null) {
        resolve(accounts[0]);
      } else {
        reject(err);
      }
    });
  });
};

async function init (){
const networkId = await web3.eth.net.getId()

const nftContract =  new web3.eth.Contract(OracleJSON.abi, OracleJSON.networks[networkId].address)	
nftContract.methods.getOracleService().call().then(results => console.log(results))
getAccount().then(account => {
  console.log(nftContract.methods.getNextGenTime().call().then(results => console.log(results)))
	nftContract.methods.checkTime().send({from:account, gas:600000}).then(results => console.log(results))
})

}
init()

