import requests
import json
import time

API_KEY = "5ZliXDdce67XKrwLcobQLN6wfIp2wFfRy8ty8W4U8MOIhcDRO5Bw0sx3J1cBTDkwo3oDrZHV1fzAVnP0qUvHdxbsShKTn1TEvFAJwJQznIBmzQiLyT1sr-4TP5y7Z3Yx"
YELP_API_URL = "https://api.yelp.com/v3/businesses/search"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

CATEGORIES = ["italian", "mexican", "korean", "vietnamese", "greek", "chinese", "japanese", "indian", "thai", "american", "mediterranean", "vegetarian"]
PRICES = ["1", "2", "3", "4"]

OUTPUT_FILE = "../assets/seattle_restaurants_filtered.geojson"

def fetch_restaurants(category=None, price=None):
    """ Fetch restaurants using filters (category, price) and paginate results. """
    all_restaurants = []
    offset = 0
    MAX_OFFSET = 190

    while offset <= MAX_OFFSET:
        params = {
            "location": "Seattle, WA",
            "categories": category,
            "price": price,
            "limit": 50,
            "offset": offset,
            "sort_by": "distance"
        }

        try:
            response = requests.get(YELP_API_URL, headers=HEADERS, params=params)
            data = response.json()

            if "businesses" not in data:
                print(f"Error fetching {category}, price {price}: {data}")
                break

            businesses = data["businesses"]
            if not businesses:
                break

            for biz in businesses:
                if "coordinates" in biz and "latitude" in biz["coordinates"] and "longitude" in biz["coordinates"]:
                    all_restaurants.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [biz["coordinates"]["longitude"], biz["coordinates"]["latitude"]]
                        },
                        "properties": {
                            "name": biz.get("name", "Unknown"),
                            "rating": biz.get("rating", 0),
                            "cuisine_type": [cat["title"] for cat in biz.get("categories", [])],
                            "address": " ".join(biz.get("location", {}).get("display_address", [])),
                            "price": biz.get("price", "N/A"),
                            "review_count": biz.get("review_count", 0),
                            "phone": biz.get("display_phone", "N/A"),
                            "yelp_url": biz.get("url", "#")
                        }
                    })

            offset += 50 
            time.sleep(1) 

        except requests.exceptions.RequestException as e:
            print(f"Request failed for {category}, price {price}: {e}")
            time.sleep(5)  # Retry delay

    return all_restaurants

all_data = []

# Fetch data by category and price
for category in CATEGORIES:
    for price in PRICES:
        print(f"🔹 Fetching {category} restaurants with price level {price}...")
        category_data = fetch_restaurants(category=category, price=price)
        all_data.extend(category_data)

# Saving to GeoJSON
geojson_data = {"type": "FeatureCollection", "features": all_data}
with open(OUTPUT_FILE, "w") as f:
    json.dump(geojson_data, f, indent=4)

print(f"All {len(all_data)} restaurants collected successfully!")
