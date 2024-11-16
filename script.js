
function initMap(){
    
    // initialize map object
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: { lat: 43.12852, lng: -77.62878 },
        mapId: '', // e.g. terrain
    });
    
    //
    const ctaLayer = new google.maps.KmlLayer({
        url: "https://raw.githubusercontent.com/blue-ataraxy/mel-bus/refs/heads/main/melbus_test.kml",
        map: map,
    });
    
    
    fetch("https://raw.githubusercontent.com/blue-ataraxy/mel-bus/refs/heads/main/melbus_test.kml")
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
                new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: placemark.getElementsByTagName('name')[0]?.textContent || `Marker ${i + 1}`,
                });
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
}
