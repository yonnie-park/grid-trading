// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract GriddyVault {
    IERC20 public immutable INIT;
    address public immutable bot;

    mapping(address => bool) public hasDeposited;

    event Deposited(address indexed user, uint256 amount);
    event Settled(address indexed user, uint256 amount);

    error OnlyBot();
    error ZeroAmount();
    error NotDeposited();

    modifier onlyBot() {
        if (msg.sender != bot) revert OnlyBot();
        _;
    }

    constructor(address _INIT, address _bot) {
        INIT = IERC20(_INIT);
        bot = _bot;
    }

    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        INIT.transferFrom(msg.sender, address(this), amount);
        hasDeposited[msg.sender] = true;
        emit Deposited(msg.sender, amount);
    }

    function settle(address user, uint256 amount) external onlyBot {
        if (!hasDeposited[user]) revert NotDeposited();

        hasDeposited[user] = false;

        uint256 balance = INIT.balanceOf(address(this));
        uint256 payout = amount > balance ? balance : amount;

        if (payout > 0) {
            INIT.transfer(user, payout);
        }

        emit Settled(user, payout);
    }
}
