// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GriddyVault} from "../src/GriddyVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract GriddyVaultTest is Test {
    GriddyVault vault;
    MockERC20 token;

    address bot = makeAddr("bot");
    address user = makeAddr("user");

    function setUp() public {
        token = new MockERC20("INIT", "INIT", 18);
        vault = new GriddyVault(address(token), bot);

        token.mint(user, 1000e18);
        vm.prank(user);
        token.approve(address(vault), type(uint256).max);
    }

    function test_deposit() public {
        vm.prank(user);
        vault.deposit(100e18);

        assertTrue(vault.hasDeposited(user));
        assertEq(token.balanceOf(address(vault)), 100e18);
    }

    function test_deposit_revert_zero() public {
        vm.prank(user);
        vm.expectRevert(GriddyVault.ZeroAmount.selector);
        vault.deposit(0);
    }

    function test_settle_less_than_balance() public {
        vm.prank(user);
        vault.deposit(100e18);

        vm.prank(bot);
        vault.settle(user, 80e18);

        assertEq(token.balanceOf(user), 980e18);
        assertEq(token.balanceOf(address(vault)), 20e18);
        assertFalse(vault.hasDeposited(user));
    }

    function test_settle_more_than_balance() public {
        vm.prank(user);
        vault.deposit(100e18);

        // user won big, gets capped to vault balance
        vm.prank(bot);
        vault.settle(user, 200e18);

        assertEq(token.balanceOf(user), 1000e18); // 900 + 100 (all vault has)
        assertEq(token.balanceOf(address(vault)), 0);
        assertFalse(vault.hasDeposited(user));
    }

    function test_settle_zero_payout() public {
        vm.prank(user);
        vault.deposit(100e18);

        vm.prank(bot);
        vault.settle(user, 0);

        assertEq(token.balanceOf(user), 900e18);
        assertEq(token.balanceOf(address(vault)), 100e18);
        assertFalse(vault.hasDeposited(user));
    }

    function test_settle_revert_not_bot() public {
        vm.prank(user);
        vault.deposit(100e18);

        vm.prank(user);
        vm.expectRevert(GriddyVault.OnlyBot.selector);
        vault.settle(user, 80e18);
    }

    function test_settle_revert_not_deposited() public {
        vm.prank(bot);
        vm.expectRevert(GriddyVault.NotDeposited.selector);
        vault.settle(user, 50e18);
    }

    function test_settle_revert_already_settled() public {
        vm.prank(user);
        vault.deposit(100e18);

        vm.prank(bot);
        vault.settle(user, 80e18);

        // second settle should revert
        vm.prank(bot);
        vm.expectRevert(GriddyVault.NotDeposited.selector);
        vault.settle(user, 10e18);
    }
}
