// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MiniAMMLP is ERC20, Ownable {
    address public tokenX;
    address public tokenY;
    
    constructor(address _tokenX, address _tokenY) ERC20("MiniAMM LP", "MINI-LP") Ownable(msg.sender) {
        // Ensure consistent ordering (tokenX < tokenY)
        if (_tokenX < _tokenY) {
            tokenX = _tokenX;
            tokenY = _tokenY;
        } else {
            tokenX = _tokenY;
            tokenY = _tokenX;
        }
    }

    function _mintLP(address to, uint256 amount) internal {
        _mint(to, amount);
    }

    function _burnLP(address from, uint256 amount) internal {
        _burn(from, amount);
    }

    // LP Token의 총 공급량을 반환
    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }

    // 특정 주소의 LP Token 잔액을 반환
    function getLPBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}