// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MiniAMM} from "../src/MiniAMM.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract MiniAMMScript is Script {
    MiniAMM public miniAMM;
    MockERC20 public token0;
    MockERC20 public token1;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy mock ERC20 tokens
        // Deploy first mock token
        token0 = new MockERC20("Token A", "TKA");

        // Deploy second mock token  
        token1 = new MockERC20("Token B", "TKB");
        
        // Deploy MiniAMM with the tokens
        miniAMM = new MiniAMM(address(token0), address(token1));

        // Log deployment addresses
        console.log("Token0 deployed at:", address(token0));
        console.log("Token1 deployed at:", address(token1));
        console.log("MiniAMM deployed at:", address(miniAMM));
        vm.stopBroadcast();
    }
}
