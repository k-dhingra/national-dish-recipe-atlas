# National dishes, A to Z

An interactive recipe atlas for the 2026 30 Day Map Challenge, Day 23, Taste.

Open [the live site](https://k-dhingra.github.io/national-dish-recipe-atlas/) or, locally, open `index.html` in a browser. There is no build step. For a local server:

```
python3 -m http.server 8765 --directory .
```

then visit http://localhost:8765/

To swap a dish image, replace `images/dishes/{ISO3}.jpg` (uppercase ISO 3166-1 alpha-3, 800 px JPEG, under 150 KB) and push to `main`. If you add or remove a file, also run `python3 work/compile_site.py` from a checkout that includes the `work/` folder (that folder is not in this repo).

## What's on a card

- The country's name, its listed national dish, a Natural Earth outline, and a dish illustration when one exists.
- Click the card, or open the pop-up on the header map and then the card, to read the recipe or description.
- If Wikibooks Cookbook has a reusable recipe, the ingredients and method are shown, with a CC BY-SA attribution and a link.
- If not, a short Wikipedia description is shown, with attribution, plus a link to a recipe page that was checked and was not a 404, or to the Wikipedia article.
- Countries with no entry on Wikipedia's National dish list appear as grey cards and say "No single national dish". They are not omitted, so the set is the same 195 countries used for coverage.
- Dominica's listed dish is mountain chicken, a critically endangered frog. That card has no dish image and falls back to the country outline.

Recipes are never invented. Dish images are AI illustrations.

## Coverage (23 November 2026)

- 195 cards, one per country, in alphabetical order by country name, from Afghanistan to Zimbabwe.
- 175 cards have a listed dish; 174 of those have a dish image. One card (Dominica) has a dish but no image.
- 64 cards have a full reusable recipe from Wikibooks Cookbook (CC BY-SA 4.0).
- The remaining dish cards have a Wikipedia description and, where a real recipe page exists, a link. No recipe text is invented.
- 20 cards have no listed national dish and are shown greyed.

Cookbook pages were used only when the recipe clearly matches the listed dish. Close but wrong matches (for example Carbonara standing in for Italy's generic "pasta") were not used.


## Header map

Countries are coloured by the base staple of the listed national dish: rice, wheat, maize, roots and tubers, pulses, meat or fish, or mixed or unclear. The 20 countries with no listed dish stay grey and are not a staple class. Tap a colour in the legend to filter the map and the cards. On a computer, hover a country for a pop-up with the dish photo; click to open the card. On a phone, the first tap shows the pop-up and a second tap opens the card.

The staple class for each dish is in `data/staples.csv`, taken from the dish name, Wikipedia description and recipe text already in the data. Where the evidence is missing or points to more than one staple, the class is mixed or unclear.

## Sources and licences

- Dish list: Wikipedia, [National dish](https://en.wikipedia.org/wiki/National_dish), revision 1385959241, 16 November 2026. Text from Wikipedia is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Recipes, where present: [Wikibooks Cookbook](https://en.wikibooks.org/wiki/Cookbook:Table_of_Contents), also [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Map and country outlines: [Natural Earth](https://www.naturalearthdata.com/) 1:50m, public domain. The header map is Equal Earth. Morocco uses the internationally recognised border. Western Sahara is a dashed outline and is not filled with couscous. The United States outline includes Alaska and Hawaii as insets.
- Dish images are AI-generated illustrations, not photographs of real plates. They are provided for this atlas and should be treated as such.
