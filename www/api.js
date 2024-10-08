const apiBase = 'https://racer-api.twinfinance.io:8443/'

// Function to record a new racing round by calling the /addRacingRound API
async function recordRaceRound(tgName, tgID,coins,seconds) {
    // API endpoint URL
    const apiUrl = apiBase + 'addRacingRound';
    
    if (tgName == '' & tgID == '' ){
        console.log("no user found")
        return
    }

    // Create the payload object
    const data = {
        tgName: tgName,
        tgID: tgID,
        points: coins,
        raceTimeSeconds: seconds,
    };

    try {
        // Make the POST request to the API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Check if the response is successful
        if (response.ok) {
            // Parse the JSON response
            const result = await response.json();
            console.log('Round recorded successfully:', result);
            
        } else {
            // Handle errors if the response is not successful
            const errorData = await response.json();
            console.error('Error recording round:', errorData);
            
        }
    } catch (error) {
        // Handle any network or other errors
        
        alert('Failed record round due to network error.');
    }
}

// Function to get the leaderboard Data
async function leaderboard(limit=5) {
    // API endpoint URL
    const apiUrl = apiBase + 'leaderboard?limit=' + limit;
    console.log(apiUrl)
    
    try {
        // Make the GET request to the API
        const response = await fetch(apiUrl, {
            method: 'GET',
        });

        // Check if the response is successful
        if (response.ok) {
            // Parse the JSON response
            const result = await response.json();
            console.log(result);
            return (result)

        } else {
            // Handle errors if the response is not successful
            const errorData = await response.json();
            console.error('Error getting leaderboard:', errorData);
            
        }
    } catch (error) {
        // Handle any network or other errors
        
        alert('Failed to get leaderboard due to network error.');
    }
}

// Function to get the quests Data
async function quests(tgID) {
    // API endpoint URL
    const apiUrl = apiBase + 'questsAvailable?tgID=' + tgID;
    console.log(apiUrl)
    
    try {
        // Make the GET request to the API
        const response = await fetch(apiUrl, {
            method: 'GET',
        });

        // Check if the response is successful
        if (response.ok) {
            // Parse the JSON response
            const result = await response.json();
            console.log(result);
            return (result)

        } else {
            // Handle errors if the response is not successful
            const errorData = await response.json();
            console.error('Error getting data:', errorData);
            
        }
    } catch (error) {
        // Handle any network or other errors
        
        alert('Failed to get data due to network error.');
    }
}
