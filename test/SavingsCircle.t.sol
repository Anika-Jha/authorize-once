// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SavingsCircle.sol";

contract SavingsCircleTest is Test {
    SavingsCircle circle;

    uint256 constant CONTRIBUTION = 0.001 ether;

    address member = address(0x1234);

    function setUp() public {
        circle = new SavingsCircle(CONTRIBUTION);

        vm.deal(member, 1 ether);
    }

    function testAcceptsExactContribution() public {
        vm.prank(member);

        circle.contribute{value: CONTRIBUTION}(1);

        assertTrue(
            circle.hasContributed(member, 1)
        );
    }

    function testRejectsWrongAmount() public {
        vm.prank(member);

        vm.expectRevert("WRONG_AMOUNT");

        circle.contribute{value: 0.002 ether}(1);
    }

    function testRejectsDuplicatePeriod() public {
        vm.startPrank(member);

        circle.contribute{value: CONTRIBUTION}(1);

        vm.expectRevert("ALREADY_CONTRIBUTED");

        circle.contribute{value: CONTRIBUTION}(1);

        vm.stopPrank();
    }
}