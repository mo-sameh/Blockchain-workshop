pragma solidity 0.8.4;

interface oracleInterface {
    function getPrice() external returns (uint);
}
