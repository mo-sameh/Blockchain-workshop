pragma solidity 0.8.4;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./oracleInterface.sol" ;
// import "base64-sol/base64.sol";
contract bedaNFT is ERC721, VRFConsumerBase, Ownable{
    
    address oracleContract ;
	oracleInterface priceOracle;
    
    uint DEFAULT_GEN_DAYS = 1;
    string  baseUri = "https://ipfs.io/ipfs/QmbSMLXKg4Qe3bTHRDQ58hqxQNfr9rNebRrxabuGYEKrFo/"  ;
    mapping (uint => bool) priceOracleRequests;
    
    mapping (bytes32 => bool) VRFOracleRequests;
    uint256 public tokenCounter;
    bytes32 internal keyHash;
    uint256 internal fee;

    mapping(address => uint) public tokensToClaim;

    uint nextGenTime;

    event newMint(uint256 tokenId);
    event new_Winner(address winnerAddress);
 

    constructor (address _VRFCoordinator, address _LinkToken, bytes32 _KeyHash) 
    public 
    VRFConsumerBase(_VRFCoordinator, _LinkToken)
    ERC721(" BEDA", "BEDA"){
        //_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        tokenCounter = 0;
        keyHash = _KeyHash;
        fee = 0.1 * 10 ** 18;
    }

    modifier onlyOracle(){
        require(msg.sender == oracleContract, "This function can only be called by oracle contract");
        _;
        
    }
  
     function uint2str(uint256 _i)internal pure returns (string memory str){
      if (_i == 0)
      {
        return "0";
      }
      uint256 j = _i;
      uint256 length;
      while (j != 0)
      {
        length++;
        j /= 10;
      }
      bytes memory bstr = new bytes(length);
      uint256 k = length;
      j = _i;
      while (j != 0)
      {
        bstr[--k] = bytes1(uint8(48 + j % 10));
        j /= 10;
      }
      str = string(bstr);
    }
    
    function checkTime() public{
        //updateNextGen();
        if (block.timestamp > nextGenTime){
            generateFunction();
            tokensToClaim[msg.sender]++;
           //_setupRole(ONE_TIME_MINTER, winner);
            emit new_Winner(msg.sender);
            // set the next gen time temporary for a defualt time until the next gen time is calculated and set
            nextGenTime = block.timestamp + (DEFAULT_GEN_DAYS * 1 days );
            
        }
    }

    function generateFunction() internal {
        bytes32 requestId = requestRandomness(keyHash, fee);
        VRFOracleRequests[requestId] = true;
        uint id = priceOracle.getPrice();
		priceOracleRequests[id] = true;
        
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override{
        require(VRFOracleRequests[requestId],"The passed request is not in my pending requests");
        delete VRFOracleRequests[requestId]; 
        uint256 winningToken = randomNumber % tokenCounter;
        address winner = ownerOf(winningToken);
        tokensToClaim[winner]++;
        emit new_Winner(msg.sender);
        //_setupRole(ONE_TIME_MINTER, winner);

    }

	function updateNextGenTime(uint _timePeriod,uint _requestId) public onlyOracle {
	require(priceOracleRequests[_requestId],"The passed request is not in my pending requests");
	delete priceOracleRequests[_requestId];
    // ADD Kareem's economics function using the price
    nextGenTime += _timePeriod - (DEFAULT_GEN_DAYS * 1 days);
	}

    function claimReward() public {
        require(tokensToClaim[msg.sender] > 0, "No tokens to claim!");
        address newOwner = msg.sender;
        uint256 newItemId = tokenCounter;
        _safeMint(newOwner,newItemId);
        // revokeRole(,msg.sender)
        tokenCounter = tokenCounter +1;
        tokensToClaim[newOwner]--;
        emit newMint(newItemId);
    }

   function mintToken() public{
        require(tokenCounter < 100);
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        tokenCounter = tokenCounter + 1;
        emit newMint(newItemId);
    }
    
    
   function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory imageUri = string(abi.encodePacked(baseUri,uint2str(tokenId),'.png'));
         return string(abi.encodePacked(
                                    '{"name":',
                                    '"Katkoot ',uint2str(tokenId),'",',
                                    '"description": "This NFT was genrated by a genrative model, hopeffuly you love your katkoot", "image": "',
                                    imageUri,
                                    '"}'
                                    ));
            }
    
    
    // Change the address that will call the update price function
    function setOracleContract(address _oracle) public onlyOwner {
        oracleContract = _oracle;
        priceOracle = oracleInterface(oracleContract);
    }
    
    // Change the address that will call the update price function
    function setDefaultGenTime(uint _no_Days) public onlyOwner {
        DEFAULT_GEN_DAYS = _no_Days;
    }
    function setBaseUri(string memory _newBaseURi) public onlyOwner{
        baseUri = _newBaseURi;
    }
	
	function getNextGenTime() view public returns (uint){
	return nextGenTime;
	} 
	function getOracleAddress() public view returns(address){
    return oracleContract;
  }

}