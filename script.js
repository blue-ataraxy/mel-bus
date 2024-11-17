let markers = []; // Global array to store marker data
let directionsRenderer; // To display directions



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
        // Perform your desired search or action
        console.log('Search triggered for:', place);

        // Show the timing container after a destination is selected
        const timingContainer = document.getElementById("timing-container");
        if (timingContainer) {
            timingContainer.style.display = "block"; // Show the timing container
        }
    
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
                
                // Create a marker
                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: placemark.getElementsByTagName('name')[0]?.textContent || `Marker ${i + 1}`
                });
                
                markers.push({ marker, lat, lng }); // Save marker and coordinates

                
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
        for (const { marker, lat, lng } of markers) {
            const distance = calculateDistance(destLat, destLng, lat, lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearestMarker = { marker, lat, lng };
            }
        }

        if (nearestMarker) {
            const nearestLatLng = { lat: nearestMarker.lat, lng: nearestMarker.lng };
            
            // Display the route
            calculateAndDisplayRoute(destLat, destLng, nearestLatLng);
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
        <h2>Route Details:</h2>
        <p><strong>Distance:</strong> ${distance}</p>
        <p><strong>Estimated Time:</strong> ${duration}</p>
    `;
}