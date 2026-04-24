// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {GriddyVault} from "../src/GriddyVault.sol";

contract DeployGriddyVault is Script {
    function run() external {
        address initToken = vm.envAddress("INIT_TOKEN");
        address bot = vm.envAddress("BOT_ADDRESS");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        GriddyVault vault = new GriddyVault(initToken, bot);
        vm.stopBroadcast();

        console.log("GriddyVault deployed at:", address(vault));
    }
}
