import json
from shapely.geometry import Point, shape

# Load restaurant and neighborhood data
with open("..assets/seattle_restaurants_final.geojson", "r") as f:
    rest_data = json.load(f)

with open("..assets/Neighborhood_Map_Atlas_Districts.geojson", "r") as f:
    neigh_data = json.load(f)

# List of cuisines to track
cuisine_list = ["italian", "mexican", "korean", "vietnamese", "greek", "chinese", 
                "japanese", "indian", "thai", "american", "mediterranean", "vegetarian"]

# Dictionary to hold cuisine counts per neighborhood
neighborhood_cuisine_counts = {}
total_count = 0
assigned_count = 0
unmatched_restaurants = []  # Store restaurants that did not match any cuisine

# Initialize cuisine counts for each neighborhood
for neigh in neigh_data["features"]:
    neighborhood_name = neigh["properties"]["L_HOOD"]
    neighborhood_cuisine_counts[neighborhood_name] = {f"{cuisine}_rest_count": 0 for cuisine in cuisine_list}

# Assign restaurants to neighborhoods and count cuisines
for feature in rest_data["features"]:
    lon, lat = feature["geometry"]["coordinates"]
    point = Point(lon, lat)
    cuisines = feature["properties"].get("cuisine_type", [])

    assigned = False
    
    # Find the neighborhood containing this restaurant
    for neigh in neigh_data["features"]:
        neighborhood_name = neigh["properties"]["L_HOOD"]
        polygon = shape(neigh["geometry"])  # Convert neighborhood geometry to Shapely polygon
        
        if polygon.contains(point):
            assigned = True
            assigned_count += 1
            
            matched = False  # Track if at least one cuisine matches
            for cuisine in cuisines:
                cuisine_lower = cuisine.lower()
                if cuisine_lower in cuisine_list:
                    matched = True
                    total_count += 1
                    neighborhood_cuisine_counts[neighborhood_name][f"{cuisine_lower}_rest_count"] += 1
            
            # If no cuisine matched, store it in the unmatched list
            if not matched:
                unmatched_restaurants.append(feature)
            
            break  # Stop checking once the neighborhood is found

# Update neighborhood GeoJSON with cuisine counts
for neigh in neigh_data["features"]:
    neighborhood_name = neigh["properties"]["L_HOOD"]
    neigh["properties"].update(neighborhood_cuisine_counts[neighborhood_name])

# Save updated neighborhood GeoJSON
with open("..assets/neighUpdated.geojson", "w") as f:
    json.dump(neigh_data, f, indent=4)

# Save unmatched restaurants to a separate GeoJSON
unmatched_geojson = {"type": "FeatureCollection", "features": unmatched_restaurants}
with open("unmatched_restaurants.geojson", "w") as f:
    json.dump(unmatched_geojson, f, indent=4)

print("✅ Updated neighborhood GeoJSON with restaurant cuisine counts successfully!", 
      f"rest_added = {total_count}", f"assigned = {assigned_count}")
print(f"✅ Unmatched restaurants saved: {len(unmatched_restaurants)}")
