// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IMiniAMM, IMiniAMMEvents} from "./IMiniAMM.sol";
import {MiniAMMLP} from "./MiniAMMLP.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MiniAMM is IMiniAMM, IMiniAMMEvents, MiniAMMLP {
    uint256 public k = 0;
    uint256 public xReserve = 0;
    uint256 public yReserve = 0;
    
    // Swap fee: 0.3% (3000 basis points = 0.3%)
    uint256 public constant SWAP_FEE = 3000; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 1000000; // 100% in basis points

    // implement constructor
    constructor(address _tokenX, address _tokenY) MiniAMMLP(_tokenX, _tokenY) {
        require(_tokenX != address(0), "tokenX cannot be zero address");
        require(_tokenY != address(0), "tokenY cannot be zero address");
        require(_tokenX != _tokenY, "Tokens must be different");
    }

    // Helper function to calculate square root
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // add parameters and implement function.
    // this function will determine the 'k'.
    function _addLiquidityFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal returns (uint256 lpMinted) {
        // First time: LP = sqrt(x * y) (geometric mean)
        lpMinted = sqrt(xAmountIn * yAmountIn);
        
        // Update reserves
        xReserve = xAmountIn;
        yReserve = yAmountIn;
        k = xAmountIn * yAmountIn;
        
        // Mint LP tokens
        _mintLP(msg.sender, lpMinted);
        
        emit AddLiquidity(xAmountIn, yAmountIn);
    }

    // add parameters and implement function.
    // this function will increase the 'k'
    // because it is transferring liquidity from users to this contract.
    function _addLiquidityNotFirstTime(uint256 xAmountIn) internal returns (uint256 lpMinted) {
        // Not first time: LP = (x_deposited / x_existing) * LP_existing
        lpMinted = (xAmountIn * totalSupply()) / xReserve;
        
        // Calculate yAmountIn based on current ratio
        uint256 yAmountIn = (xAmountIn * yReserve) / xReserve;
        
        // Update reserves
        xReserve += xAmountIn;
        yReserve += yAmountIn;
        k = xReserve * yReserve;
        
        // Mint LP tokens
        _mintLP(msg.sender, lpMinted);
        
        emit AddLiquidity(xAmountIn, yAmountIn);
    }

    // complete the function. Should transfer LP token to the user.
    function addLiquidity(uint256 xAmountIn, uint256 yAmountIn) external returns (uint256 lpMinted) {
        require(xAmountIn > 0 && yAmountIn > 0, "Amounts must be greater than 0");
        
        // Transfer tokens from user to contract
        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);
        
        if (totalSupply() == 0) {
            // First time adding liquidity
            lpMinted = _addLiquidityFirstTime(xAmountIn, yAmountIn);
        } else {
            // Not first time - use ratio-based calculation
            lpMinted = _addLiquidityNotFirstTime(xAmountIn);
        }
        
        return lpMinted;
    }

    // Remove liquidity by burning LP tokens
    function removeLiquidity(uint256 lpAmount) external returns (uint256 xAmount, uint256 yAmount) {
        require(lpAmount > 0, "LP amount must be greater than 0");
        require(balanceOf(msg.sender) >= lpAmount, "Insufficient LP tokens");
        
        // Calculate amounts to withdraw based on LP share
        xAmount = (lpAmount * xReserve) / totalSupply();
        yAmount = (lpAmount * yReserve) / totalSupply();
        
        // Burn LP tokens
        _burnLP(msg.sender, lpAmount);
        
        // Update reserves
        xReserve -= xAmount;
        yReserve -= yAmount;
        k = xReserve * yReserve;
        
        // Transfer tokens back to user
        IERC20(tokenX).transfer(msg.sender, xAmount);
        IERC20(tokenY).transfer(msg.sender, yAmount);
        
        // No specific event for liquidity removal in interface
    }

    // complete the function
    function swap(uint256 xAmountIn, uint256 yAmountIn) external {
        require(xAmountIn > 0 || yAmountIn > 0, "Must swap at least one token");
        require(xAmountIn == 0 || yAmountIn == 0, "Can only swap one direction at a time");
        
        uint256 xAmountOut;
        uint256 yAmountOut;
        
        if (xAmountIn > 0) {
            // Swapping X for Y
            require(xReserve > 0 && yReserve > 0, "No liquidity in pool");
            require(xAmountIn <= xReserve, "Insufficient liquidity");
            
            // Apply swap fee (0.3%)
            uint256 xAmountInWithFee = (xAmountIn * 997000) / 1000000;
            
            // Calculate output using CPAMM formula with fee
            // (x + 0.997 * Δx) * (y - Δy) = k
            uint256 newX = xReserve + xAmountInWithFee;
            uint256 newY = (xReserve * yReserve) / newX;
            yAmountOut = yReserve - newY - 1;
            
            require(yAmountOut > 0, "Insufficient liquidity");
            require(yAmountOut < yReserve, "Insufficient liquidity");
            require(yAmountOut < yReserve * 99 / 100, "Insufficient liquidity");
            
            // Transfer input token from user
            IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
            
            // Update reserves
            xReserve += xAmountIn;
            yReserve -= yAmountOut;
            
            // Transfer output token to user
            IERC20(tokenY).transfer(msg.sender, yAmountOut);
            
            emit Swap(xAmountIn, 0, 0, yAmountOut);
        } else {
            // Swapping Y for X
            require(xReserve > 0 && yReserve > 0, "No liquidity in pool");
            require(yAmountIn <= yReserve, "Insufficient liquidity");
            
            // Apply swap fee (0.3%)
            uint256 yAmountInWithFee = (yAmountIn * 997000) / 1000000;
            
            // Calculate output using CPAMM formula with fee
            uint256 newY = yReserve + yAmountInWithFee;
            uint256 newX = (xReserve * yReserve) / newY;
            xAmountOut = xReserve - newX - 1;
            
            require(xAmountOut > 0, "Insufficient liquidity");
            require(xAmountOut < xReserve, "Insufficient liquidity");
            require(xAmountOut < xReserve * 99 / 100, "Insufficient liquidity");
            
            // Transfer input token from user
            IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);
            
            // Update reserves
            yReserve += yAmountIn;
            xReserve -= xAmountOut;
            
            // Transfer output token to user
            IERC20(tokenX).transfer(msg.sender, xAmountOut);
            
            emit Swap(0, yAmountIn, xAmountOut, 0);
        }
    }
}
