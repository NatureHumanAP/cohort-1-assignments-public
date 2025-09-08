#!/bin/bash

# Path to the broadcast artifact (inside container)
BROADCAST_PATH="./cohort-1-assignments-public/1a/broadcast/MiniAMM.s.sol/1337/run-latest.json"

if [ ! -f "$BROADCAST_PATH" ]; then
    echo "❌ Broadcast file not found: $BROADCAST_PATH"
    exit 1
fi

echo "📝 Extracting contract addresses..."

# Extract addresses using grep and sed (no jq needed)
MOCK_ERC_0=$(grep -A 5 '"contractName": "MockERC20"' "$BROADCAST_PATH" | grep '"contractAddress"' | head -1 | sed 's/.*"contractAddress": "\([^"]*\)".*/\1/')
MOCK_ERC_1=$(grep -A 5 '"contractName": "MockERC20"' "$BROADCAST_PATH" | grep '"contractAddress"' | tail -1 | sed 's/.*"contractAddress": "\([^"]*\)".*/\1/')
MINI_AMM=$(grep -A 5 '"contractName": "MiniAMM"' "$BROADCAST_PATH" | grep '"contractAddress"' | sed 's/.*"contractAddress": "\([^"]*\)".*/\1/')

# Create deployment.json
cat > ./deployment.json << EOF
{
    "mock_erc_0": "$MOCK_ERC_0",
    "mock_erc_1": "$MOCK_ERC_1",
    "mini_amm": "$MINI_AMM"
}
EOF

echo "✅ Contract addresses extracted to deployment.json:"
cat ./deployment.json
