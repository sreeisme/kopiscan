// Seed (or reset) the Café Malabar sales demo: their full menu from cafemalabar.sg/menu (prices, descriptions and
// dish photos), themed to their website (cream, coffee brown and gold), with their chai-pourer mascot as the logo and
// the dum biryani hero shot as the cover. Images are fetched from their site at seed time, cropped/compressed with
// sharp and uploaded to the menu-assets bucket; a dish whose photo can't be fetched just has no image.
// Usage: npm run seed:malabar -- --password <pw> [--owner email] [--staff email] [--site https://your-app.vercel.app]
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { pathToFileURL } from "node:url";
import { seedDemo } from "./seed-demo.mjs";

const V = "vegetarian";
const HOT = "spicy";

// Base price = cheapest option; each option carries the difference.
const pick = (name, base, opts) => ({ name, min: 1, max: 1, opts: opts.map(([n, p]) => [n, p - base]) });
const CHAYA = (base, opts) => [pick("Serve", base, opts)];

export const CAFE_MALABAR_MENU = [
  {
    name: "Signatures",
    items: [
      { name: "Malabar Porotta with Beef", price: 990, desc: "The quintessential Malabar pairing. Flaky porotta served with our signature beef roast.", tags: ["bestseller", "chef-pick"] },
      { name: "Kallappam with Beef", price: 990, desc: "Soft, fermented rice and coconut pancakes paired with our signature beef roast.", tags: [] },
      { name: "Appam with Egg Roast", price: 1090, desc: "Soft-centred rice pancakes paired with eggs in a thick, caramelised onion and tomato gravy.", tags: [] },
      { name: "Puttu with Kadala Curry", price: 750, desc: "The classic Kerala breakfast of steamed rice cake and spiced chickpea curry.", tags: [V] },
      { name: "Puttu with Beef Stew", price: 1050, desc: "A hearty duo of steamed rice cake and mild, creamy beef stew.", tags: [] },
      { name: "Paal Kappa with Meen / Erachi Curry", price: 1590, desc: "Creamy mashed cassava simmered in coconut milk, served with your choice of spicy fish or beef curry.", tags: ["chef-pick"], mods: [pick("Curry", 0, [["Meen (fish) curry", 0], ["Erachi (beef) curry", 0]])] },
      { name: "KL 14", price: 1890, desc: "Soft pathiri served with coconut milk and beef varattiyathu, slow-roasted in thick Malabar masala.", tags: [] },
      { name: "Kizhi Porotta", price: 1090, desc: "Flaked porotta and rich gravy wrapped in a scorched banana leaf and steamed.", tags: [], mods: [pick("Choice", 1090, [["Chicken", 1090], ["Beef", 1290], ["Mutton", 1490]])] },
      { name: "Paal Porotta", price: 1390, desc: "Flaky Malabar porotta soaked in creamy coconut milk gravy, served with chicken or beef.", tags: [], mods: [pick("Choice", 1390, [["Chicken", 1390], ["Beef", 1690]])] },
    ],
  },
  {
    name: "Biryani, Mandi & Al-Faham",
    items: [
      {
        name: "Signature Dum Biryani",
        price: 890,
        desc: "Traditional Malabar biryani, slow-cooked with aromatic short-grain rice and your choice of vegetables, egg, meat or seafood.",
        tags: ["bestseller", "chef-pick"],
        mods: [pick("Choice", 890, [["Veg", 890], ["Egg", 990], ["Chicken", 1190], ["Beef", 1390], ["Mutton", 1590], ["Fish", 1590], ["Prawns", 1690], ["Lamb shank", 2390]])],
      },
      { name: "Bamboo Biryani", price: 1390, desc: "Fragrant biryani steamed inside bamboo to seal in its juices and aroma.", tags: [], mods: [pick("Choice", 1390, [["Chicken", 1390], ["Beef", 1690], ["Mutton", 1790], ["Prawn", 1890]])] },
      { name: "Kizhi Biryani", price: 1390, desc: "Biryani wrapped in banana leaf and steamed for a fragrant, earthy finish.", tags: [], mods: [pick("Choice", 1390, [["Chicken", 1390], ["Beef", 1690], ["Mutton", 1790], ["Fish", 1890], ["Prawn", 1890]])] },
      { name: "Malabar Mandi", price: 1290, desc: "Fragrant smoked rice served with your choice of tender meat or fish.", tags: [], mods: [pick("Choice", 1290, [["Chicken", 1290], ["Beef", 1690], ["Mutton", 1790], ["Fish", 1690], ["Lamb shank", 2200]])] },
      { name: "Al-Faham Mandi", price: 1450, desc: "Charcoal-grilled chicken served over fragrant mandi rice.", tags: [], mods: [pick("Size", 1450, [["Quarter", 1450], ["Half", 2590]])] },
      {
        name: "Chicken Al-Faham",
        price: 1290,
        desc: "Smoky charcoal-grilled chicken with 1 Malabar porotta, garlic sauce, mint chutney & kachumber salad.",
        tags: [],
        mods: [
          pick("Size", 1290, [["Quarter", 1290], ["Half", 2050]]),
          pick("Flavour", 0, [["Original", 0], ["Kaanthari", 0], ["Peri peri", 0], ["BBQ", 0], ["Hot honey", 0], ["Lemon garlic", 0]]),
          { name: "Add-on", min: 0, max: 1, opts: [["Hummus", 400]] },
        ],
      },
      { name: "Al-Faham Special Platter", price: 3090, desc: "Half a charcoal-grilled chicken with two Malabar porotta, fries and fragrant mandi rice.", tags: [] },
    ],
  },
  {
    name: "Meals",
    items: [
      { name: "Banana Leaf Meals", price: 990, desc: "Traditional Kerala meals served on banana leaf with rice, curries and sides.", tags: [], mods: [pick("Choice", 990, [["Veg", 990], ["Chicken", 1090], ["Fish", 1190]])] },
    ],
  },
  {
    name: "Kozhi · Chicken",
    items: [
      { name: "Signature Chicken Curry", price: 1190, desc: "Our house-special rustic chicken gravy.", tags: [] },
      { name: "Paal Kaanthari", price: 1390, desc: "Tender chicken in a rich coconut gravy spiced with sharp bird's eye chillies.", tags: [HOT, "chef-pick"] },
      { name: "Mango Chicken Curry", price: 1390, desc: "A coastal speciality: savoury chicken gravy with the tang of fresh mango.", tags: [] },
      { name: "Payyoli Chicken Fry", price: 1250, desc: "North Malabar style fried chicken topped with spiced coconut crumbs.", tags: [] },
      { name: "Butter Chicken", price: 1150, desc: "Tender chicken in a mild, creamy tomato-butter sauce.", tags: [] },
      { name: "Chicken Tikka Masala", price: 1490, desc: "Chicken tikka served in a rich, spiced tomato masala.", tags: [] },
      { name: "Chilli Chicken", price: 1290, desc: "Chicken tossed with chillies, onions and peppers in a savoury Indo-Chinese sauce.", tags: [HOT] },
      { name: "Pepper Chicken", price: 1290, desc: "A fiery dry preparation dominated by crushed black pepper and curry leaves.", tags: [HOT] },
      { name: "Chicken Varuval", price: 1290, desc: "A dry-cooked speciality with roasted spices and curry leaves.", tags: [] },
      { name: "Chicken Stew", price: 1290, desc: "Tender chicken simmered in a gentle coconut milk gravy with mild spices.", tags: [] },
      { name: "Chicken Roast", price: 1090, desc: "Chicken slow-cooked in a thick, onion-rich gravy.", tags: [] },
      { name: "Chicken 65", price: 1090, desc: "Spicy, deep-fried bite-sized chicken marinated with signature spices.", tags: [HOT] },
      { name: "Nadan Chicken Fry", price: 1150, desc: "Kerala-style chicken fried with aromatic spices and curry leaves.", tags: [] },
    ],
  },
  {
    name: "Erachi · Beef",
    items: [
      { name: "Beef Ularthiyathu", price: 1190, desc: "Kerala's famous dry-roasted beef with coconut slices and hand-ground black pepper.", tags: ["bestseller"] },
      { name: "Beef Roast", price: 1190, desc: "Slow-cooked beef in a thick, spicy onion-tomato masala.", tags: [HOT] },
      { name: "Beef Dry Fry", price: 1190, desc: "Spiced beef morsels fried with curry leaves.", tags: [] },
      { name: "Beef Stew", price: 1190, desc: "Tender beef simmered in a mild, fresh coconut milk gravy.", tags: [] },
      { name: "Beef Curry", price: 1190, desc: "Tender beef in a warming, Kerala-style spiced gravy.", tags: [] },
      { name: "Beef Varattiyathu", price: 1290, desc: "Beef slow-roasted with thick masala and aromatic spices.", tags: [] },
    ],
  },
  {
    name: "Aadu · Mutton",
    items: [
      { name: "Mutton Varattiyathu", price: 1390, desc: "Mutton slow-roasted with thick masala.", tags: [] },
      { name: "Mutton Kurma", price: 1490, desc: "A rich and mild gravy made with coconut, cashews and delicate spices.", tags: [] },
      { name: "Mutton Stew", price: 1390, desc: "A gentle, aromatic preparation simmered in fresh coconut milk with mild spices.", tags: [] },
      { name: "Mutton Masala", price: 1390, desc: "Tender mutton simmered in a traditional, aromatic spiced gravy.", tags: [] },
      { name: "Mutton Curry", price: 1390, desc: "Tender mutton pieces cooked in a classic, medium-spiced thick gravy.", tags: [] },
      { name: "Mutton Pepper Fry", price: 1390, desc: "A bold, dry preparation with a heavy infusion of freshly ground black pepper.", tags: [HOT] },
    ],
  },
  {
    // Fish Fry and Meen Pollichathu are market price on their menu, so they're left out of QR ordering.
    name: "Meen · Fish & Prawns",
    items: [
      { name: "Meen Moilee", price: 1490, desc: "A classic Malabar fish curry in a mild turmeric and coconut milk sauce.", tags: [] },
      { name: "Meen Varatharachath", price: 1290, desc: "Fish cooked in a deeply roasted and ground coconut gravy.", tags: [] },
      { name: "Mango Fish Curry", price: 1390, desc: "Traditional tangy fish curry with raw mango slices.", tags: [] },
      { name: "Meen Molakittath", price: 1290, desc: "A spicy red fish curry prepared with Malabar tamarind and chillies.", tags: [HOT] },
      { name: "Prawns Masala", price: 1490, desc: "Prawns cooked in a rich, aromatic spiced masala.", tags: [] },
      { name: "Prawns Mango Curry", price: 1490, desc: "Prawns in a tangy coastal curry with mango.", tags: [] },
    ],
  },
  {
    name: "Vegetarian Favourites",
    items: [
      { name: "Gobi Manchurian", price: 690, desc: "Crispy cauliflower in a tangy Indo-Chinese sauce, served dry or with gravy.", tags: [V], photo: "Gobi Manchurian (Dry / Gravy)", mods: [pick("Style", 0, [["Dry", 0], ["Gravy", 0]])] },
      { name: "Paneer Butter Masala", price: 890, desc: "Soft cottage cheese cubes in a rich, mildly spiced tomato and butter sauce.", tags: [V] },
      { name: "Gobi 65", price: 590, desc: "Crispy, deep-fried cauliflower with signature spices. Served dry.", tags: [V, HOT], photo: "Gobi 65 (Dry)" },
      { name: "Kadai Vegetables", price: 590, desc: "Stir-fried seasonal vegetables in a bold, freshly ground spice mix.", tags: [V] },
      { name: "Mushroom Pepper Fry", price: 750, desc: "Mushrooms tossed with black pepper, spices and curry leaves.", tags: [V] },
      { name: "Vegetable Kurma", price: 650, desc: "Seasonal vegetables in a delicate coconut and cashew-based gravy.", tags: [V] },
      { name: "Vegetable Stew", price: 650, desc: "Seasonal vegetables in a mild, aromatic coconut milk gravy.", tags: [V] },
      { name: "Channa Masala", price: 590, desc: "Hearty chickpeas slow-cooked in a tangy, spiced masala.", tags: [V] },
      { name: "Bhindi Masala", price: 750, desc: "Fresh okra sautéed with onions, tomatoes and regional spices.", tags: [V] },
      { name: "Aloo Masala", price: 550, desc: "Tender potatoes cooked with turmeric, onions and tempered mustard seeds.", tags: [V] },
      { name: "Kadala Curry", price: 550, desc: "Chickpeas simmered in a rich Kerala-style spiced gravy.", tags: [V] },
    ],
  },
  {
    name: "Egg Selection",
    items: [
      { name: "Egg Roast", price: 750, desc: "Boiled eggs in a thick, caramelised onion and tomato gravy.", tags: [] },
      { name: "Egg Curry", price: 690, desc: "Boiled eggs in a traditional, medium-spiced onion and tomato gravy.", tags: [] },
      { name: "Egg Kurma", price: 690, desc: "A mild and creamy coconut-based egg curry.", tags: [] },
      { name: "Egg Bhurji", price: 650, desc: "Indian-style scrambled eggs with onions, green chillies and fresh spices.", tags: [] },
      { name: "Omelette", price: 300, desc: "Freshly made with onions, green chillies and black pepper.", tags: [] },
    ],
  },
  {
    name: "Bread & Rice",
    items: [
      { name: "Malabar Porotta", price: 190, desc: "The classic flaky, multi-layered flatbread.", tags: ["bestseller"] },
      { name: "Nool Porotta", price: 300, desc: "Delicate, stringy ribbon porotta.", tags: [] },
      { name: "Appam", price: 200, desc: "Soft-centred rice pancakes with crispy edges.", tags: [V] },
      { name: "Egg Appam", price: 300, desc: "Our soft-centred appam cooked with an egg.", tags: [] },
      { name: "Kallappam", price: 200, desc: "Soft, fermented rice pancakes made with coconut.", tags: [V] },
      { name: "Puttu", price: 500, desc: "Steamed rice cylinders layered with fresh coconut.", tags: [V] },
      { name: "Pathiri (3 pcs)", price: 450, desc: "Silk-soft, paper-thin rice flour pancakes.", tags: [V] },
      { name: "Ney Pathiri", price: 450, desc: "Flavourful, deep-fried rice bread.", tags: [V] },
      { name: "Idiyappam (3 pcs)", price: 350, desc: "Steamed rice string hoppers.", tags: [V] },
      { name: "Chapatti", price: 190, desc: "Soft, traditional whole-wheat flatbread.", tags: [V] },
      { name: "Ghee Rice", price: 500, desc: "Aromatic short-grain rice tempered with pure ghee and spices.", tags: [V] },
      { name: "White Rice", price: 350, desc: "Steamed white rice.", tags: [V] },
      { name: "Kappa (Tapioca)", price: 500, desc: "Tender tapioca (cassava), prepared in traditional Kerala style.", tags: [V], photo: "Kappa (Tapioca / Cassava)" },
    ],
  },
  {
    name: "Starters",
    items: [
      { name: "Injipuli Chicken Wings", price: 890, desc: "Crispy wings glazed in a traditional tangy ginger & tamarind sauce.", tags: ["chef-pick"] },
      { name: "Malabar Beef Hummus with Parotta", price: 1250, desc: "Creamy hummus topped with spicy Malabar beef fry, served with our signature flaky parotta.", tags: ["chef-pick"] },
      { name: "Malabar Beef Fry Loaded Fries", price: 850, desc: "Topped with spiced beef roast & signature sauces.", tags: [] },
      { name: "Butter Chicken Loaded Fries", price: 790, desc: "Crispy fries smothered in our rich butter chicken gravy.", tags: [] },
      { name: "Gobi 65 Loaded Fries", price: 650, desc: "Crispy fries topped with spiced Gobi 65 cauliflower & signature sauces.", tags: [V] },
      { name: "Souq Masala Fries", price: 350, desc: "Crispy fries dusted with our house-special spice blend.", tags: [V] },
      { name: "Chicken Samosa (2 pcs)", price: 450, desc: "Crispy pastries filled with spiced chicken.", tags: [] },
      { name: "Kerala Egg Puff", price: 290, desc: "Flaky, golden pastry stuffed with a spicy egg masala.", tags: [] },
      { name: "Pazham Pori", price: 200, desc: "Authentic Kerala-style sweet banana fritters.", tags: [V] },
      { name: "Unnakaya", price: 250, desc: "Golden banana dumplings with a sweet egg filling.", tags: [] },
    ],
  },
  {
    name: "Shakes & Faloodas",
    items: [
      { name: "Avil Milk", price: 1190, desc: "A legendary Malabar street shake made with beaten rice, bananas and chilled milk.", tags: ["bestseller"], mods: [pick("Flavour", 1190, [["Classic rose", 1190], ["Malabar mango", 1190], ["Chocolate hazelnut", 1190], ["Tender coconut", 1290]])] },
      { name: "Falooda", price: 650, desc: "A rich, layered dessert drink with vermicelli, basil seeds and ice cream.", tags: [] },
      { name: "Banana Dates", price: 1000, desc: "A creamy shake blending bananas and sweet dates.", tags: [] },
      { name: "Abood", price: 800, desc: "A rich, creamy speciality shake.", tags: [] },
      { name: "Classic Milkshake", price: 790, desc: "Smooth, creamy milkshakes in your favourite flavours.", tags: [], photo: "Classic Milkshakes", mods: [pick("Flavour", 790, [["Vanilla", 790], ["Chocolate", 790], ["Oreo", 900], ["Butterscotch", 900]])] },
    ],
  },
  {
    name: "Coolers & Lassi",
    items: [
      { name: "Mango Lassi", price: 550, desc: "Creamy yoghurt drink blended with sweet mangoes.", tags: [] },
      { name: "Moru", price: 350, desc: "Traditional savoury Kerala-style spiced buttermilk.", tags: [] },
      { name: "Rose Milk", price: 450, desc: "Chilled milk infused with sweet floral rose syrup.", tags: [] },
      { name: "Lime Soda", price: 450, desc: "Refreshing lime soda.", tags: [], mods: [pick("Style", 0, [["Sweet", 0], ["Salted", 0], ["Mixed", 0]])] },
      { name: "Lime Juice", price: 350, desc: "A refreshing chilled lime drink.", tags: [] },
      { name: "Canned Drink", price: 300, desc: "Ask our team for the available selection.", tags: [], photo: "Canned Drinks" },
      { name: "Kulukki Sarbath", price: 690, desc: "Kerala-style shaken refreshment.", tags: [], mods: [pick("Flavour", 0, [["Pineapple", 0], ["Mango", 0], ["Passion fruit", 0]])] },
      { name: "Mojito (non-alcoholic)", price: 590, desc: "Refreshing, non-alcoholic favourites.", tags: [], photo: "Mojitos", mods: [pick("Flavour", 0, [["Malabar Afterglow", 0], ["Blueberry Breeze", 0], ["Rose Blush", 0]])] },
    ],
  },
  {
    name: "Chaya Kada · Tea & Coffee",
    items: [
      { name: "Malabar Chaya", price: 120, desc: "Our signature milk tea.", tags: ["bestseller"], mods: CHAYA(120, [["Cutting", 120], ["Hot", 200], ["Iced", 350]]) },
      { name: "Karak Chai", price: 250, desc: "Strong, spiced tea slow-simmered for a deep, rich flavour.", tags: [], mods: CHAYA(250, [["Hot", 250], ["Iced", 390]]) },
      { name: "Sulaimani", price: 120, desc: "Zesty, spiced black tea: a refreshing palate cleanser.", tags: [], mods: CHAYA(120, [["Cutting", 120], ["Hot", 250], ["Iced", 300]]) },
      { name: "Mundhiri Kattan", price: 250, desc: "Black tea infused with grapes for a sweet-spiced finish.", tags: [], mods: CHAYA(250, [["Cutting", 250], ["Iced", 400]]) },
      { name: "Pineapple Kattan", price: 250, desc: "Black tea infused with pineapple.", tags: [], mods: CHAYA(250, [["Cutting", 250], ["Iced", 400]]) },
      { name: "Bru Coffee", price: 250, desc: "Comforting coffee, served hot or iced.", tags: [], mods: CHAYA(250, [["Hot", 250], ["Iced", 400]]) },
      { name: "Milo", price: 250, desc: "A comforting malt drink, served hot or iced.", tags: [], mods: CHAYA(250, [["Hot", 250], ["Iced", 400]]) },
    ],
  },
  {
    name: "Desserts",
    items: [
      { name: "Pazham Pori Split", price: 850, desc: "A decadent dessert version of our banana fritters served with speciality toppings.", tags: [V] },
      { name: "Gulab Jamun (2 pcs)", price: 390, desc: "Soft, syrup-soaked sweets for a classic finishing touch.", tags: [V], mods: [pick("Serve", 390, [["Plain", 390], ["With ice cream", 590]])] },
      { name: "Fruit Salad with Ice Cream", price: 690, desc: "Fresh mixed fruit served with a scoop of ice cream.", tags: [V] },
      { name: "Ice Cream", price: 290, desc: "Creamy scoops in your choice of flavour.", tags: [V], mods: [pick("Flavour", 0, [["Vanilla", 0], ["Chocolate", 0], ["Strawberry", 0]]), pick("Scoops", 290, [["Single", 290], ["Double", 490]])] },
      { name: "Premium Ice Cream", price: 390, desc: "Tender coconut or butterscotch.", tags: [V], photo: "Ice Cream", mods: [pick("Flavour", 0, [["Tender coconut", 0], ["Butterscotch", 0]]), pick("Scoops", 390, [["Single", 390], ["Double", 690]])] },
    ],
  },
];

// Dish photos on cafemalabar.sg, keyed by the dish name on their menu (an item's `photo` overrides its own name).
const SITE = "https://cafemalabar.sg";
const A = "/__l5e/assets-v1/";
const PHOTOS = {
  "Malabar Porotta with Beef": "31d1fb22-3518-44b8-a37d-65aad9d7f334/beef-parotta.png",
  "Kallappam with Beef": "3c4bb17f-f653-4b81-bed9-64014eb891e4/kallappam-beef.jpg",
  "Appam with Egg Roast": "622138eb-828c-4b5a-90a7-07c466a5494c/new-appam-egg.jpg",
  "Puttu with Kadala Curry": "2271f061-a6e0-4bdf-847d-6df3e54c0c98/puttu-kadala.jpg",
  "Puttu with Beef Stew": "b1485a15-c496-4b1a-ad84-4d34276a2ce5/puttu-stew.jpg",
  "Paal Kappa with Meen / Erachi Curry": "340d1eac-f6e6-43c5-a191-9b2617761199/paalkappa-hands.png",
  "KL 14": "89687575-0dfa-4b7b-8274-e1fc219485ca/new-kl14.jpg",
  "Kizhi Porotta": "68ed2dbe-14a8-4426-9b89-67bc8434f3b0/kizhi-parotta.jpg",
  "Paal Porotta": "e58bd684-2cd3-40ad-8341-01ae4f2b4539/new-paal-porotta.jpg",
  "Signature Dum Biryani": "5721a3a0-313b-460f-aad0-51006436b090/biryani-handi.png",
  "Bamboo Biryani": "a24d46e1-f094-46b6-aaa2-d877a9693fd5/bamboo-biryani.jpg",
  "Kizhi Biryani": "1436fd6a-55f5-4fc5-8696-da8848b96057/kizhi-biryani.jpg",
  "Malabar Mandi": "88c87a37-a4a8-491c-811d-8f2e860d32d6/malabar-mandi.webp",
  "Al-Faham Mandi": "b5038d6b-8f84-4e54-bd7f-f739b3a80941/alfahm-mandi.jpg",
  "Chicken Al-Faham": "12cd6381-0c15-441a-9693-b978becffb12/chicken-alfaham.jpg",
  "Al-Faham Special Platter": "748da052-0ed6-4bd3-b909-970abbd451d9/new-alfaham-platter.webp",
  "Banana Leaf Meals": "89128fbf-1aae-4615-8e8b-995e2262dc69/banana-leaf-meals.jpg",
  "Signature Chicken Curry": "637a599f-d75a-4fc7-b69e-f9d0265b44b4/signature-chicken.jpg",
  "Paal Kaanthari": "9836c928-ea75-4b8f-a06d-03ccf3303df7/paal-kaanthari.jpg",
  "Mango Chicken Curry": "afd1f578-b48c-4bdf-ab20-0db2432a77fc/mango-chicken.jpg",
  "Payyoli Chicken Fry": "db8902b3-640f-45a4-bd11-925ded2b6e8b/payyoli-chicken-fry.jpg",
  "Butter Chicken": "0c339f25-7069-4d9a-95bb-bba5f6bffee8/butter-chicken.jpg",
  "Chicken Tikka Masala": "a1e526b9-0d54-42db-a206-a9fbc0e3757a/new-chk-tikka.jpg",
  "Chilli Chicken": "7f19efc6-efbe-4f4e-8248-6e5a8cf9a8d4/new-chk-chilli.jpg",
  "Pepper Chicken": "d9575665-d02f-4590-b956-cb105b2a4f40/pepper-chicken.jpg",
  "Chicken Varuval": "a83ba49f-d715-40ab-a7be-566fe72d2501/chicken-varuval.jpg",
  "Chicken Stew": "5a666a49-4969-4eb9-8d96-4f25aa692e7e/new-chk-stew.jpg",
  "Chicken Roast": "8f0ece94-3477-4e8d-b43f-7b5e8e19d006/chicken-roast.jpg",
  "Chicken 65": "f50fb7c3-f241-4524-b1fa-701c668a4407/chicken-65.jpg",
  "Nadan Chicken Fry": "71806ed6-c9f5-4c0b-8814-198e29f68000/nadan-chicken-fry.webp",
  "Beef Ularthiyathu": "e118ae09-0fa6-4e06-a870-564d79944512/beef-ularthiyathu.jpg",
  "Beef Roast": "d786599e-378d-494c-b996-50623905159a/beef-roast.jpg",
  "Beef Dry Fry": "754aa923-2b34-4920-a291-3da4ae8ec1a5/beef-dry-fry.jpg",
  "Beef Stew": "659ad632-fa68-47fe-9dfe-fc614ad93bf7/new-beef-stew.jpg",
  "Beef Curry": "d786599e-378d-494c-b996-50623905159a/beef-roast.jpg",
  "Beef Varattiyathu": "9be8f619-2037-4598-bd8d-2c3f758bba28/new-beef-var.jpg",
  "Mutton Varattiyathu": "f7b26d27-9e13-4c4f-baa4-3bf288e53ea5/mutton-varattiyathu.jpg",
  "Mutton Kurma": "d6e11b5a-070c-41a1-8c3a-339836c4e90e/mutton-kurma.jpg",
  "Mutton Stew": "a4b8557d-3fa6-4024-9c0f-3c45647d9ed1/new-mut-stew.jpg",
  "Mutton Masala": "94af4471-2496-4627-86e0-9a00cde5b829/mutton-masala.jpg",
  "Mutton Curry": "94af4471-2496-4627-86e0-9a00cde5b829/mutton-masala.jpg",
  "Mutton Pepper Fry": "5a4bab89-062a-4b20-9fb5-dcdd3fb0c936/mutton-pepper-fry.jpg",
  "Meen Moilee": "ccb80cf8-ff7b-4d92-9fde-a7e49223a1e3/meen-moilee.jpg",
  "Meen Varatharachath": "5a73a888-a103-4a36-91ba-9271c7d70dd6/meen-varatharachath.webp",
  "Mango Fish Curry": "cd6e4105-9a98-4fb7-a258-8edf97d46492/mango-fish-curry.webp",
  "Meen Molakittath": "78323b94-7ba6-4318-905c-71f56a48a637/meen-molakittath.jpg",
  "Prawns Masala": "6b958aee-3e46-4a0d-a235-af85ecbcc184/new-prawn-masala.jpg",
  "Prawns Mango Curry": "21d5546d-5bdf-4cdb-b6f2-1060486aa7b1/new-prawn-mango.jpg",
  "Gobi Manchurian (Dry / Gravy)": "db03634e-84d8-4b79-9799-c76caf36afa9/gobi-manchurian.jpg",
  "Paneer Butter Masala": "d8e8035f-769e-4bbb-a007-0485887ff941/paneer-butter-masala.jpg",
  "Gobi 65 (Dry)": "f3eb8ff1-9626-4f44-affe-b3602744e793/gobi-65-fry.jpg",
  "Kadai Vegetables": "8c17286a-0daa-41e9-aef6-ade4325229a3/kadai-veg.jpg",
  "Mushroom Pepper Fry": "46edf902-fb5c-4b48-b6cc-4f30b8e17de4/mushroom-pepper-fry.webp",
  "Vegetable Kurma": "b60389d8-f54d-4020-8557-43a07da5e01d/veg-kurma.jpg",
  "Vegetable Stew": "95958f75-abe1-4117-85df-e0b8aebd7350/new-vegstew.jpg",
  "Channa Masala": "9cf116c9-704c-4387-acb1-ec60bfdce25c/channa-masala.jpg",
  "Bhindi Masala": "db86f44c-c470-4ae2-9138-39bb0c79572f/bhindi-masala.jpg",
  "Aloo Masala": "46edab25-2e80-493d-8807-21077758fc1b/aloo-masala.jpg",
  "Kadala Curry": "9cf116c9-704c-4387-acb1-ec60bfdce25c/channa-masala.jpg",
  "Egg Roast": "bc268683-04ca-474e-b8ea-51b6cc6c1200/egg-roast.jpg",
  "Egg Curry": "a1c791fc-d54c-455c-9fc0-c45173f31fb5/egg-curry.jpg",
  "Egg Kurma": "c445d032-6cb9-4cfb-ad4c-2aa525c84539/egg-kurma.png",
  "Egg Bhurji": "c0baf378-6559-4df1-8877-c4e6ac2e308f/egg-burji.jpg",
  "Omelette": "e9577e28-37e2-457d-a31e-70a5299a4f91/omelette.jpg",
  "Malabar Porotta": "1326bc1e-4c52-4e95-aef8-a83f0f3ec8fc/malabar-parotta.webp",
  "Nool Porotta": "a07b9b2e-3805-4d47-be98-185b52e48dd5/nool-parotta.jpg",
  "Appam": "34514d7c-0c60-41d7-ac68-f8c727273475/appam.jpg",
  "Egg Appam": "34bbae4c-d98c-4f03-957f-b5d67c7d4cd2/new-egg-appam.jpg",
  "Kallappam": "ccc93392-bbcf-4853-a01f-ecd1434b6bdc/kallappam.webp",
  "Puttu": "91e5cc1f-767d-45f9-af46-7402193703f9/puttu.jpg",
  "Pathiri (3 pcs)": "3680958f-8f0f-4afb-a221-7e7b2afa5c9d/pathiri.webp",
  "Ney Pathiri": "38127524-82a4-4679-8541-fe0229f21e9a/neipathiri.jpg",
  "Idiyappam (3 pcs)": "b48858da-3e6a-48e5-aec1-a9e28619cfc1/idiyappam.webp",
  "Chapatti": "cc388916-3de5-4aa1-9a81-425beca316ed/new-chapatti.jpg",
  "Ghee Rice": "d8f54988-7b31-4d48-8c52-72d9750e20d1/ghee-rice.jpg",
  "White Rice": "d8f54988-7b31-4d48-8c52-72d9750e20d1/ghee-rice.jpg",
  "Kappa (Tapioca / Cassava)": "e886b7c4-6da7-45f3-b69f-3ba61873a8cd/new-kappa.jpg",
  "Injipuli Chicken Wings": "bd1e4d2d-22cb-4afe-bef8-2c49fdb1c0e2/injipuli-chicken-wings-upload.jpg",
  "Malabar Beef Hummus with Parotta": "6c167906-8636-463a-9c32-be574aef9236/beef-hummus.png",
  "Malabar Beef Fry Loaded Fries": "20b3f2d4-2331-442f-8702-9f49db9e45d5/beef-loaded-fries.jpg",
  "Butter Chicken Loaded Fries": "9299cfdf-fabc-4f0e-89b2-68c0c80ecfe1/butter-chicken-fries.webp",
  "Gobi 65 Loaded Fries": "cbb5cc03-68a9-4d5f-9903-39db712d2611/chicken-65-fries.jpg",
  "Souq Masala Fries": "3edf557d-a41b-4d5d-b98c-40a4d7d0e9a9/souq-masala-fries.jpg",
  "Chicken Samosa (2 pcs)": "8fbe9c90-487f-4c0a-a1cc-9b4b1a2986ba/new-samosa.jpg",
  "Kerala Egg Puff": "881a1e4f-1163-4010-bc41-063229c188cd/kerala-egg-puff.jpg",
  "Pazham Pori": "22f950de-7385-4a9b-89e6-b787dbdf70ce/pazham-pori.webp",
  "Unnakaya": "d225f2ec-472d-41fd-aaf4-a72c5b852ce2/new-unnakaya.jpg",
  "Avil Milk": "2031775e-a102-48b5-a062-21bd8436aaf3/avil-milk.jpg",
  "Falooda": "f89b561b-cfb7-4744-940d-77634fa686a9/falooda.jpg",
  "Banana Dates": "818259ec-c565-4a87-9636-3d02ccd96b7c/new-bandates.jpg",
  "Abood": "406fd9fd-7fa7-4bca-a2d8-94c0f8d93522/new-abood.jpg",
  "Classic Milkshakes": "/assets/ss-vanilla-CL33z-8n.jpg",
  "Mango Lassi": "f462981a-3e33-4ecb-a83b-1506c009dcc0/mango-lassi.jpg",
  "Moru": "89184180-d1c5-44bb-ac27-40408b757269/moru.jpg",
  "Rose Milk": "efcfebae-8844-4e62-811e-08465fac24c0/rose-milk.jpg",
  "Lime Soda": "b73762c6-bca2-4a74-96c3-248d6463c2fc/lime-soda.webp",
  "Lime Juice": "0df646b1-7fd4-4c21-b7a4-1d4ab55b8d34/lime-juice.jpg",
  "Canned Drinks": "e647434b-62f6-49a2-8a25-8f078c7d41a9/canned-drinks.jpg",
  "Kulukki Sarbath": "807a36be-9737-463a-ab8f-8c3536c187b4/new-kulukki.jpg",
  "Mojitos": "022053a8-3a7f-47e9-bdb2-b6d2f5b13972/new-mojito.webp",
  "Pazham Pori Split": "8b5ac16b-bffc-42fd-982a-84681d7f8600/new-pazham-split.jpg",
  "Gulab Jamun (2 pcs)": "265cd993-13fc-4e6a-b16f-ab321aedf3bb/gulab-jamun.webp",
  "Fruit Salad with Ice Cream": "19606d28-f585-460b-958f-2b82a29b8448/new-fruitsalad.jpg",
  "Ice Cream": "c6ec271a-9f36-4604-975f-c94707249826/new-icecream.jpg",
};
const LOGO = `${A}5b3f4ad0-f3a2-448f-89d2-1328c889aae6/logo.png`;
const COVER = `${A}5721a3a0-313b-460f-aad0-51006436b090/biryani-handi.png`;

// Their site uses Fraunces + Inter on cream, coffee brown and gold (converted from its oklch tokens).
// Fraunces isn't in our font list, so Playfair Display stands in for the headings.
export const CAFE_MALABAR_THEME = {
  colors: {
    primary: "#33160C",
    onPrimary: "#FDFBEC",
    background: "#FDFBEC",
    surface: "#FAF1DC",
    text: "#33160C",
    mutedText: "#5E4034",
    accent: "#CA8A10",
  },
  font: { heading: "Playfair Display", body: "Inter" },
  radius: "md",
  layout: "list",
  labels: {
    welcome: "Flavours of Malabar, stories of Arabia. Order right from your table.",
    callWaiter: "Call staff",
    requestBill: "Request bill",
    addToCart: "Add to order",
    placeOrder: "Place order",
  },
  toggles: { showImages: true, showTags: true, showDescriptions: true },
  hideBranding: false,
};

// Their menu only mentions a 10% service charge, no GST.
const SETTINGS = { pricesIncludeTax: false, serviceChargePct: 10, gstPct: 0, orderingEnabled: true };

// Their host's mod_security rejects requests without browser-like headers.
async function fetchImage(path) {
  const res = await fetch(SITE + path, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", Accept: "image/*" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Logo: the chai-pourer mascot from the right of their wordmark, on cream, square (the diner header shows a circle). */
async function makeLogo() {
  const crop = await sharp(await fetchImage(LOGO)).extract({ left: 1420, top: 0, width: 250, height: 430 }).png().toBuffer();
  const figure = await sharp(await sharp(crop).trim().png().toBuffer()).resize({ width: 440, height: 440, fit: "inside" }).toBuffer();
  return sharp({ create: { width: 512, height: 512, channels: 4, background: CAFE_MALABAR_THEME.colors.surface } })
    .composite([{ input: figure, gravity: "center" }])
    .webp({ quality: 85 })
    .toBuffer();
}

/** Cover: the dum biryani hero shot, cropped to a wide band around the handi, papadums and pickles. */
async function makeCover() {
  return sharp(await fetchImage(COVER)).extract({ left: 0, top: 820, width: 1366, height: 820 }).resize(1600).webp({ quality: 78 }).toBuffer();
}

async function attachImages(restaurantId) {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const upload = async (path, body) => {
    const { error } = await db.storage.from("menu-assets").upload(path, body, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (error) throw error;
    return path;
  };

  const assets = {
    logoPath: await upload(`${restaurantId}/brand/logo.webp`, await makeLogo()),
    coverPath: await upload(`${restaurantId}/brand/cover.webp`, await makeCover()),
  };
  const { error } = await db.from("restaurants").update({ theme: { ...CAFE_MALABAR_THEME, assets } }).eq("id", restaurantId);
  if (error) throw error;

  const { data: items, error: itemsErr } = await db.from("menu_items").select("id, name").eq("restaurant_id", restaurantId);
  if (itemsErr) throw itemsErr;
  const photoKey = new Map(CAFE_MALABAR_MENU.flatMap((c) => c.items.map((it) => [it.name, it.photo ?? it.name])));
  const cache = new Map(); // several dishes share a photo on their site
  const missing = [];
  let done = 0;
  for (const item of items) {
    const src = PHOTOS[photoKey.get(item.name)];
    if (!src) continue;
    try {
      if (!cache.has(src)) {
        const img = await sharp(await fetchImage(src.startsWith("/") ? src : A + src)).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
        cache.set(src, await upload(`${restaurantId}/items/${src.split("/")[0].slice(0, 8)}-${src.split("/").pop().replace(/\.\w+$/, "")}.webp`, img));
      }
      const { error: e } = await db.from("menu_items").update({ image_path: cache.get(src) }).eq("id", item.id);
      if (e) throw e;
      done++;
    } catch (e) {
      missing.push(`${item.name} (${e.message})`);
    }
  }
  return { photos: done, missing };
}

// CLI
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`);
    return i > 0 ? process.argv[i + 1] : d;
  };
  const password = arg("password");
  if (!password || password.length < 8) {
    console.error("Pass --password <at least 8 chars> for the owner and staff demo logins.");
    process.exit(1);
  }
  const ownerEmail = arg("owner", "malabar.owner@kopiscan.test");
  const staffEmail = arg("staff", "malabar.staff@kopiscan.test");
  const res = await seedDemo({
    slug: "cafe-malabar",
    plan: "premium",
    name: "Café Malabar",
    ownerEmail,
    staffEmail,
    password,
    tableCount: 12,
    menu: CAFE_MALABAR_MENU,
    theme: CAFE_MALABAR_THEME,
    settings: SETTINGS,
  });
  const { photos, missing } = await attachImages(res.restaurantId);
  const site = arg("site", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const items = CAFE_MALABAR_MENU.reduce((n, c) => n + c.items.length, 0);
  console.log(`Seeded ${res.slug} (${CAFE_MALABAR_MENU.length} categories, ${items} items, ${photos} photos, logo + cover)  →  ${site}/r/${res.slug}`);
  if (missing.length) console.log(`  No photo for: ${missing.join(", ")}`);
  console.log(`  Owner: ${ownerEmail}   Staff: ${staffEmail}   Password: (the one you passed)   Login: ${site}/login`);
  console.log("Scan links:");
  for (const t of res.tables) console.log(`  Table ${t.label}: ${site}/t/${t.qr_token}`);
}
