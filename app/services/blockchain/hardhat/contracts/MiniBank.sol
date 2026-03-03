// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MiniBank 
{
    // EVENTS

    event WalletCreated(address indexed wallet, uint256 indexed userId, uint256 timestamp);
    event Deposit(address indexed wallet, uint256 amount, uint256 timestamp);
    event Transfer(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed wallet, uint256 amount, uint256 timestamp);

    // STATE

    address public owner;
    uint256 public totalUsers;

    mapping(uint256 => address) public userWallets;
    mapping(address => uint256) public walletToUser;
    mapping(address => uint256) public balances;
    mapping(address => bool) public isRegistred;

    // MODIFIERS
    modifier onlyOwner() 
    {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyRegistered(address wallet) 
    {
        require(isRegistred[wallet], "Wallet not registered");
        _;
    }

    // CONSTRUCTOR
    constructor()
    {
        owner = msg.sender;
        totalUsers = 0;
    }

    // FUNCTIONS
    function registerWallet(uint256 userId, address wallet) external onlyOwner
    {
        require(userId > 0,                         "Invalid user ID");
        require(wallet != address(0),               "Invalid wallet address");
        require(userWallets[userId] == address(0),  "User already has a wallet");
        require(!isRegistred[wallet],               "Wallet already registered");

        userWallets[userId] = wallet;
        walletToUser[wallet] = userId;
        isRegistred[wallet] = true;
        totalUsers++;

        emit WalletCreated(wallet, userId, block.timestamp);
    }

    function deposit() external payable onlyRegistered(msg.sender)
    {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    function transfer(address to, uint256 amount) external onlyRegistered(msg.sender) onlyRegistered(to)
    {
        require(amount > 0,                     "Amount must be greater than 0");
        require(to != msg.sender,               "Cannot transfer to self");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount, block.timestamp);
    }

    function withdraw(uint256 amount) external onlyRegistered(msg.sender)
    {
        require(amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount, block.timestamp);
    }

    // VIEWS

    function getWallet(uint256 userId) external view returns (address)
    {
        return userWallets[userId];
    }

    function getUserId(address wallet) external view returns (uint256)
    {
        return walletToUser[wallet];
    }

    function getBalance(address wallet) external view returns (uint256)
    {
        return balances[wallet];
    }

    function getContractBalance() external view returns (uint256)
    {
        return address(this).balance;
    }
}