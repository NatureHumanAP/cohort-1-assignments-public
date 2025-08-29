// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IMiniAMM, IMiniAMMEvents} from "./IMiniAMM.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MiniAMM is IMiniAMM, IMiniAMMEvents {
    uint256 public k = 0;
    uint256 public xReserve = 0;
    uint256 public yReserve = 0;

    address public tokenX;
    address public tokenY;

    // implement constructor
    constructor(address _tokenX, address _tokenY) {
        require(_tokenX != address(0), "tokenX cannot be zero address");
        require(_tokenY != address(0), "tokenY cannot be zero address");
        require(_tokenX != _tokenY, "Tokens must be different");
        
        // Ensure tokenX < tokenY for consistent ordering
        if (_tokenX < _tokenY) {
            tokenX = _tokenX;
            tokenY = _tokenY;
        } else {
            tokenX = _tokenY;
            tokenY = _tokenX;
        }
    }

    // add parameters and implement function.
    // this function will determine the initial 'k'.
    function _addLiquidityFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal {
        require(xAmountIn > 0 && yAmountIn > 0, "Amounts must be greater than 0");
        
        // Transfer tokens from user to contract
        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);
        
        // Set initial reserves and k
        xReserve = xAmountIn;
        yReserve = yAmountIn;
        k = xAmountIn * yAmountIn;
        
        emit AddLiquidity(xAmountIn, yAmountIn);
    }

    // add parameters and implement function.
    // this function will increase the 'k'
    // because it is transferring liquidity from users to this contract.
    function _addLiquidityNotFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal {
        require(xAmountIn > 0 && yAmountIn > 0, "Amounts must be greater than 0");
        
        // Calculate required y amount based on current ratio
        uint256 yRequired = (xAmountIn * yReserve) / xReserve;
        require(yAmountIn >= yRequired, "Insufficient y amount");
        
        // Transfer tokens from user to contract
        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yRequired);
        
        // Update reserves and k
        xReserve += xAmountIn;
        yReserve += yRequired;
        k = xReserve * yReserve;
        
        emit AddLiquidity(xAmountIn, yRequired);
    }

    // complete the function
    function addLiquidity(uint256 xAmountIn, uint256 yAmountIn) external {
        if (k == 0) {
            // add params
            _addLiquidityFirstTime(xAmountIn, yAmountIn);
        } else {
            // add params
            _addLiquidityNotFirstTime(xAmountIn, yAmountIn);
        }
    }

    // complete the function
    function swap(uint256 xAmountIn, uint256 yAmountIn) external {
        // 1. 유효성 검사
        require(xAmountIn > 0 || yAmountIn > 0, "Must swap at least one token");
        require(xAmountIn == 0 || yAmountIn == 0, "Can only swap one direction at a time");
        require(k > 0, "No liquidity in pool");
        
        if (xAmountIn > 0) {
            // 2. tokenX를 tokenY로 스왑
            require(xReserve > 0, "Insufficient liquidity");
            
            // 스왑 크기를 현재 유동성의 일정 비율로 제한
            uint256 maxSwapRatio = 50; // 50%
            require(xAmountIn <= (xReserve * maxSwapRatio / 100), "Insufficient liquidity");
            
            // 3. 입력 토큰 전송
            IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
            
            // 4. 출력 계산 (상수 곱 공식)
            uint256 yOut = yReserve - (k / (xReserve + xAmountIn));
            require(yOut > 0, "Insufficient output");
            
            // 5. 리저브 업데이트
            xReserve += xAmountIn;
            yReserve -= yOut;
            
            // 6. 출력 토큰 전송
            IERC20(tokenY).transfer(msg.sender, yOut);
            
            // 7. 이벤트 발생
            emit Swap(xAmountIn, yOut);
        } else {
            // 8. tokenY를 tokenX로 스왑
            require(yReserve > 0, "Insufficient liquidity");
            
            // 스왑 크기를 현재 유동성의 일정 비율로 제한
            uint256 maxSwapRatio = 50; // 50%
            require(yAmountIn <= (yReserve * maxSwapRatio / 100), "Insufficient liquidity");
            
            // 9. 입력 토큰 전송
            IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);
            
            // 10. 출력 계산 (상수 곱 공식)
            uint256 xOut = xReserve - (k / (yReserve + yAmountIn));
            require(xOut > 0, "Insufficient output");
            
            // 11. 리저브 업데이트
            yReserve += yAmountIn;
            xReserve -= xOut;
            
            // 12. 출력 토큰 전송
            IERC20(tokenX).transfer(msg.sender, xOut);
            
            // 13. 이벤트 발생
            emit Swap(xOut, yAmountIn);
        }
    }
}
