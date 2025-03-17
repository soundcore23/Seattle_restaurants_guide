mapboxgl.accessToken = 'pk.eyJ1IjoiYWRpdHlhODkyMyIsImEiOiJjbTFqbDkzMmwwNm9hMmtvbWJxNWNhYWduIn0.UJgHX1BfpgFF6i62mxhfeg';

if (document.getElementById('heatmap')) {

    const priceMap = new mapboxgl.Map({
        container: 'heatmap',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-122.335167, 47.6205],
        zoom: 10.4
    });

    priceMap.on('load', function () {
        fetch('../assets/Neighborhood_Map_Atlas_Districts.geojson')
            .then(response => response.json())
            .then(neighborhoodData => {
                priceMap.addSource('neighborhoods', {
                    type: 'geojson',
                    data: neighborhoodData
                });

                priceMap.addLayer({
                    id: 'neighborhood-borders',
                    type: 'line',
                    source: 'neighborhoods',
                    layout: {},
                    paint: {
                        'line-color': '#FF0000',
                        'line-width': 2,
                        'line-opacity': 0.3
                    }
                });
            })
            .catch(error => console.error('Error loading neighborhood boundaries:', error));

        
        fetch('../assets/rest_price_updated.geojson')
            .then(response => response.json())
            .then(data => {
                priceMap.addSource('restaurants', {
                    type: 'geojson',
                    data: data
                });

                priceMap.addLayer({
                    id: 'dot-density-layer',
                    cluster: true,
                    type: 'circle',
                    source: 'restaurants',
                    paint: {
                        'circle-radius': 5, // Consistent dot size
                        'circle-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'price'],
                            1, 'rgb(173, 216, 230)',  // Light blue for price 1
                            2, 'rgb(100, 149, 237)',  // Cornflower blue for price 2
                            3, 'rgb(30, 144, 255)',   // Dodger blue for price 3
                            4, 'rgb(0, 0, 139)'       // Dark blue for price 4
                        ],
                        'circle-opacity': 0.7
                    }
                });

                priceMap.on('click', 'dot-density-layer', function (e) {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const name = e.features[0].properties.name;

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(`<strong>${name}</strong>`)
                        .addTo(priceMap);
                });

                priceMap.on('mouseenter', 'dot-density-layer', function () {
                    priceMap.getCanvas().style.cursor = 'pointer';
                });
                
                priceMap.on('mouseleave', 'dot-density-layer', function () {
                    priceMap.getCanvas().style.cursor = '';
                });

                const priceLegend = document.getElementById('legend');
                
priceLegend.innerHTML = `
    <div class="dot-density-legend">
        <div><span class="legend-box" style="background: rgb(173, 216, 230);"></span> $</div>
        <div><span class="legend-box" style="background: rgb(100, 149, 237);"></span> $$</div>
        <div><span class="legend-box" style="background: rgb(30, 144, 255);"></span> $$$</div>
        <div><span class="legend-box" style="background: rgb(0, 0, 139);"></span> $$$$</div>
    </div>
`;

            })
            .catch(error => console.error('Error loading dot density data:', error));
    });
}
