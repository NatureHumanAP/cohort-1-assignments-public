// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {MiniAMMFactory} from "../src/MiniAMMFactory.sol";
import {MiniAMM} from "../src/MiniAMM.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract FactoryScript is Script {
    MiniAMMFactory public miniAMMFactory;
    MockERC20 public token0;
    MockERC20 public token1;
    address public pair;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Step 1: Deploy MiniAMMFactory
        console.log("Deploying MiniAMMFactory...");
        miniAMMFactory = new MiniAMMFactory();
        console.log("MiniAMMFactory deployed at:", address(miniAMMFactory));

        // Step 2: Deploy two MockERC20 tokens
        console.log("Deploying MockERC20 tokens...");
        token0 = new MockERC20("Token A", "TKA");
        token1 = new MockERC20("Token B", "TKB");
        console.log("Token0 deployed at:", address(token0));
        console.log("Token1 deployed at:", address(token1));

        // Step 3: Create a MiniAMM pair using the factory
        console.log("Creating MiniAMM pair...");
        pair = miniAMMFactory.createPair(address(token0), address(token1));
        console.log("Pair created at:", pair);

        // Verify the pair was created correctly
        address retrievedPair = miniAMMFactory.getPair(address(token0), address(token1));
        require(retrievedPair == pair, "Pair address mismatch");
        console.log("Pair verification successful!");

        // Display deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("MiniAMMFactory:", address(miniAMMFactory));
        console.log("Token0 (TKA):", address(token0));
        console.log("Token1 (TKB):", address(token1));
        console.log("Pair Address:", pair);
        console.log("Total Pairs:", miniAMMFactory.allPairsLength());

        vm.stopBroadcast();
    }
}
