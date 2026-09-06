// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SavingsCircle {
    uint256 public immutable contributionAmount;

    mapping(address => mapping(uint256 => bool)) public contributed;

    event ContributionReceived(
        address indexed member,
        uint256 indexed period,
        uint256 amount
    );

    constructor(uint256 _contributionAmount) {
        require(_contributionAmount > 0, "INVALID_AMOUNT");
        contributionAmount = _contributionAmount;
    }

    function contribute(uint256 period) external payable {
        require(msg.value == contributionAmount, "WRONG_AMOUNT");

        require(
            !contributed[msg.sender][period],
            "ALREADY_CONTRIBUTED"
        );

        contributed[msg.sender][period] = true;

        emit ContributionReceived(
            msg.sender,
            period,
            msg.value
        );
    }

    function hasContributed(
        address member,
        uint256 period
    ) external view returns (bool) {
        return contributed[member][period];
    }

    function circleBalance()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }
}