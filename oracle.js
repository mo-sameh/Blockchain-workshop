const fs =require("fs")

const HDWalletProvider = require("@truffle/hdwallet-provider")
const Web3 = require('web3')
const axios = require('axios')
const BN = require('bn.js')

const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY = process.env.PRIVATE_KEY_FILE || '../secret.txt'
//Owner that we will use to get all collections form open sea ---------VIP REPLACE-------------
const OWNER_PUBLIC_KEY = process.env.PUBLIC_KEY || "0xd65d551af8ebfac3e491b8a9ffb506726080287a" 
const WEB3_PROVIDER_ADDRESS = process.env.WEB3_PROVIDER_ADDRESS || "wss://matic-testnet-archive-ws.bwarelabs.com"
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3
const MAX_RETRIES = process.env.MAX_RETRIES || 5
const OracleJSON = require('./Blockchain/build/contracts/oracle.json')

var economics ={
  "a": 1,
"last_t" :1,
"counter": 1
}

var pendingRequests = []
const privateKeyStr = fs.readFileSync(PRIVATE_KEY, 'utf-8')

const options = {
  // Enable auto reconnection
  reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false
  }
};

  const wsProvider = new Web3.providers.WebsocketProvider(WEB3_PROVIDER_ADDRESS,options)
  HDWalletProvider.prototype.on = wsProvider.on.bind(wsProvider)
  const provider = new HDWalletProvider(privateKeyStr, wsProvider)
  const web3 = new Web3(provider)

  // LOCAl Network with Ganache
     // const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'))

async function getAvgSale(){  
	const resp = await axios({
    url: 'https://api.opensea.io/api/v1/collections',
    params: {
      asset_owner: OWNER_PUBLIC_KEY
    },
    method: 'get'
  })
  return Web3.utils.toWei(resp.data[0].stats.seven_day_average_price.toString(), 'ether')/1000000000
}



 function removeRequest(arr, requestID) { 
    
        return arr.filter(function(ele){ 
            return ele.id != requestID; 
        });
    }

async function getOracleContract (web3js) {
  const networkId = await web3js.eth.net.getId()
  // return new web3js.eth.Contract(OracleJSON.abi, OracleJSON.networks["3"].address)
  return new web3js.eth.Contract([
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "GetAvgPriceEvent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "SetAvgPriceEvent",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getCallBackContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isRequested",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_caller",
        "type": "address"
      }
    ],
    "name": "setPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newContract",
        "type": "address"
      }
    ],
    "name": "setcallBackContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
], "0xbDcc948eff3C091c79CaeC7219E14eCd6A50A783")
}

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


async function filterEvents (oracleContract, web3js) {
  oracleContract.events.GetAvgPriceEvent(async (err, event) => {
    if (err) {
      console.error('Error on event', err)
      return
    }
    let state = true
    let requestId = event.returnValues.id
    let sender = event.returnValues.sender 
    pendingRequests.push({id:requestId, state:state, callerAddress:sender,time : event.returnValues.time})
    console.log("Recieved a price request ")

    fs.writeFile('lastBlock.txt', parseInt(event.blockNumber).toString(), (err) => { if (err) throw err;  }) 
  })

    oracleContract.events.SetAvgPriceEvent(async (err, event) => {
    if (err){ 
    	console.error('Error on event', err)
    	return
    }
    let Id = event.returnValues.id
    let price = event.returnValues.price 
      //Request is only removed when response is recieved by the contract
    pendingRequests = removeRequest(pendingRequests,event.returnValues.id)
    console.log("Price has been updated in oracle")

  })
}

async function checkMissedEvents(oracleContract,web3js){
  lastBlock = fs.readFileSync("lastBlock.txt", 'utf-8')
  lastBlock = parseInt(lastBlock)
  console.log(lastBlock)
  oracleContract.getPastEvents('GetAvgPriceEvent', {fromBlock: lastBlock+1, toBlock: 'latest'}).then( function(events){
    for (var i = events.length - 1; i >= 0; i--) {
    let state = true
    let requestId = events[i].returnValues.id
    let sender = events[i].returnValues.sender 
    pendingRequests.push({id:requestId, state:state, callerAddress:sender})
    console.log("Missed a price request ")    
    fs.writeFile('lastBlock.txt', parseInt(events[i].blockNumber).toString(), (err) => { if (err) throw err;  }) 
  }

});
}

async function processQueue (oracleContract, ownerAddress) {
  let processedRequests = 0
  
  while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE && processedRequests < pendingRequests.length) {
    let req = pendingRequests[processedRequests]
    if (req.state){
    	await processRequest(oracleContract,  req.callerAddress ,ownerAddress, req.id)
	   // Set to false so it wont be processed mutiple times
      req.state =false 
  }
  
    processedRequests++
  }
}

async function processRequest (oracleContract, callerAddress,ownerAddress, id) {
  let retries = 0
  while (retries < MAX_RETRIES) {
    try {
      const avgSale = await getAvgSale()
      console.log(avgSale)
      await setAvgSale(oracleContract, callerAddress, ownerAddress, avgSale, parseInt(id))

      return
    } catch (error) {
      console.log(error)
      }
      retries++
    }
  }


async function setAvgSale(oracleContract, callerAddress, ownerAddress, avgSale, id){
try {
  getAccount().then(async (account) =>{
    // oracleContract.methods.pendingRequests(id.toString()).call().then(results => console.log(results))
    let start_t = await oracleContract.methods.startTime().call()
    let cur_t = await web3.eth.getBlock(await web3.eth.getBlockNumber())
    cur_t = cur_t.timestamp
    economics.last_t = cur_t - start_t
    let g = 6000*Math.sqrt(economics.last_t+2)
    let t= ((Math.ceil(economics.a * g) > 2592000) ? 2592000: Math.ceil(economics.a * g))
    economics.a = economics.counter/(economics.counter+1)*(economics.a+economics.last_t/avgSale)
    economics.counter += 1
    await oracleContract.methods.setPrice(t, id,callerAddress).send({ from: account ,gas : 100000})
  })
    
  } catch (error) {
    console.log('Error encountered while calling setAvgSale.')
    console.log('error')
    // Do some error handling
  }
}

function saveEconomics(){
  const data = JSON.stringify(economics);

// write JSON string to a file
fs.writeFile('economics.json', data, (err) => {
    if (err) {
        throw err;
    }
    console.log("economics data is saved.");
});
}
function readEconomics(){
  fs.readFile('economics.json', 'utf-8', (err, data) => {
    if (err) {
        throw err;
    }

    economics = JSON.parse(data.toString());

    console.log("economics is initialized");
});
}

async function init () {
	web3js = web3
  // readEconomics();
	var ownerAddress =OWNER_PUBLIC_KEY
  const oracleContract = await getOracleContract(web3js)
   checkMissedEvents(oracleContract,web3js)
   filterEvents(oracleContract, web3js)
  
  return { oracleContract, ownerAddress }
}

(async () => {
  const { oracleContract, ownerAddress } = await init()
  oracleContract.methods.isRequested().call().then(results => console.log(results))
  // oracleContract.getPastEvents('SetAvgPriceEvent',{fromBlock: 0, toBlock: 'latest'}).then(results => console.log(results))
process.on( 'SIGINT', () => {
    console.log('Calling wsProvider.disconnect()')
    wsProvider.disconnect()
    saveEconomics()
    process.exit()
  })

  setInterval(async () => {
    await processQueue(oracleContract, ownerAddress)
  
      
  }, SLEEP_INTERVAL)
})()