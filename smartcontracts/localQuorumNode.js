const hrstart = null;
const net = require('net');
const util = require("util");
const xml2js = require('xml2js');
const parseString = xml2js.parseString;

var Web3 = require('web3');
var web3 = new Web3("../data/geth.ipc", net);

const PORT = 4444; //Assign listening port

async function fullContract (A, B, C){
    //web3.eth.defaultAccount = web3.eth.personal.getAccounts().then(console.log);
    console.log('Pending for transact....');
    let acc = await web3.eth.personal.getAccounts();
      if (acc.err) {console.log(acc.err);}
      else {console.log('Accounts available on this node:\n' + acc);}

    var deployerAccount = acc[0];
    console.log('Originally deployed with account:' + deployerAccount);
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

    var contractAddress = require('./config/contractAddress.js');
    console.log('Contract Address: ' + contractAddress);

    var myContract = new web3.eth.Contract(abi, contractAddress, {
      from: deployerAccount,
        gas: 30000000
    });

    console.log('Input: ' + A + ', ' + B + ', ' + C);
    var transactContract = await myContract.methods.transferTHB(A, B, C).call({
    from: deployerAccount
    }, (err,res) => {
        if (err) {
            console.log(err);
        } else {
            var result = JSON.parse(res);
            console.log(result);
            return result;
        }
    });
    return transactContract; 
}

//ProcessData interprete any xmlMessages came through Netsocket=====================================================
function processData (dataIn) {
    console.log('message:\n' + dataIn);
    parseString(dataIn, function (err, result) {
      if (err) throw err;
      console.log('\nConverted to object: ');
      console.log('-----------------------\n' + util.inspect(result) + '\n---------------------');
      fullContract(result.A, result.B, result.C)
    });
}

//Net socket wait for any messages===================================================================================
netServer = net.createServer(function(sock) {
	netSocket = sock;
	// We have a connection - a socket object is assigned to the connection automatically
	console.log('CONNECTED: ' + netSocket.remoteAddress +':'+ netSocket.remotePort);
	clientIP[netSocket.remoteAddress] = { //Add sub-component for packet handling, bound to each client
		receiveCounter: 0,
		messageChunks: 2,
		messageArray: [],
		xmlMessage: null,
		xmlChunks: [],
		i: 0
	};

	// Add a 'data' event handler to this instance of socket
	netSocket.on('data', function(data) {
		console.log('Received packet....');
		hrstart = process.hrtime();
		if (clientIP[netSocket.remoteAddress].receiveCounter == 0){
			if (data == "ACK") {
				console.log('ACK from ' + netSocket.remoteAddress);
				sendNextQueryResultChunk();
			}
			else if (data == "FIN") {
				console.log('FIN from ' + netSocket.remoteAddress);
				delete clientIP[netSocket.remoteAddress];
			}
			else {
				clientIP[netSocket.remoteAddress].messageChunks = data;
				console.log("Total Chunk = " + clientIP[netSocket.remoteAddress].messageChunks);
				clientIP[netSocket.remoteAddress].receiveCounter++;
				console.log(clientIP[netSocket.remoteAddress].receiveCounter);
				netSocket.write("ACK");
			}
		}
		else {
			clientIP[netSocket.remoteAddress].messageArray.push(data);
			clientIP[netSocket.remoteAddress].receiveCounter++;
			console.log(clientIP[netSocket.remoteAddress].receiveCounter);
			if(clientIP[netSocket.remoteAddress].receiveCounter == clientIP[netSocket.remoteAddress].messageChunks){
				// All packets have been received, combine the packets into original message
				netSocket.write("FIN");
				var originalMessage = Buffer.concat(clientIP[netSocket.remoteAddress].messageArray).toString();
				console.log("All packets received!");
				processData(originalMessage); //converting XML to JSON based on Module "xml-js"
				//console.log(result); // show the result of xml to js conversion
				// reset the clientIP[netSocket.remoteAddress].messageArray and clientIP[netSocket.remoteAddress].receiveCounter
				clientIP[netSocket.remoteAddress].messageArray = [];
				clientIP[netSocket.remoteAddress].receiveCounter = 0;
			}
			else {
				netSocket.write("ACK");
			}
		}
	});
	// Add a 'close' event handler to this instance of socket
	netSocket.on('close', function(data) {
		console.log('CLOSED: ' + netSocket.remoteAddress +' '+ netSocket.remotePort);
	});
}).listen(PORT, HOST);