// import { useState, useEffect } from "react";
// import detectEthereumProvider from "@metamask/detect-provider";
// import Web3 from "web3";

// const useMetaMask = () => {
//   const [web3, setWeb3] = useState(null);
//   const [accounts, setAccounts] = useState([]);
//   const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

//   useEffect(() => {
//     const loadWeb3 = async () => {
//       const provider = await detectEthereumProvider();
//       if (provider) {
//         setIsMetaMaskInstalled(true);
//         const web3Instance = new Web3(provider);
//         setWeb3(web3Instance);
//         const accounts = await web3Instance.eth.requestAccounts();
//         setAccounts(accounts);
//       } else {
//         setIsMetaMaskInstalled(false);
//       }
//     };

//     loadWeb3();
//   }, []);

//   const connectWallet = async () => {
//     try {
//       const accounts = await web3.eth.requestAccounts();
//       setAccounts(accounts);
//     } catch (error) {
//       console.error("Error connecting wallet:", error);
//     }
//   };

//   return { web3, accounts, isMetaMaskInstalled, connectWallet };
// };

// export default useMetaMask;
