// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IMiniAMMFactory} from "./IMiniAMMFactory.sol";
import {MiniAMM} from "./MiniAMM.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MiniAMMFactory is IMiniAMMFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairNumber);
    
    constructor() {}
    
    // implement
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    // implement
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Identical addresses");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // Ensure consistent ordering
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        require(getPair[token0][token1] == address(0), "Pair exists");
        
        // Create new MiniAMM pair
        bytes memory bytecode = abi.encodePacked(type(MiniAMM).creationCode, abi.encode(token0, token1));
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        require(pair != address(0), "Failed to create pair");
        
        // Store pair information
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // Populate mapping in the reverse direction
        allPairs.push(pair);
        
        emit PairCreated(token0, token1, pair, allPairs.length);
        
        return pair;
    }
    
    // Helper function to get pair address
    function getPairAddress(address tokenA, address tokenB) external view returns (address) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return getPair[token0][token1];
    }
    
    // Helper function to check if pair exists
    function pairExists(address tokenA, address tokenB) external view returns (bool) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return getPair[token0][token1] != address(0);
    }
}
