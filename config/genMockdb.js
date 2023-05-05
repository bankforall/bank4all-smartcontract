//generate quick mockup database for development
const fs = require('fs');
const mockdb = {
    users: [
        { 
            id: 1, 
            name: 'Friend', 
            email: 'friend@bank4all.com', 
            passwordHash: '$2a$10$1eYLXOifd3C2v6qSl8d1hur8udayxEcLQ3kFMlDc3uozS6gud0eee',
            walletAddr: '18bacdf2c219efa051d9d43771c9c20883122abc'  
        }, // Password: bank4all-friend
        { 
            id: 2, 
            name: 'Petch', 
            email: 'petch@bank4all.com', 
            passwordHash: '$2a$10$CJsathcF0hPGh5xQhisK1.9TBm.vVKuNlXYJ/pYk95tFy2bWbDCrW',
            walletAddr: '23292cbdb32dae0305f389a150410d4be7b8e59a'   
        }, // Password: bank4all-petch
    ],
    assets: {
        '1': {
            name: 'Friend', 
            thbBalance: 10000, //should get from smartcontract
            btcBalance: 100,
            transactHistory: []
        },
        '2': {
            name: 'Petch', 
            thbBalance: 10000,
            btcBalance: 100,
            transactHistory: []
        }  
    },
    activeGroup: [
        {
            id: 'cb10ab5908127a3bded78cb35fe112f52fc365d0',
            groupName: 'Initial 1st group - ABC123',
            groupReadyStatus: false,
            groupStartedStatus: false,
            groupPolicy: {
                mainType: 'Float',
                timeLength: 'Instant',
                poolSize: 10000,
                underlyingAsset: 'Cash',
                maxMember: 2,
                startDate: '05052023',
                startTime: '0 0 13 ',
                collatMech: 'None',
                currencyType: 'THB',
                roomType: {
                    typeName: 'Private',
                    passwordHash: '$2a$10$brv.f6LhJ5Z770zKPTJNcOQYvuPasD9Xgp9sw6P7GFPiVqdc0qwmK'
                }
            },
            groupMembers: [
                { id: 1, name: 'Friend', readyStatus: false, isHost: false},
                { id: 2, name: 'Petch', readyStatus: false, isHost: true}
            ],
            groupActivities: [],
            groupHistory: []
        },
        {
            id: 'cccd3d75b0562e8c8fa8954657688999a97f04bd',
            groupName: 'Initial 2nd group - DEF456', 
            groupReadyStatus: false,
            groupStartedStatus: false,
            groupPolicy: {
                mainType: 'Fix',
                timeLength: 'Daily',
                poolSize: 10000,
                underlyingAsset: 'Cash',
                maxMember: 2,
                startDate: '05052023',
                startTime: '0 0 13 ',
                collatMech: 'None',
                currencyType: 'THB',
                roomType: {
                    typeName: 'Public'
                }
            },
            groupMembers: [
                { id: 1, name: 'Friend', readyStatus: false, isHost: true}
            ],
            groupActivities: [],
            groupHistory: []
        }
    ]
};

const jsonContent = JSON.stringify(mockdb);

fs.writeFileSync('mockdb.json', jsonContent);