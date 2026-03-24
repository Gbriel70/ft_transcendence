# Blockchain Module

## Why we use blockchain

We use blockchain to guarantee transaction integrity and traceability.

Main reasons:
- immutable transaction history
- verifiable proof for each transfer
- stronger trust model between services and users
- clear separation between business records and settlement records

In short, the database stores operational history, while blockchain stores the irreversible proof of value transfer.

## How it works in this project

The blockchain module is responsible for wallet and transfer operations, and it is consumed by the transaction flow.

High-level flow:
1. A user requests a transfer from the application.
2. The transaction service validates identity and business rules.
3. The transaction service requests execution from the blockchain service.
4. The blockchain service executes the transfer and returns a chain transaction hash.
5. The transaction service stores both:
   - local transaction record
   - blockchain hash as immutable proof

This creates a dual record model:
- local record for fast queries and business reporting
- chain record for tamper-resistant verification

## Core responsibilities

- create and manage user wallets
- check wallet balances
- execute transfers between wallets
- return transaction hashes for audit and reconciliation

## Data and security model

- wallet addresses are linked to user profiles
- private keys are stored in secure secret storage
- transfer operations are signed server-side using controlled credentials
- every successful transfer returns a unique immutable identifier

## Integration points

- user service: provides wallet ownership context
- transaction service: orchestrates transfer requests and stores final records
- frontend: receives transfer status and confirmation data

## Practical result

In this project, blockchain is used as a trust and proof layer. It does not replace the application database; it complements it by providing immutable evidence for financial operations.
