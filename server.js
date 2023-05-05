//Back to basic, no route mess, everything are here!!!!
//Will later divide this code to support project scale up
//fs will only be used to overwrite mockup database, will replace mockup with actual database in real deployment
const express = require('express'); //Loadup Express
const app = express();
const http = require("http"); //Loadup http for server
const PORT = 1234; //Assign listening port
const jwt = require('jsonwebtoken'); //jsonwebtoken for authentication
const bcrypt = require('bcryptjs'); //bcryptjs for authentication
const crypto = require('crypto');
const fs = require('fs');
const cron = require('node-cron');
const net = require('net');

//Loadup database
//const db = require("../config/db"); // real db not ready yet
const rawData = fs.readFileSync('config/mockdb.json');
//const db = require("./config/mockdb"); //use mockdb just for demonstration
const db = JSON.parse(rawData); //use mockdb just for demonstration
const users = db['users'];
const assets = db['assets'];
const activeGroup = db['activeGroup'];
const { jwtSecret } = require("./config/config");

//Loadup smartcontract and blockchain interface
const Web3 = require('web3');
//Then setup connection to our prefer node
const web3 = new Web3('http://localhost:8545');

// Load middleware
const cors = require('cors');
const bodyParser = require('body-parser');

//include bodyParser to deal with HTTP POST request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//include cors, allow cross-origin resource sharing
app.use(cors());

//Function section =================================
//authenticateJWT verify if the request is from the correct user
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.user = users.find((user) => user.id === decoded.id);
            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Missing token' });
    }
}

//update change to mockup database
function mockupDBUpdate (updatedDB) {
    const jsonContent = JSON.stringify(updatedDB);
    fs.writeFileSync('config/mockdb.json', jsonContent);
    console.log('mockup database updated...');

    // Return a resolved Promise to signal that the function has completed
    return Promise.resolve();
}

//check for status change on group in local database
function groupStatusCheck (groupId) {
    console.log('Check for ready status of group ' + groupId);
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === groupId) {
            var readyCount = 0;
            const checkingGroup = activeGroup[i];
            const maxGroupMember = checkingGroup.groupMembers.length;
            for (var j=0; j<maxGroupMember; j++) {
                const checkingMember = checkingGroup.groupMembers[j];
                if (checkingMember.readyStatus == true) {
                    readyCount++;
                }
            }
            if (readyCount == maxGroupMember) {
                console.log('All members of this group are ready, this group is ready...');
                var updatedDB = db;
                updatedDB.activeGroup[i].groupReadyStatus = true;
                mockupDBUpdate(updatedDB);
            }
        }
    }
    // Return a resolved Promise to signal that the function has completed
    return Promise.resolve();
}

//Start group activity
function startGroupActivity (groupId) {
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === groupId) {
            const checkingGroup = activeGroup[i];
            const selectedGroupLOT = checkingGroup.groupPolicy.timeLength;
            const selectedGroupTime = checkingGroup.groupPolicy.startTime;
            if (selectedGroupLOT == "Instant") {
                console.log('Instant group for demo... initiated');
                //bypass cron, just for project demo only
                shareRound(groupId, "Instant");
            }
            else {
                console.log('Group time length is' + selectedGroupLOT + ' ... initiated');
                //use cron to trigger event
                const cronLOT = '* * *';
                if (selectedGroupLOT == 'Daily') {
                    cronLOT = '* * *';
                }
                else if (selectedGroupLOT == 'Weekly') {
                    cronLOT = '* * 1';
                }
                else if (selectedGroupLOT == 'Monthly') {
                    cronLOT = '1 * *';
                }
                else if (selectedGroupLOT == 'Yearly') {
                    cronLOT = '1 1 *';
                }
                const cronTime = selectedGroupTime + cronLOT;
                cron.schedule(cronTime, () => {
                    console.log('Start round... for group:' + groupId);
                    shareRound (groupId, cronLOT);
                });
            }
        }
    }
}

//Group sharing round activity
function shareRound (groupId, groupLOT) {
    var checkingGroup = null;
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === groupId) {
            checkingGroup = activeGroup[i];
        }
    }
    const thisGroupPolicy = checkingGroup.groupPolicy;
    if (groupLOT == "Instant") {
        //Instant mean just for demo presentation
        if (thisGroupPolicy.mainType == "Float") {
            //wait for bidding
            console.log('Wait for biding...');
            bidStatusCheck(groupId);
        }
    }
    else {
        console.log('Not implemented yet...');
        //Not implemented yet
    }
}

var lastRoundWinnerBid = 0;
function bidStatusCheck (groupId) {
    var checkingGroup = null;
    var selectedGroup = null;
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === groupId) {
            checkingGroup = activeGroup[i];
            selectedGroup = i;
        }
    }
    const totalMembers = checkingGroup.groupPolicy.maxMember;
    var bidCount = 0;
    var alreadyWonBid = [];
    for (var i=0; i<checkingGroup.groupHistory.length; i++) {
        bidCount++; //Each finished round will reduce bidable member by 1
        alreadyWonBid.push(checkingGroup.groupHistory[i].bidWinner); 
        //Gather user id that already win bid in past round
    }
    var winnerBid = -1;
    var bidWinner = -1;
    const groupActivities = checkingGroup.groupActivities;
    for (let i=0; i<groupActivities.length; i++) {
        const activity = groupActivities[i];
        if (!alreadyWonBid.includes(activity.id)) {
            bidCount++;
            if (activity.proposedBid > winnerBid) {
                winnerBid = activity.proposedBid;
                bidWinner = activity.id;
            }
            if (bidCount == totalMembers) {
                console.log('Biding winner is user: ' + bidWinner);
                transactPool(bidWinner, winnerBid, selectedGroup);
                recordHistory(bidWinner, selectedGroup);
            }
        }
    }
}

function transactPool (bidWinner, winnerBid, selectedGroup) {
    //Transfer money from staking pool to the biding winner
    console.log('Pool cash sent to user ' + bidWinner);
    //This section got commented out due to unable to start Quorum node with Wifi at the venue
    //const peer = 1;
    //const onGroup = activeGroup[selectedGroup];
    //const groupPolicy = onGroup.groupPolicy;
    //const totalSumTransfer = lastRoundWinnerBid + (groupPolicy.poolSize/groupPolicy.maxMember);
    //lastRoundWinnerBid = winnerBid;
    //sendToLocalNode(users[peer].walletAddr, users[bidWinner].walletAddr, totalSumTransfer);
    groupCompletedCheck(selectedGroup);
}

function sendToLocalNode (A, B, C) {
    //Send to local Quorum node to deploy  into smartcontract
    const sendingPackage = {
        A, B, C
    };
    var client = new net.Socket();
    const nodeHOST = '192.168.1.1';
    const nodePORT = 4444;
    var sMessage = null;
    var sChunks = [];
    const chunkSize = 1024;

    //Send number of chunk to let the receiver know
    var prepareSendChunk = function() {
        var chunkCount = sChunks.length + 1; //+1 also count the chunkCount value
        console.log("***************************");
        console.log("Chunk pieces: " + chunkCount);
        console.log("***************************");
        if (chunkCount) {
            console.log("sending chunkCount");
            client.write(chunkCount.toString()); //.write send only string
        }
        console.log('Sent: \n' + sMessage + '\n');     
    }

    // Send packets one by one
    var j = 0;
    var sendNextChunk = function() {
        if (j < sChunks.length) {
            client.write(sChunks[j], function() {
                j++;
            });
        }
    };

    client.connect(nodePORT, nodeHOST, function() {
        console.log('CONNECTED TO: ' + nodeHOST + ':' + nodePORT);
        sMessage = sendingPackage.toString();

        // Split message into smaller packets
        sChunks = [];
        var chunk = "";
        for (var i = 0; i < sMessage.length; i++) {
            chunk += sMessage[i];
            if (chunk.length === chunkSize || i === sMessage.length - 1) {
                sChunks.push(chunk);
                chunk = "";
            }
        }
        prepareSendChunk(); //Prepare and enter packets sending loop
    });

    client.on('data', function(data) {
        var dataGot = data.toString();
        if (dataGot == "ACK") {
            sendNextChunk();
        }
        else if (dataGot == "FIN") {
            client.end();
            console.log('==============================');
            console.log('Respond received: ' + data);
            console.log('==============================');
        }
    });

    client.on('end', function() {
        console.log('Connection ended');
    });

    client.on('close', function() {
        console.log('Connection closed');
    });
}

function recordHistory (bidWinner, selectedGroup) {
    //record round history into group
    var updatedDB = db;
    updatedDB.activeGroup[selectedGroup].groupActivities = [];
    const historyRecord = {
        bidWinner
    }
    updatedDB.activeGroup[selectedGroup].groupHistory.push(historyRecord);
    console.log('Group history record...');
    mockupDBUpdate(updatedDB);
}

function groupCompletedCheck (selectedGroup) {
    var completeCount = 0;
    lastRoundWinnerBid = 0;
    for (let i=0; i<activeGroup[selectedGroup].groupHistory.length; i++) {
        completeCount++;
        if (activeGroup[selectedGroup].groupPolicy.maxMember == completeCount) {
            console.log('Group completed... closed');
        }
    }
}

//----maybe have update info. from smartcontract

//==================================================

// Handling request
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

app.get('/greet', (req, res) => {
    res.json({ message: 'Hello World!' });
});

// Login handling
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((user) => user.email === email);
    if (user) {
        const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordMatch) {
            const token = jwt.sign({ id: user.id }, jwtSecret);
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid password' });
        }
    } else {
        res.status(401).json({ message: 'Invalid email' });
    }
});

// Check user authorization
app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: `Hello, ${req.user.name}! This is a protected resource.` });
});

// Dashboard summary - status, active group list
app.get('/dashboard', authenticateJWT, (req, res) => {
    const selectedUser = req.user.id;
    var foundGroup = [];
    for (const group of activeGroup) {
        const hasPerson = group.groupMembers.some(member => member.id === selectedUser);
        if (hasPerson) {
            foundGroup.push(group.id);
        }
    }
    var dashboardElement = {
        assetsBalance: assets[selectedUser],
        belongGroup: foundGroup 
    };
    res.json(dashboardElement);
});

// Create group
app.post('/creategroup', authenticateJWT, (req, res) => {
    const createGroupPolicy = req.body; //get object from frontend for new group properties
    //hash group property to create group id - This probably will cause bug sometimes
    const hash = crypto.createHash('sha1').update(JSON.stringify(createGroupPolicy)).digest('hex');
    //sort new property and new group id into object
    const newGroupName = createGroupPolicy.groupName;
    const newGroupPolicy = createGroupPolicy.groupPolicy;
    const newGroupMembers = [{ id: req.user.id, name: req.user.name, readyStatus: false, isHost: true}];
    const newGroupActivities = [];
    const newGroupHistory = [];
    const newGroupProperty = { 
        id: hash,
        groupName: newGroupName,
        groupPolicy: newGroupPolicy,
        groupMembers: newGroupMembers,
        groupActivities: newGroupActivities,
        groupHistory: newGroupHistory
    };
    //create new object to store updated version of mockdb.json
    var updateMockDB = db;
    updateMockDB.activeGroup.push(newGroupProperty) //add the property of new group
    const jsonContent = JSON.stringify(updateMockDB);
    fs.writeFileSync('config/mockdb.json', jsonContent);
    console.log('mockup database updated...');
    res.json({ 
        message: `Create group process...`
    });
});

// Discover group
app.get('/discover', authenticateJWT, (req, res) => {
    const selectedUser = req.user.id;
    var showActiveGroup = activeGroup;
    for (var i=0; i<activeGroup.length; i++) {
        showActiveGroup[i]['memberCount'] = activeGroup[i].groupMembers.length;
    }
    if (selectedUser) {
        res.json(showActiveGroup);
    }
});

// Join group
app.post('/joingroup', authenticateJWT, (req, res) => {
    const selectedUserID = req.user.id;
    const selectedUserName = req.user.name;
    const aimToGroup = req.body.id;
    const memberToAdd = {
        id: selectedUserID,
        name: selectedUserName, 
        readyStatus: false,
        isHost: false
    }
    for (var selectedGroup = 0; selectedGroup<activeGroup.length; selectedGroup++) {
        if (activeGroup[selectedGroup].id === aimToGroup) {
            activeGroup[selectedGroup].groupMembers.push(memberToAdd);
            console.log('Added new member to the selected group...');
        }
    }
    const jsonContent = JSON.stringify(db);
    fs.writeFileSync('config/mockdb.json', jsonContent);
    console.log('mockup database updated...');
    res.json({ 
        message: `Join group process...`
    });
});

// Group ongoing cycle =============================
// Group Ready: every members in the group must be readied for the group to start sharing cycle
app.post('/ready', authenticateJWT, (req, res) => {
    res.json({ 
        message: `Ready up to group process...`
    });
    const fromUser = req.user.id;
    const toGroup = req.body.groupId;
    var updatedDB = db;
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === toGroup) {
            const checkingGroup = activeGroup[i];
            const maxGroupMember = checkingGroup.groupMembers.length;
            for (var j=0; j<maxGroupMember; j++) {
                const checkingMember = checkingGroup.groupMembers[j];
                if (checkingMember.id == fromUser) {
                    updatedDB.activeGroup[i].groupMembers[j].readyStatus = true;
                    console.log('Update ready status for user...');
                    mockupDBUpdate(updatedDB)
                    .then(() => groupStatusCheck(toGroup))
                    .then(() => {
                        console.log('Done!');
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                }
            }
        }
    }
});

// Group Start: group host will able to start sharing cycle when every members ready
// 1.Update Group Started Status
app.post('/start', authenticateJWT, (req, res) => {
    const fromUser = req.user.id;
    const toGroup = req.body.groupId;
    var updatedDB = db;
    var responded = false;
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === toGroup) {
            const checkingGroup = activeGroup[i];
            const maxGroupMember = checkingGroup.groupMembers.length;
            if (checkingGroup.groupReadyStatus == true) {
                for (var j=0; j<maxGroupMember; j++) {
                    const checkingMember = checkingGroup.groupMembers[j];
                    if (checkingMember.id == fromUser) {
                        if (checkingMember.isHost == true) {
                            updatedDB.activeGroup[i].groupStartedStatus = true;
                            res.json({ 
                                message: `Start group process...`
                            });
                            responded = true;
                            console.log('Start this group process...');
                            mockupDBUpdate(updatedDB);
                            // 2.Spawn sharing process
                            startGroupActivity(toGroup);
                            // 3.Spawn smartcontract to record ongoing sharing process and control assets circulation
                        }
                        else {
                            res.json({ 
                                message: `User is not the group host...`
                            });
                            responded = true;
                            console.log('Unauthorized group start attempt detected...');
                        }
                    }
                }
            }
            else {
                res.json({ 
                    message: `Group not ready yet...`
                });
                responded = true;
                console.log('Group start attempt without ready... denied');
            }
        }
    }
    if (!responded) {
        res.json({ 
            message: `Not this group...`
        });
        console.log('Not this group for this user to start:' + selectedUser);
    }
});

// Group Activity
// Bidding accept for Float mainType
app.post('/bid', authenticateJWT, (req, res) => {
    res.json({ 
        message: `Bidding process...`
    });
    const fromUser = req.user.id;
    const toGroup = req.body.groupId;
    const proposedBid = req.body.bidPropose;
    const bidProposal = {
        id: fromUser,
        proposedBid: proposedBid
    }
    var updatedDB = db;
    for (var i=0; i<activeGroup.length; i++) {
        if (activeGroup[i].id === toGroup) {
            const checkingGroup = activeGroup[i];
            const maxGroupMember = checkingGroup.groupMembers.length;
            for (var j=0; j<maxGroupMember; j++) {
                const checkingMember = checkingGroup.groupMembers[j];
                if (checkingMember.id == fromUser) {
                    updatedDB.activeGroup[i].groupActivities.push(bidProposal);
                    console.log('Biding proposed from user... accepted');
                    mockupDBUpdate(updatedDB)
                    .then(() => bidStatusCheck(toGroup))
                    .then(() => {
                        console.log('Done!');
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                }
            }
        }
    }
});
// HTTP request for support Fix mainType will later be implemented

// Group cycle trigger event

// Group completed

//All setup
//Create Server ====================================
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log("Server listening on port: " + PORT);
});
  
console.log("Server started");