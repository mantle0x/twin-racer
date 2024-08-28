// Function to request device orientation permission
function requestPermission() {
    console.log("Start game button clicked");

    // Check if the device orientation API requires permission (iOS 13+)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    console.log("Device orientation permission granted.");
                } else {
                    console.warn("Device orientation permission denied.");
                }
            })
            .catch(error => {
                console.error("Error requesting device orientation permission:", error);
            });
    } else {
        // For non-iOS devices or iOS versions before 13
        window.addEventListener('deviceorientation', handleOrientation, true);
        console.log("Device orientation event listener added (no permission required).");
    }
}

// Function to handle device orientation events
function handleOrientation(event) {
    const tiltLR = event.gamma || 0;  // Left-to-right tilt in degrees [-90, 90]
    const tiltFB = event.beta || 0;   // Front-to-back tilt in degrees [-180, 180]
    
    // Adjust the sensitivity of the controls
    const tiltSensitivity = 10;

    // Left/Right control
    if (tiltLR > tiltSensitivity) {
        keyRight = true;
        keyLeft = false;
    } else if (tiltLR < -tiltSensitivity) {
        keyLeft = true;
        keyRight = false;
    } else {
        keyLeft = false;
        keyRight = false;
    }

    // Accelerate/Brake control
    if (tiltFB > tiltSensitivity) {
        keyFaster = true;
        keySlower = false;
    } else if (tiltFB < -tiltSensitivity) {
        keySlower = true;
        keyFaster = false;
    } else {
        keyFaster = false;
        keySlower = false;
    }
}

// Ensure the DOM is fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    const startGameButton = document.getElementById('startGameButton');
    
    if (startGameButton) {
        startGameButton.addEventListener('click', requestPermission);
        console.log("Start game button listener added.");
    } else {
        console.error("Button with ID 'startGameButton' not found in the DOM.");
    }
});

// Optional: If you want to start the game without clicking a button (for testing purposes), 
// you can uncomment the following line. Be cautious as this might not be desired in production.
// window.addEventListener('deviceorientation', handleOrientation, true);
