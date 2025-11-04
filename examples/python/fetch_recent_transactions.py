"""
Example: Fetch recent transactions for a wallet using the Helius RPC.

Author: seare hagos Abraha (@Ashon_Chain)
Repository: https://github.com/helius-labs/helius-sdk
"""

import requests
from typing import Any, Dict

API_KEY = "YOUR_HELIUS_API_KEY"
WALLET_ADDRESS = "EnterWalletAddressHere"

def fetch_recent_transactions(wallet: str) -> Dict[str, Any]:
    """Fetch the most recent transactions for a given wallet address."""
    url = f"https://mainnet.helius-rpc.com/?api-key={API_KEY}"
    payload = {
        "jsonrpc": "2.0",
        "id": "helius-python-demo",
        "method": "getSignaturesForAddress",
        "params": [wallet, {"limit": 5}],
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        print("✅ Recent Transactions:")
        return response.json()
    except requests.RequestException as exc:
        print(f"❌ Request failed: {exc}")
        return {}

if __name__ == "__main__":
    data = fetch_recent_transactions(WALLET_ADDRESS)
    print(data)
