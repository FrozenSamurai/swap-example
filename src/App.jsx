import ABI from "./abi.json";
import React, { useState, useEffect } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

const SwapTokens = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [busdBalance, setBusdBalance] = useState("0");
  const [routerAbi, setRouterAbi] = useState(null);

  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        await provider.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        const accountBalance = await web3Instance.eth.getBalance(accounts[0]);
        setBalance(accountBalance);

        // Get BUSD balance
        const busdAddress = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee";
        const erc20Abi = [
          {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "balance", type: "uint256" }],
            type: "function",
          },
          {
            constant: false,
            inputs: [
              { name: "_spender", type: "address" },
              { name: "_value", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "success", type: "bool" }],
            type: "function",
          },
        ];
        const busdContract = new web3Instance.eth.Contract(
          erc20Abi,
          busdAddress
        );
        const busdBalance = await busdContract.methods
          .balanceOf(accounts[0])
          .call();
        setBusdBalance(busdBalance);

        // Fetch PancakeSwap Router ABI
        // const response = await fetch("/pancake-router-abi.json");
        // const abi = await response.json();
        setRouterAbi(ABI);
      } else {
        console.error("Please install MetaMask!");
      }
    };
    init();
  }, []);

  const swapTokensOnPancakeUsingBNB = async () => {
    const originalAmountToBuyWith = "0.1";
    const bnbAmount = web3.utils.toWei(originalAmountToBuyWith, "ether");

    const tokenAddress = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee"; // BUSD token
    const WBNBAddress = "0xae13d989dac2f0debff460ac112a837c89baa7cd"; // WBNB token address
    const amountOutMin = "1" + Math.random().toString().slice(2, 6);
    const pancakeSwapRouterAddress =
      "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

    // const routerAbi = ABI;
    const contract = new web3.eth.Contract(
      routerAbi,
      pancakeSwapRouterAddress,
      { from: account }
    );

    const data = contract.methods.swapExactETHForTokens(
      web3.utils.toHex(amountOutMin),
      [WBNBAddress, tokenAddress],
      account,
      web3.utils.toHex(Math.round(Date.now() / 1000) + 60 * 20)
    );

    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 228120;

    const totalGasCost = BigInt(gasPrice) * BigInt(gasLimit);
    const totalCost = BigInt(bnbAmount) + totalGasCost;
    console.log(totalGasCost, "gasPrice");

    if (BigInt(balance) < totalCost) {
      console.error("Insufficient funds for gas * price + value");
      return;
    }

    const rawTransaction = {
      from: account,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      to: pancakeSwapRouterAddress,
      value: bnbAmount,
      data: data.encodeABI(),
    };

    try {
      const txHash = await web3.eth.sendTransaction(rawTransaction);
      console.log("Transaction hash:", txHash);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  const approveBusd = async () => {
    const busdAddress = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee";
    const pancakeSwapRouterAddress =
      "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
    const busdAmount = web3.utils.toWei("1000", "ether"); // Approve a large amount to avoid multiple approvals

    const erc20Abi = [
      {
        constant: false,
        inputs: [
          { name: "_spender", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "success", type: "bool" }],
        type: "function",
      },
    ];

    const busdContract = new web3.eth.Contract(erc20Abi, busdAddress);

    try {
      const tx = await busdContract.methods
        .approve(pancakeSwapRouterAddress, busdAmount)
        .send({ from: account });
      console.log("Approval tx:", tx);
    } catch (error) {
      console.error("Error approving BUSD:", error);
    }
  };

  const swapBUSDForBNB = async () => {
    if (!routerAbi) {
      console.error("Router ABI not loaded.");
      return;
    }

    const originalAmountToSwap = "1";
    const busdAmount = web3.utils.toWei(originalAmountToSwap, "ether");

    const tokenAddress = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee"; // BUSD token
    const WBNBAddress = "0xae13d989dac2f0debff460ac112a837c89baa7cd"; // WBNB token address
    const pancakeSwapRouterAddress =
      "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

    const contract = new web3.eth.Contract(
      routerAbi,
      pancakeSwapRouterAddress,
      { from: account }
    );

    // Fetch the current price and calculate amountOutMin
    const amountsOut = await contract.methods
      .getAmountsOut(busdAmount, [tokenAddress, WBNBAddress])
      .call();
    console.log(amountsOut, web3.utils.toHex("10000000"), "amountsOut");
    const amountOutMin = (Number(amountsOut[1]) * 0.95).toFixed(0); // 5% slippage tolerance
    console.log(amountOutMin);
    const data = contract.methods.swapExactTokensForETH(
      String(busdAmount),
      "0",
      [tokenAddress, WBNBAddress],
      account,
      Math.round(Date.now() / 1000) + 60 * 20
    );

    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 290000;

    // Check BUSD balance
    // if (BigInt(busdBalance) < BigInt(busdAmount)) {
    //   console.error("Insufficient BUSD balance");
    //   return;
    // }

    const rawTransaction = {
      from: account,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      to: pancakeSwapRouterAddress,
      value: "0x0",
      data: data.encodeABI(),
    };

    try {
      const txHash = await web3.eth.sendTransaction(rawTransaction);
      console.log("Transaction hash:", txHash);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  const swapBUSDForUSDT = async () => {
    if (!routerAbi) {
      console.error("Router ABI not loaded.");
      return;
    }

    const originalAmountToSwap = "1";
    const busdAmount = web3.utils.toWei(originalAmountToSwap, "ether");

    const tokenAddress = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee"; // BUSD token
    const usdtAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"; // USDT token address on BSC
    const pancakeSwapRouterAddress =
      "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

    const contract = new web3.eth.Contract(
      routerAbi,
      pancakeSwapRouterAddress,
      { from: account }
    );

    // Fetch the current price and calculate amountOutMin
    const amountsOut = await contract.methods
      .getAmountsOut(busdAmount, [tokenAddress, usdtAddress])
      .call();
    const amountOutMin = (Number(amountsOut[1]) * 0.95).toFixed(0); // 5% slippage tolerance
    console.log(busdAmount, amountOutMin, "Amount");
    const data = contract.methods.swapExactTokensForTokens(
      String(busdAmount),
      String("0"),
      [tokenAddress, usdtAddress],
      account,
      Math.round(Date.now() / 1000) + 60 * 20
    );

    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 290000;

    // Check BUSD balance
    // if (BigInt(busdBalance) < BigInt(busdAmount)) {
    //   console.error("Insufficient BUSD balance");
    //   return;
    // }

    const rawTransaction = {
      from: account,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      to: pancakeSwapRouterAddress,
      value: "0x0",
      data: data.encodeABI(),
    };

    try {
      const txHash = await web3.eth.sendTransaction(rawTransaction);
      console.log("Transaction hash:", txHash);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  return (
    <div>
      <h1>Swap BUSD for BNB using PancakeSwap</h1>
      {account ? (
        <div>
          <p>Connected account: {account}</p>
          <p>BNB Balance: {web3.utils.fromWei(balance, "ether")} BNB</p>
          <p>BUSD Balance: {web3.utils.fromWei(busdBalance, "ether")} BUSD</p>
          <button onClick={approveBusd}>Approve BUSD</button>
          <button onClick={swapBUSDForBNB}>Swap BUSD to BNB</button>
          <button onClick={swapTokensOnPancakeUsingBNB}>
            Swap BNB to BUSD
          </button>
          <button onClick={swapBUSDForUSDT}>Swap BUSD to USDT</button>
        </div>
      ) : (
        <p>Please connect your MetaMask wallet.</p>
      )}
    </div>
  );
};

export default SwapTokens;
