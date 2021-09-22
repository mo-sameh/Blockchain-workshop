pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./nftInterface.sol" ;

contract oracle is Ownable {
  uint private randNonce = 0;
  uint private modulus = 1000;
  bool private requested = false;
  uint public startTime ;
  mapping (uint256=>bool) pendingRequests;
  
  event GetAvgPriceEvent(address sender, uint id);
  
  event SetAvgPriceEvent(uint id, uint256 price);
  
  address private callbackContract;

  mainContractInterface instance;

  
  function setcallBackContract(address _newContract) public onlyOwner {
      callbackContract = _newContract;
      startTime = block.timestamp;
  }
  
  
  function getPrice() public returns(uint ){
    randNonce++;
    uint id = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % modulus;
    pendingRequests[id] = true;
    emit GetAvgPriceEvent(msg.sender,id);
    requested = true;
    return id;
      
  }
  
  function setPrice (uint _price, uint _id, address _caller) public onlyOwner{
      require(pendingRequests[_id],"request is not in my pending list");
      delete pendingRequests[_id];
      emit SetAvgPriceEvent(_id,_price);
      instance = mainContractInterface(callbackContract);
      instance.updateNextGenTime(_price,_id);
      requested = false;
      
  }
  function isRequested() public view returns(bool){
    return requested;
  }
  function getCallBackContract() public view returns(address){
    return callbackContract;
  }

}