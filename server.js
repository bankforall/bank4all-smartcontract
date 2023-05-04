//Back to basic, no route mess, everything are here!!!!
const express = require('express'); //Loadup Express
const app = express();
const http = require("http"); //Loadup http for server
const PORT = 1234; //Assign listening port
const jwt = require('jsonwebtoken'); //jsonwebtoken for authentication
const bcrypt = require('bcryptjs'); //bcryptjs for authentication
const crypto = require('crypto');
const fs = require('fs');

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
function groupStatusCheck(groupId) {
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
    const newGroupMembers = [{ id: req.user.id, name: req.user.name, readyStatus: false}];
    const newGroupProperty = { 
        id: hash,
        groupName: newGroupName,
        groupPolicy: newGroupPolicy,
        groupMembers: newGroupMembers
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
        readyStatus: false
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
// Smartcontract spawn from here

// Group Activity trace

// Group cycle trigger event

// Group completed

//All setup
//Create Server ====================================
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log("Server listening on port: " + PORT);
});
  
console.log("Server started");