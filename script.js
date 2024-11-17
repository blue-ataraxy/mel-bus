let markers = []; // Global array to store marker data
let directionsRenderer; // To display directions
let currentInfoWindow = null; // Track the currently opened InfoWindow


// Example mapping of Bus Stop name to its timings
const busTimingsMapping = {
    "Innovation Square": {
        "weekday_daytime": ["08:00", "09:00"],
        "weekday_evening": ["21:00", "22:00"]
    },
    "Bus stop 2": {
        "weekday_daytime": ["08:00", "09:00"],
        "weekday_evening": ["21:00", "22:00"]
    },
    // Add more bus stops and their timings here...
};

let selectedBusStop = null; // To store the nearest bus stop



function initMap(){
    
    // initialize map object
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: { lat: 43.12852, lng: -77.62878 },
        mapId: '', // e.g. terrain
    });

    // Initialize DirectionsRenderer
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Initialize Places Autocomplete
    const input = document.getElementById("destination");
    const center = { lat: 43.12852, lng: -77.62878 };

    const defaultBounds = {
        north: center.lat + 0.1,
        south: center.lat - 0.1,
        east: center.lng + 0.1,
        west: center.lng - 0.1,
      };
      
    const options = {
        bounds: defaultBounds,
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "icon", "name"],
        strictBounds: false,
      };

    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map); // Bias the autocomplete to the map's viewport
    
    // Listen for the place_changed event
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace(); // Get the selected place details
        if (place.geometry) {
            console.log(`Selected place: ${place.name}, Coordinates: ${place.geometry.location}`);
            // Automatically trigger a search or display the location on a map
            triggerSearch(place);
        }
    });

    autocomplete.setFields(["place_id", "geometry", "name"]);

    
    function triggerSearch(place) {

        // Hide the timing container before starting a new search
        const timingContainer = document.getElementById("timing-container");
        if (timingContainer) {
            timingContainer.style.display = "none"; // Hide it
        }

        // Close any currently opened InfoWindow before proceeding
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        
        // Perform your desired search or action
        console.log('Search triggered for:', place);    
    }
  


    const ctaLayer = new google.maps.KmlLayer({
        url: "https://raw.githubusercontent.com/blue-ataraxy/mel-bus/refs/heads/JKhamzaev-map/UI/MelBusColor.kml",
        map: map,
    });

    fetch("https://raw.githubusercontent.com/blue-ataraxy/mel-bus/refs/heads/JKhamzaev-map/UI/MelBusColor.kml")
    .then((response) => response.text())
    .then((kmlText) => {
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, 'application/xml');
        
        // Extract <Placemark> elements
        const placemarks = kml.getElementsByTagName('Placemark');
        for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];
            
            // Extract <Point> data
            const point = placemark.getElementsByTagName('Point')[0];
            if (point) {
                const coordinatesText = point.getElementsByTagName('coordinates')[0].textContent.trim();
                const [lng, lat] = coordinatesText.split(',').map(Number);                
                
                const busStopName = placemark.getElementsByTagName('name')[0]?.textContent || `Marker ${i + 1}`;
                const busTimings = busTimingsMapping[busStopName]; 
                
                // Create a marker
                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: placemark.getElementsByTagName('name')[0]?.textContent || `Marker ${i + 1}`
                });

                // If bus timings exist, associate them with the marker
                if (busTimings) {
                    marker.busTimings = busTimings;
                }

                
                markers.push({ marker, lat, lng, busTimings }); // Save marker and coordinates

                
            }

            // Extract <LineString> data
            const lineString = placemark.getElementsByTagName('LineString')[0];
            if (lineString) {
                const coordinatesText = lineString.getElementsByTagName('coordinates')[0].textContent.trim();

                // Parse the coordinates into an array of { lat, lng } objects
                const path = coordinatesText.split(' ').map((coordinate) => {
                    const [lng, lat] = coordinate.split(',').map(Number);
                    return { lat, lng };
                });

                // Create a polyline for the route
                new window.google.maps.Polyline({
                    path: path,
                    map: map,
                    strokeColor: '#FF0000', // Customize color
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                });
            }

        }
    })
    .catch((error) => console.error('Error loading KML file:', error));

};

function capitalizeFirstLetter(text) {
    return text.replace(/\b\w/g, function(char) {
      return char.toUpperCase();
    });
  }
  

// Function to calculate distance using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


// Integrate Google Maps Geocoding API to convert the user’s input into latitude and longitude

function geocodeAddress(address, callback) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
            const location = results[0].geometry.location;
            callback(location.lat(), location.lng());
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
};

// Function to find the nearest marker

function findNearestMarker() {
    const destination = document.getElementById("destination").value;

    if (!destination) {
        alert("Please enter a destination.");
        return;
    }

    geocodeAddress(destination, (destLat, destLng) => {
        let nearestMarker = null;
        let minDistance = Infinity;

        // Find the nearest marker
        for (const { marker, lat, lng , busTimings } of markers) {
            const distance = calculateDistance(destLat, destLng, lat, lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearestMarker = { marker, lat, lng , busTimings };
            }
        }

        if (nearestMarker) {

            selectedBusStop = nearestMarker;

            const nearestLatLng = { lat: nearestMarker.lat, lng: nearestMarker.lng };
            
            // Display the route
            calculateAndDisplayRoute(destLat, destLng, nearestLatLng);

            // Show bus timings for the nearest stop
            if (nearestMarker.busTimings) {
                displayBusTimings(nearestMarker.busTimings);
            } else {
                alert("No bus timings available for the nearest stop.");
            }

        } else {
            alert("No stops found.");
        }
    });
};

// Function to calculate and display route using Directions API
function calculateAndDisplayRoute(destLat, destLng, nearestLatLng) {
    const directionsService = new google.maps.DirectionsService();
    
    // Set up route request
    const request = {
        origin: { lat: destLat, lng: destLng },
        destination: nearestLatLng,
        travelMode: google.maps.TravelMode.WALKING, // Adjust mode as needed (e.g., DRIVING, BICYCLING)
    };

    // Fetch and display route
    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);

            // Extract distance and duration
            const distance = result.routes[0].legs[0].distance.text; // Get distance
            const duration = result.routes[0].legs[0].duration.text; // Get duration (time)

            // Display the route details (distance and time)
            displayRouteDetails(distance, duration);
        } else {
            alert("Directions request failed due to " + status);
        }
    });
}

// Function to display route details (distance and time)
function displayRouteDetails(distance, duration) {
    // Find or create a container to display route details
    let detailsContainer = document.getElementById("route-details");
    
    if (!detailsContainer) {
        // Create a new div if it doesn't exist
        detailsContainer = document.createElement("div");
        detailsContainer.id = "route-details";
        document.body.appendChild(detailsContainer); // Append to the body or another container
    }

    // Update the container with the distance and time
    detailsContainer.innerHTML = `
        <h2><span>🗺️</span> Your Route</h2>
        <p><strong>Distance:</strong> ${distance}</p>
        <p><strong>Estimated Time:</strong> ${duration}</p>
    `;
    // Apply styles to the container
    detailsContainer.style.backgroundColor = "#3636e3";
    detailsContainer.style.color = "white";
    detailsContainer.style.padding = "15px 30px";
    detailsContainer.style.borderRadius = "5px";
    detailsContainer.style.fontFamily = "'Lexend', sans-serif";
    detailsContainer.style.width = "300px"; // Set a fixed width for the rectangular shape
    detailsContainer.style.boxSizing = "border-box"; // Ensure padding doesn't affect the width

    // Remove padding above the "Route Details" heading
    const heading = detailsContainer.querySelector("h2");
    heading.style.marginTop = "2"; // Removes margin on top of the heading
    
    // Show the details container
    detailsContainer.style.display = "block";
}

function displayBusTimings(busTimings) {
    const timingContainer = document.getElementById("timing-container");

    // Clear any previous timings
    timingContainer.innerHTML = '';

    // Create a heading or text to inform the user
    const timingText = document.createElement('div');
    timingText.id = 'timing-text';
    timingText.textContent = "I will be at this stop at:";
    timingContainer.appendChild(timingText);

    // Create a dropdown for selecting the day type
    const daySelect = document.createElement('select');
    daySelect.id = "day-select";
    daySelect.style.fontFamily = "'Manrope', sans-serif";  // Ensuring font is applied here
    Object.keys(busTimings).forEach(day => {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = capitalizeFirstLetter(day.replace('_', ' '));
        daySelect.appendChild(option);
    });
    timingContainer.appendChild(daySelect);

    // Create an input for the user to enter the time
    const timeInput = document.createElement('input');
    timeInput.id = "time-input";
    timeInput.type = "time";
    timeInput.style.fontFamily = "'Manrope', sans-serif";  // Ensuring font is applied here
    timingContainer.appendChild(timeInput);

    // Create a button to show the next bus time
    const showButton = document.createElement('button');
    showButton.textContent = "Show Next Bus Time";
    showButton.onclick = () => {
        const selectedDay = daySelect.value;
        const selectedTime = timeInput.value;
        showNextBusTime(selectedDay, selectedTime, busTimings);
    };

    // Apply styles to the button
    showButton.style.backgroundColor = "#3636e3";
    showButton.style.color = "white";
    showButton.style.fontFamily = "'Manrope', sans-serif";
    showButton.style.padding = "10px 15px";
    showButton.style.borderRadius = "5px";
    showButton.style.border = "none";
    showButton.style.cursor = "pointer";
    showButton.style.marginTop = "10px";  // Adds some spacing between input and button

    timingContainer.appendChild(showButton);

    // Show the timing container after a destination is selected
    timingContainer.style.display = "block";
}

function showNextBusTime(day, time, busTimings) {
    // Convert time strings to comparable formats (minutes since midnight)
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const selectedTimings = busTimings[day];
    if (!selectedTimings || selectedTimings.length === 0) {
        displayInfoWindow("No bus timings available for the selected day.");
        return;
    }

    const userTimeInMinutes = timeToMinutes(time);

    // Sort timings in ascending order to find the next bus easily
    const sortedTimings = selectedTimings.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

    // Find the first bus timing that is later than the user-provided time
    const nextBusTime = sortedTimings.find(busTime => timeToMinutes(busTime) > userTimeInMinutes);

    if (nextBusTime) {
        displayInfoWindow(`Next bus time: <br>${nextBusTime}`);
    } else {
        displayInfoWindow("No more bus times available after the selected time.");
    }
}

// Helper function to display an InfoWindow on the selected marker
function displayInfoWindow(message) {
    if (!selectedBusStop || !selectedBusStop.marker) {
        console.error("No selected bus stop or marker available.");
        return;
    }

    // Create a cancel button
    const cancelButton = `<button style="background-color: red; color: white; border: none; padding: 5px 10px; margin-left: 10px; cursor: pointer; border-radius: 5px;" onclick="closeInfoWindow()">Cancel</button>`;

    // Create the content for the info window with a blue background and cancel button
    const content = `
        <div style="display: flex; align-items: center; font-size: 20px; font-weight: 400; font-family: 'Lexend', sans-serif; color: white; background-color: blue; padding: 20px; border-radius: 8px;">
            <span>${message}</span>
            ${cancelButton}
        </div>
    `;



    // Create an info window
    const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-size: 20px; font-weight: 400; font-family: 'Lexend', sans-serif; color: white; background-color: #3636e3; padding: 20px; border-radius: 8px;">${message}</div>`,
    });

    // If there is a previous info window, close it
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    // Open the new info window above the marker
    infoWindow.open({
        anchor: selectedBusStop.marker,
        map,
        shouldFocus: false,
    });

    // Update the reference to the current info window
    currentInfoWindow = infoWindow;

}