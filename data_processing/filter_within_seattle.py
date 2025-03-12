import geopandas as gpd
from shapely.geometry import Point
import json

seattle_boundary = gpd.read_file("../assets/seattle_boundary.geojson")

with open("../assets/seattle_restaurants_filtered.geojson", "r") as f:
    yelp_data = json.load(f)

filtered_restaurants = []

for feature in yelp_data["features"]:
    lon, lat = feature["geometry"]["coordinates"]
    point = Point(lon, lat)



    if seattle_boundary.contains(point).bool():
        filtered_restaurants.append(feature)

output_data = {"type": "FeatureCollection", "features": filtered_restaurants}
output_filename = "..assets/seattle_restaurants_final.geojson"

with open(output_filename, "w") as f:
    json.dump(output_data, f, indent=4)

print(f"Saved {len(filtered_restaurants)} Seattle-only restaurants to '{output_filename}'!")
