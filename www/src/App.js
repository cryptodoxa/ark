import './App.css';
import axios from 'axios';
import React from 'react';
import Web3 from 'web3';
var web3 = new Web3("wss://eth-mainnet.alchemyapi.io/v2/GNauZOAEhjOc34zQQqQuXorOlmC6wJ6W");

// subscribe to block data
let onNewBlock = function(){};
web3.eth.subscribe('newBlockHeaders', function (error, result) {})
  .on("data", function (blockHeader) {
    web3.eth.getBlock(blockHeader.hash, true).then(onNewBlock);
  });

// manage coingecko free API rate limit
let ethRateLimit = false;
let rateLimit = function(){
  ethRateLimit = !ethRateLimit
};
setInterval(rateLimit, 20000);


// helper functions for formatting
const weiToEth = (wei) => { return wei / 1e18; };
const printEth = (eth) => {
  if (eth == 0) {
    return "0"
  } else if (eth < .0001) {
    return "<.0001"
  } else {
    return eth.toFixed(3);
  }
}


function App() {

  const [data, setData] = React.useState({
    transactions: [],
    ethPrice: 0
  });

  const updatePrice = (transactions) => {
    axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd").then(resp => {
      const newData = {transactions: transactions, ethPrice: resp.data.ethereum.usd};
      setData(newData);
    })
  }

  onNewBlock = (resp) => {
    if (ethRateLimit) {
      setData({...data, transactions: resp.transactions});
    } else {
      updatePrice(resp.transactions);
      ethRateLimit = true;
    }
  }

  const display = data.transactions.length ? 
    <TransactionList transactions={data.transactions} ethPrice={data.ethPrice}/> :
    <h1>Waiting for block data....</h1> 

  return (
    <div className="App">
      <div>Current Eth Price: {data.ethPrice ? data.ethPrice : "fetching..."}</div>
      {display}
    </div>
  );
}

const TransactionList = (props) => {

  return (
    <div>
      <table className="tx-table">
        <thead>
          <tr className="header">
            <td>From:</td><td>To:</td><td>Value (eth):</td><td>Value (USD):</td>
          </tr>
        </thead>
        <tbody>
          {props.transactions.map((tx, idx) => {
            return (<Transaction key={idx} tx={tx} ethPrice={props.ethPrice} />)
          })}
        </tbody>
      </table>
    </div>
  )
}

const Transaction = (props) => {
  
  return (
    <tr>
      <td>{props.tx.from}</td>
      <td>{props.tx.to}</td>
      <td className="value">{printEth(weiToEth(props.tx.value))}</td>
      <td className="value">${(weiToEth(props.tx.value) * props.ethPrice).toFixed(2)}</td>
    </tr>
  )
}

export default App;
