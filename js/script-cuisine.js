mapboxgl.accessToken = 'pk.eyJ1IjoiYWRpdHlhODkyMyIsImEiOiJjbTFqbDkzMmwwNm9hMmtvbWJxNWNhYWduIn0.UJgHX1BfpgFF6i62mxhfeg';

const cuisines = ["italian", "mexican", "korean", "vietnamese", "greek", "chinese", 
                  "japanese", "indian", "thai", "american", "mediterranean", "vegetarian"];

const cuisineMap = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.25167, 47.6205], 
    zoom: 10.5
});

let neighborhoodData = null;

cuisineMap.on('load', () => {
    fetch('../assets/neighUpdated.geojson')
        .then(response => response.json())
        .then(data => {
            neighborhoodData = data;
            cuisineMap.addSource('neighborhoods', {
                'type': 'geojson',
                'data': data
            });

            addLayer(cuisines[0]);
            updateLegend(cuisines[0]);
            updateTable(cuisines[0]);

            const select = document.getElementById('cuisine-select');
            cuisines.forEach(cuisine => {
                let option = document.createElement('option');
                option.value = cuisine;
                option.textContent = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                updateLayer(e.target.value);
                updateLegend(e.target.value);
                updateTable(e.target.value);
            });
        })
        .catch(error => console.error("Error loading GeoJSON:", error));
});

function getMaxValue(cuisine) {
    let maxValue = 0;
    if (neighborhoodData) {
        neighborhoodData.features.forEach(feature => {
            let value = feature.properties[`${cuisine}_rest_count`] || 0;
            if (value > maxValue) maxValue = value;
        });
    }
    return maxValue;
}

function addLayer(cuisine) {
    let maxVal = getMaxValue(cuisine);
    if (cuisineMap.getSource('neighborhoods')) {
        cuisineMap.addLayer({
            'id': 'neighborhood-layer',
            'type': 'fill',
            'source': 'neighborhoods',
            'paint': {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', `${cuisine}_rest_count`],
                    0, '#ffffff',  
                    maxVal * 0.2, '#ffdac5',
                    maxVal * 0.4, '#ffb3a7',
                    maxVal * 0.6, '#ff6f61',  
                    maxVal * 0.8, '#d84315',
                    maxVal, '#b71c1c'  
                ],
                'fill-opacity': 1
            }
        });

        if (cuisineMap.getLayer('neighborhood-borders')) {
            cuisineMap.removeLayer('neighborhood-borders');
        }
        cuisineMap.addLayer({
            'id': 'neighborhood-borders',
            'type': 'line',
            'source': 'neighborhoods',
            'paint': {
                'line-color': '#000000',
                'line-width': 1.5
            }
        });
    }
}

function updateLayer(cuisine) {
    if (cuisineMap.getLayer('neighborhood-layer')) {
        cuisineMap.removeLayer('neighborhood-layer');
    }
    if (cuisineMap.getLayer('neighborhood-borders')) {
        cuisineMap.removeLayer('neighborhood-borders');
    }

    if (cuisineMap.getSource('neighborhoods')) {
        cuisineMap.getSource('neighborhoods').setData(neighborhoodData);
    }

    addLayer(cuisine);
}

function updateLegend(cuisine) {
    let maxVal = getMaxValue(cuisine);
    const cuisineLegend = document.getElementById('legend');
    cuisineLegend.innerHTML = `<strong>${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} Restaurants</strong><br>` +
        `<div class='legend-box' style='background:#ffffff;'></div> 0 &nbsp;` +
        `<div class='legend-box' style='background:#ffdac5;'></div> ${Math.round(maxVal * 0.2)} &nbsp;` +
        `<div class='legend-box' style='background:#ffb3a7;'></div> ${Math.round(maxVal * 0.4)} &nbsp;` +
        `<div class='legend-box' style='background:#ff6f61;'></div> ${Math.round(maxVal * 0.6)} &nbsp;` +
        `<div class='legend-box' style='background:#d84315;'></div> ${Math.round(maxVal * 0.8)} &nbsp;` +
        `<div class='legend-box' style='background:#b71c1c;'></div> ${maxVal}`;
}

function updateTable(cuisine) {
    let tableContainer = document.getElementById('table-container');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.id = 'table-container';
        document.body.appendChild(tableContainer);
    }
    let total = 0;
    let rows = neighborhoodData.features.map(feature => {
        let count = feature.properties[`${cuisine}_rest_count`] || 0;
        total += count;
        return {
            neighborhood: feature.properties['L_HOOD'] || 'Unknown',
            count: count
        };
    });
    rows.sort((a, b) => b.count - a.count);
    let tableHTML = `<h3>${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} Restaurants</h3>`;
    tableHTML += `<p>Total: ${total} restaurants</p>`;
    tableHTML += `<table><tr><th>Neighborhood</th><th>${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} Restaurant Count</th><th>Percentage of Total</th></tr>`;
    rows.forEach(row => {
        let percentage = total > 0 ? ((row.count / total) * 100).toFixed(2) : 0;
        tableHTML += `<tr><td>${row.neighborhood}</td><td>${row.count}</td><td>${percentage}%</td></tr>`;
    });
    tableHTML += `</table>`;
    tableContainer.innerHTML = tableHTML;
}

const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

cuisineMap.on('mousemove', 'neighborhood-layer', (e) => {
    if (e.features.length > 0) {
        const feature = e.features[0];
        const cuisine = document.getElementById('cuisine-select').value;
        const restaurantCount = feature.properties[`${cuisine}_rest_count`] || 0;
        const neighborhoodName = feature.properties['L_HOOD'] || 'Unknown';

        popup.setLngLat(e.lngLat)
            .setHTML(`<strong>${neighborhoodName}</strong><br>${restaurantCount} ${cuisine} restaurants`)
            .addTo(cuisineMap);
    }
});

cuisineMap.on('mouseleave', 'neighborhood-layer', () => {
    popup.remove();
});
