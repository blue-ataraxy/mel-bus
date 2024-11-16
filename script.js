
// initialize map object
function initMap(){
    map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: { lat: 43.12852, lng: -77.62878 },
    mapId: '', // e.g. terrain
});

    const ctaLayer = new google.maps.KmlLayer({
    url: "https://raw.githubusercontent.com/blue-ataraxy/mel-bus/refs/heads/main/melbus_test.kml",
    map: map,
  });


}