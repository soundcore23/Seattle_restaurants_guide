import json

with open("seattle_restaurants_final.geojson", "r") as f:
    rest_data = json.load(f)

count_changed = 0
count_unchanged = 0

for feature in rest_data['features']:
    restaurants = feature['properties']
    if 'price' in restaurants and isinstance(restaurants['price'], str):
        old_price = restaurants['price']
        if old_price == '$':
            restaurants['price'] = 1
        elif old_price == '$$':
            restaurants['price'] = 2
        elif old_price == '$$$':
            restaurants['price'] = 3
        elif old_price == '$$$$':
            restaurants['price'] = 4
        else:
            restaurants['price'] = None
        
        if old_price in {'$', '$$', '$$$', '$$$$'}:
            count_changed += 1
        else:
            count_unchanged += 1


with open("rest_price_updated.geojson", "w") as f:
    json.dump(rest_data, f, indent=4)

print(f"Total prices changed: {count_changed}", f"Total prices unchanged: {count_unchanged}")
