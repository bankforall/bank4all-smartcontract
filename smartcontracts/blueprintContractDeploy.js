var fs = require("fs");
var Web3 = require('web3');

var net = require('net');
var web3 = new Web3("../data/geth.ipc", net);

async function deployContract(){
	//web3.eth.defaultAccount = web3.eth.personal.getAccounts().then(console.log);
	let acc = await web3.eth.personal.getAccounts();
	  if (acc.err) {console.log(acc.err);}
	  else {console.log('Accounts available on this node:\n' + acc);}

	console.log('------------------------------------------');
	var deployerAccount = acc[0];
	console.log('Deploying with account:' + deployerAccount);
	var abi = 
	[
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "_from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "TransferCompleted",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferTHB",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    
	var bytecode = "608060405234801561001057600080fd5b506104c9806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063c6e8742314610030575b600080fd5b61004a6004803603810190610045919061028b565b610060565b60405161005791906102f9565b60405180910390f35b60008073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036100d0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100c790610371565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361013f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610136906103dd565b60405180910390fd5b60008211610182576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161017990610449565b60405180910390fd5b8273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f0300ac1392a8a3b96b8b9c8eb7bf6ad973c028c4cea499a0936076cbdbe87ecf846040516101df9190610478565b60405180910390a3600190509392505050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610222826101f7565b9050919050565b61023281610217565b811461023d57600080fd5b50565b60008135905061024f81610229565b92915050565b6000819050919050565b61026881610255565b811461027357600080fd5b50565b6000813590506102858161025f565b92915050565b6000806000606084860312156102a4576102a36101f2565b5b60006102b286828701610240565b93505060206102c386828701610240565b92505060406102d486828701610276565b9150509250925092565b60008115159050919050565b6102f3816102de565b82525050565b600060208201905061030e60008301846102ea565b92915050565b600082825260208201905092915050565b7f496e76616c69642073656e646572206164647265737300000000000000000000600082015250565b600061035b601683610314565b915061036682610325565b602082019050919050565b6000602082019050818103600083015261038a8161034e565b9050919050565b7f496e76616c696420726563697069656e74206164647265737300000000000000600082015250565b60006103c7601983610314565b91506103d282610391565b602082019050919050565b600060208201905081810360008301526103f6816103ba565b9050919050565b7f496e76616c6964207472616e7366657220616d6f756e74000000000000000000600082015250565b6000610433601783610314565b915061043e826103fd565b602082019050919050565b6000602082019050818103600083015261046281610426565b9050919050565b61047281610255565b82525050565b600060208201905061048d6000830184610469565b9291505056fea2646970667358221220c789437f7ce45e0997e813cc41f61190933849cbe964b3d07f1ba50892bd617f64736f6c63430008130033";

	var myContract = new web3.eth.Contract(abi);

	myContract.deploy({
		data: bytecode
	})
	.send({
		from: deployerAccount,
	    gas: 24000000
	}, function(error, transactionHash){ 
		console.log('Contract sent!!!'); 
	}).on('error', function(error){ 
		console.log('Error sending contract!');
		console.log(error); 
	}).on('transactionHash', function(transactionHash){ 
		console.log('TransactionHash: ' + transactionHash);
	}).on('receipt', function(receipt){
		console.log('Receipt:' + receipt.contractAddress) // contains the new contract address that being used for methods invoke
	}).then(function(newContractInstance){
	    console.log('newContractInstance:' + newContractInstance.options.address);
	    var msg = 'module.exports = ' + JSON.stringify(newContractInstance.options.address) + ';';
	    fs.writeFileSync("../config/contractAddress.js", msg);
	}).then(function(successfulMarker){
		console.log('Contract successfully deployed!!');
	}).then(process.exit);
}

deployContract();

