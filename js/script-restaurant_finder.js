 // Mobile menu toggle
 function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("show");
  }
  
  // Mapbox Access Token
  mapboxgl.accessToken = 'pk.eyJ1IjoiYWRpdHlhODkyMyIsImEiOiJjbTFqbDkzMmwwNm9hMmtvbWJxNWNhYWduIn0.UJgHX1BfpgFF6i62mxhfeg';

  let userLocation = null;
  let restaurantData;
  let locationMarker = null;
  let isochroneExists = false;

  // Initialize the Map
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.335167, 47.608013],
    zoom: 12
  });

  // Add Geocoder for Location Search
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false
  });
  document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

      // Handle Geocoder Selection
      geocoder.on("result", (event) => {
          userLocation = event.result.geometry.coordinates;

          map.flyTo({ center: userLocation, zoom: 13 });

          clearPreviousSelections();
          addLocationMarker(userLocation);
          updateIsochrone();
      });

  // Function to Add Location Marker
  function addLocationMarker(coords) {
    if (locationMarker) {
      locationMarker.remove();
    }
    locationMarker = new mapboxgl.Marker({ color: "red" })
      .setLngLat(coords)
      .addTo(map);
  }

  // Function to Clear Previous Selections
  function clearPreviousSelections() {
    if (isochroneExists) {
      map.removeLayer("isochrone-layer");
      map.removeSource("isochrone");
      isochroneExists = false;
    }
  }

      // Load GeoJSON Data for Restaurants
      fetch("../assets/seattle_restaurants_final.geojson")
          .then(response => response.json())
          .then(data => {
              restaurantData = data;

              map.on("load", () => {
                  map.addSource("restaurants", { type: "geojson", data: restaurantData });
                  map.addLayer({
                      id: "restaurants-layer",
                      type: "circle",
                      source: "restaurants",
                      paint: {
                          "circle-radius": 8,              // Keep circle size
                          "circle-color": "#000000",       // Black color
                          "circle-stroke-width": 1,        // Thin white border
                          "circle-stroke-color": "#ffffff" // White border color
                      }
                  });

                  updateRestaurantList(restaurantData.features);
                  populateCuisineDropdown();
                  populatePriceDropdown();
              });
          });

      // Populate Cuisine Dropdown
      function populateCuisineDropdown() {
          const cuisineSet = new Set();
          restaurantData.features.forEach(feature => {
              if (Array.isArray(feature.properties.cuisine_type)) {
                  feature.properties.cuisine_type.forEach(cuisine => cuisineSet.add(cuisine));
              }
          });

          const cuisineDropdown = document.getElementById("cuisine");
          cuisineSet.forEach(cuisine => {
              const option = document.createElement("option");
              option.value = cuisine;
              option.textContent = cuisine;
              cuisineDropdown.appendChild(option);
          });
      }

      // Populate Price Dropdown
      function populatePriceDropdown() {
          const priceSet = new Set();

          // Collect unique price values from the dataset
          restaurantData.features.forEach(feature => {
              const price = feature.properties.price;
              if (price) { // Ensure price is not null or undefined
                  priceSet.add(price);
              }
          });

          const priceDropdown = document.getElementById("price");
          priceDropdown.innerHTML = '<option value="all">All</option>'; // Reset dropdown

          priceSet.forEach(priceLevel => {
              const option = document.createElement("option");
              option.value = priceLevel;
              option.textContent = priceLevel;
              priceDropdown.appendChild(option);
          });
      }


  function updateRestaurantList(restaurants) {
    const list = document.getElementById("restaurant-list");
    list.innerHTML = "";
    const seen = new Set();
    restaurants.forEach(restaurant => {
      const name = restaurant.properties.name;
      if (!seen.has(name)) {
        seen.add(name);
        const li = document.createElement("li");
        li.innerHTML = `<strong>${name}</strong><br>${restaurant.properties.address}`;
        list.appendChild(li);
      }
    });
  }

      // Function to Fetch Isochrone Data & Filter Restaurants
      function updateIsochrone() {
          if (!userLocation) return alert("Please select a location first.");

          const travelTime = document.getElementById("travel-time").value;
          const cuisineType = document.getElementById("cuisine").value;
          const priceLevel = document.getElementById("price").value;

          // If "All" is selected for travel time, just filter by cuisine and price
          if (travelTime === "all") {
              console.log("ℹ️ 'All' selected: Filtering by cuisine and price only.");

              // Remove previous isochrone if any
              clearPreviousSelections();

              // Filter restaurants only by cuisine type and price
              const filteredRestaurants = {
                  type: "FeatureCollection",
                  features: restaurantData.features.filter(feature => 
                      (cuisineType === "all" || feature.properties.cuisine_type.includes(cuisineType)) &&
                      (priceLevel === "all" || feature.properties.price.includes(priceLevel))
                  )
              };

              // Update restaurant points on the map
              if (map.getSource("restaurants")) {
                  map.getSource("restaurants").setData(filteredRestaurants);
              }

              // Update restaurant list
              updateRestaurantList(filteredRestaurants.features);
              return;
          }

          // If a travel time is selected, apply isochrone filtering
          const isochroneUrl = `https://api.mapbox.com/isochrone/v1/mapbox/walking/${userLocation[0]},${userLocation[1]}?contours_minutes=${travelTime}&polygons=true&access_token=${mapboxgl.accessToken}`;

          fetch(isochroneUrl)
              .then(response => response.json())
              .then(isochrone => {

                  // Remove previous isochrone
                  clearPreviousSelections();

                  // Add new isochrone layer first, then update restaurants
                  map.addSource("isochrone", { type: "geojson", data: isochrone });
                  map.addLayer({
                      id: "isochrone-layer",
                      type: "fill",
                      source: "isochrone",
                      layout: {},
                      paint: { "fill-color": "#007bff", "fill-opacity": 0.3 }
                  });

                  isochroneExists = true;

                  map.moveLayer("restaurants-layer");

                  // Filter restaurants inside the isochrone and by cuisine type and price
                  const filteredRestaurants = {
                      type: "FeatureCollection",
                      features: restaurantData.features.filter(feature => 
                          turf.booleanPointInPolygon(feature.geometry, isochrone.features[0].geometry) &&
                          (cuisineType === "all" || feature.properties.cuisine_type.includes(cuisineType)) &&
                          (priceLevel === "all" || feature.properties.price.includes(priceLevel))
                      )
                  };

                  // Update restaurant points on the map
                  if (map.getSource("restaurants")) {
                      map.getSource("restaurants").setData(filteredRestaurants);
                  }

                  // Update restaurant list
                  updateRestaurantList(filteredRestaurants.features);
              })
              .catch(error => console.error("Error fetching Isochrone:", error));
      }


      // Function to Clear All Selections
      function clearSelection() {
          geocoder.clear();
          document.getElementById("cuisine").value = "all";
          document.getElementById("price").value = "all";
          document.getElementById("travel-time").value = "all";

          if (locationMarker) {
              locationMarker.remove();
              locationMarker = null;
          }

          if (isochroneExists) {
              map.removeLayer("isochrone-layer");
              map.removeSource("isochrone");
              isochroneExists = false;
          }

          // Reset the restaurant data on the map
          if (map.getSource("restaurants")) {
              map.getSource("restaurants").setData(restaurantData);
          }

          // Reset the side panel to show all restaurants
          updateRestaurantList(restaurantData.features);
      }
