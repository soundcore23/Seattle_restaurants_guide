mapboxgl.accessToken = 'pk.eyJ1IjoiYWRpdHlhODkyMyIsImEiOiJjbTFqbDkzMmwwNm9hMmtvbWJxNWNhYWduIn0.UJgHX1BfpgFF6i62mxhfeg';

if (document.getElementById('heatmap')) {

    const priceMap = new mapboxgl.Map({
        container: 'heatmap',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-122.335167, 47.6205],
        zoom: 10.6
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

        // 🔹 SECOND: Load and add heatmap data
        fetch('../assets/rest_price_updated.geojson')
            .then(response => response.json())
            .then(data => {
                priceMap.addSource('restaurants', {
                    type: 'geojson',
                    data: data
                });

                priceMap.addLayer({
                    id: 'heatmap-layer',
                    type: 'heatmap',
                    source: 'restaurants',
                    paint: {
                        'heatmap-weight': ['interpolate', ['linear'], ['get', 'price'], 1, 0.2, 4, 1],
                        'heatmap-intensity': 1,
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(0, 0, 0, 0)',
                            0.1, 'rgba(173, 216, 230, 0.3)',
                            0.3, 'rgba(70, 130, 180, 0.5)',
                            0.6, 'rgba(25, 25, 112, 0.8)'
                        ],
                        'heatmap-radius': 25,
                        'heatmap-opacity': 0.8
                    }
                });

                const priceLegend = document.getElementById('legend');
                priceLegend.innerHTML = `
                    <div><span class="legend-box" style="background: rgba(255, 255, 255, 0.2);"></span> $</div>
                    <div><span class="legend-box" style="background: rgba(173, 216, 230, 0.4);"></span> $$</div>
                    <div><span class="legend-box" style="background: rgba(70, 130, 180, 0.6);"></span> $$$</div>
                    <div><span class="legend-box" style="background: rgba(25, 25, 112, 0.9);"></span> $$$$</div>
                `;
            })
            .catch(error => console.error('Error loading heatmap data:', error));
    });
}
