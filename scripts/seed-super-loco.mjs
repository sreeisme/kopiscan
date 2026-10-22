// Seed (or reset) the Super Loco sales demo: their 2026 menus (dinner, lunch, Sunday roast, kids, El Loco Hour,
// bebidas) merged into one menu, themed to their printed menus, with owner + staff logins.
// Usage: npm run seed:superloco -- --password <pw> [--owner email] [--staff email] [--site https://your-app.vercel.app]
import { pathToFileURL } from "node:url";
import { seedDemo } from "./seed-demo.mjs";

// Tag shorthands for the menu's (V) (VG) (GF) markers.
const V = "vegetarian";
const VG = "vegan";
const GF = "gluten-free";
const HOT = "spicy";

const FLOUR_OR_GF = { name: "Tortilla", min: 1, max: 1, opts: [["Flour tortilla", 0], ["Gluten-free tortilla", 0]] };
const SALAD_PROTEIN = { name: "Add on", min: 0, max: 3, opts: [["Cilantro prawns", 600], ["Grilled chicken", 500], ["Cashew cauliflower", 400]] };
const GLASS_OR_JUG = (jugExtra) => ({ name: "Size", min: 1, max: 1, opts: [["Glass", 0], ["1L jug (serves 4–5)", jugExtra]] });
const GLASS_OR_BOTTLE = (bottleExtra) => ({ name: "Serve", min: 1, max: 1, opts: [["Glass", 0], ["Bottle", bottleExtra]] });
const ROAST_SIDES = ["Crispy potatoes", "Mexican rice", "Braised black beans", "Cashew cauliflower", "Corn off the cob", "Guacamole", "Leafy salad", "Chipotle Brussels sprouts"];
const roast = (extraForTwo) => [
  { name: "Sides", min: 1, max: 1, opts: [["One side", 0], ["Two sides", extraForTwo]] },
  { name: "Choose your sides", min: 1, max: 2, opts: ROAST_SIDES.map((s) => [s, 0]) },
];
const bundleSides = (n) => ({ name: `Choose ${n} sides`, min: n, max: n, opts: ROAST_SIDES.map((s) => [s, 0]) });
const COFFEE_MODS = [
  { name: "Milk", min: 1, max: 1, opts: [["Regular", 0], ["Low fat", 0]] },
  { name: "Make it your way", min: 0, max: 2, opts: [["Iced", 100], ["Extra shot", 100]] },
];

export const SUPER_LOCO_MENU = [
  {
    name: "Snacks & Starters",
    items: [
      { name: "Chips & Salsas", price: 2000, desc: "Crispy tortilla chips, guacamole, salsa roja, spicy piña.", tags: [VG, GF, "bestseller"], mods: [{ name: "Extra", min: 0, max: 4, opts: [["Corn chips", 500], ["Guacamole", 700], ["Salsa roja", 300], ["Spicy piña", 500]] }] },
      { name: "Mexican Hot Wings", price: 1600, desc: "Mexican spiced fried chicken, chipotle, pickled jalapeño, lime crema.", tags: [GF, HOT] },
      { name: "Mexican Street Corn", price: 800, desc: "Grilled sweet corn, chipotle mayo, cotija, lime.", tags: [V, GF] },
      { name: "Corn off the Cob", price: 800, desc: "Sautéed sweet corn, jalapeño, lime mayo, cotija.", tags: [V, GF] },
      { name: "Cashew Cauliflower", price: 700, desc: "Cauliflower, cashew crema, Tajin spice, pickled jalapeño, onion, coriander.", tags: [VG, GF] },
      { name: "Mango Ceviche", price: 1800, desc: "Sustainably-farmed seabass, mango, serrano chilli, celery, mint, coconut, ginger, agave sweet corn.", tags: [GF] },
      { name: "Wagyu Tostadas", price: 1600, desc: "Seared beef, caper mayo, chipotle, red onion salsa, crispy leek.", tags: [GF] },
      { name: "Artichoke Tostadas", price: 1400, desc: "Grilled marinated artichoke, roasted veggie salsa, chilli caramel, pumpkin seed brittle.", tags: [VG, GF] },
    ],
  },
  {
    name: "Tacos & Burritos",
    items: [
      { name: "Baja Fish Taco", price: 1200, desc: "Crispy crumbed barramundi, chilli mango salsa, mint, cabbage, chipotle mayo. Gluten-free version available.", tags: ["bestseller"], mods: [{ name: "Version", min: 1, max: 1, opts: [["Regular", 0], ["Gluten-free", 0]] }] },
      { name: "Carne Asada Taco", price: 1300, desc: "Chargrilled Angus beef, green chilli chimichurri, burnt onion crema, pico de gallo.", tags: [GF] },
      { name: "Chorizo & Beef Brisket Taco", price: 1000, desc: "Spicy pork chorizo, braised beef brisket, cabbage, chipotle salsa.", tags: [GF] },
      { name: "Prawn Taco", price: 1300, desc: "Marinated tiger prawn, bacon achiote mayo, jalapeño, pomegranate relish salsa.", tags: [GF] },
      { name: "Chicken Taco", price: 1000, desc: "Pulled chicken tinga, white onion pineapple salsa, lettuce, lime crema, cotija.", tags: [GF] },
      { name: "Lion's Mane al Pastor Taco", price: 1000, desc: "Al pastor-marinated mushroom, avocado, lettuce, pickled onion, grilled corn, chipotle mayo, cilantro.", tags: [V, GF] },
      { name: "Chicken Burrito", price: 1800, desc: "Marinated grilled chicken, guacamole, lime spice, potato, pico de gallo, corn, chipotle mayo, Monterey Jack, coriander.", tags: [] },
    ],
  },
  {
    name: "Quesadillas",
    items: [
      { name: "Chicken Quesadilla", price: 1900, desc: "Spicy roast chicken, Monterey Jack, frisée salad, pico de gallo, cilantro mayo. 10\" flour tortilla.", tags: [HOT], mods: [FLOUR_OR_GF] },
      { name: "Beef Quesadilla", price: 1900, desc: "Slow-cooked brisket, salsa ranchero, pickled onion, snow pea cress. 10\" flour tortilla.", tags: [], mods: [FLOUR_OR_GF] },
      { name: "Smoked Cheese Quesadilla", price: 1600, desc: "Smoked cheddar, Monterey Jack, mozzarella, cotija, yoghurt verde, pickled onion. 10\" flour tortilla.", tags: [V], mods: [FLOUR_OR_GF] },
    ],
  },
  {
    name: "Mains",
    items: [
      { name: "Angus Ribeye Steak", price: 4400, desc: "Fire-grilled Angus ribeye, porcini & ancho rub, cactus, poblano, onion, cotija, salsa verde, piquillo chimichurri.", tags: [GF] },
      { name: "Oaxacan Chicken", price: 3200, desc: "Charcoal grilled chicken, ancho mole, green wheat, quinoa, tomatillo, tomato, pomegranate, guacamole.", tags: ["chef-pick"] },
      { name: "Pescado", price: 3600, desc: "Sustainably-farmed barramundi, tiger prawn, mussels, guajillo broth, poblano, corn, jalapeño.", tags: [GF] },
      { name: "Pork Rib", price: 3600, desc: "Barbecued pork ribs, chipotle, toasted almond slaw, lime, tortillas.", tags: [GF, HOT] },
      { name: "Beef Barbacoa", price: 3400, desc: "Braised Angus beef cheek, avocado salsa verde, mixed cabbage slaw, pickled onion & jalapeño, coriander, white corn tortilla.", tags: [GF] },
      { name: "Butternut Enchilada", price: 2800, desc: "Roasted pumpkin, kale, tomato, black bean, chipotle & butternut mole, pepitas brittle, mozzarella, lime crema, pickled onion, jalapeño, fried herb.", tags: [V, GF] },
    ],
  },
  {
    name: "Set Menus",
    items: [
      {
        name: "El Loco Fiesta! (per guest)",
        price: 4900,
        desc: "Our chefs' tour of Mexico, for two or more guests. To start: chips & guac, corn off the cob & a tostada. Then a taco each, and Oaxacan chicken with crispy potatoes to share.",
        tags: ["chef-pick"],
        mods: [
          { name: "Tostada", min: 1, max: 1, opts: [["Wagyu", 0], ["Artichoke", 0]] },
          { name: "Taco", min: 1, max: 1, opts: [["Baja fish", 0], ["Carne asada", 0], ["Chorizo & beef brisket", 0], ["Prawn", 0], ["Chicken", 0], ["Lion's mane al pastor", 0]] },
        ],
      },
      {
        name: "Loco Lunch Fiesta! (3 courses)",
        price: 2900,
        desc: "Express lunch, perfect for one hungry loco. A starter, a main, and 2 pc Super Churros to finish.",
        tags: [],
        mods: [
          { name: "Starter", min: 1, max: 1, opts: [["Corn off the cob", 0], ["Mexican street corn", 0]] },
          { name: "Main", min: 1, max: 1, opts: [["Mexican hearty bowl", 0], ["Loco salad", 0], ["Chicken burrito", 0], ["Two tacos of your choice", 0]] },
        ],
      },
    ],
  },
  {
    name: "Salads, Bowls & Sides",
    items: [
      { name: "Loco Salad", price: 1600, desc: "Garden leaves, avocado, roasted poblano, cactus, smoky tomato, corn, pickled onion, pepitas, sesame seed, spicy sherry dressing.", tags: [VG, GF], mods: [SALAD_PROTEIN] },
      {
        name: "Mexican Hearty Bowl",
        price: 1700,
        desc: "Guacamole, roasted butternut, sweet corn, pico de gallo.",
        tags: [VG, GF],
        mods: [
          { name: "Base", min: 1, max: 1, opts: [["Mexican rice", 0], ["Tricolour quinoa", 0]] },
          { name: "Protein", min: 1, max: 1, opts: [["Cilantro prawn", 0], ["Grilled chicken", 0], ["Cashew cauliflower", 0]] },
        ],
      },
      { name: "Crispy Potatoes", price: 1000, desc: "Crispy fried rustic potatoes, smoked salt, chipotle mayo.", tags: [V, GF] },
      { name: "Mexican Rice", price: 800, desc: "Long grain rice, spicy tomato sofrito, jalapeño, coriander.", tags: [VG, GF] },
      { name: "Braised Black Beans", price: 800, desc: "Beans, root vegetables, pico de gallo, cotija, lime crema.", tags: [V, GF] },
    ],
  },
  {
    name: "Sunday Roast (weekends)",
    items: [
      { name: "Loco Half Chicken", price: 2900, desc: "Mexican spice-basted signature roasted chicken, gravy.", tags: ["bestseller"], mods: roast(500) },
      { name: "Loco Whole Chicken", price: 4200, desc: "Mexican spice-basted signature roasted chicken, gravy.", tags: [], mods: roast(500) },
      { name: "Smoked Wagyu", price: 2900, desc: "250g slow-smoked wagyu beef brisket with Mexican dry rub, chipotle glaze.", tags: [GF], mods: roast(500) },
      { name: "Golden Roast Bundle (3–4 amigos)", price: 6900, desc: "Chico Loco half chicken, smoked wagyu brisket 250g, pico de gallo, pickled onion, 3 sides, 4 pc Super Churros.", tags: [], mods: [bundleSides(3)] },
      { name: "Fiesta Feast Bundle (5–6 amigos)", price: 9900, desc: "Chico Loco whole chicken, smoked wagyu brisket 250g, pico de gallo, pickled onion, 4 sides, 6 pc Super Churros.", tags: [], mods: [bundleSides(4)] },
      { name: "Chipotle Brussels Sprouts", price: 700, desc: "Roasted Brussels sprouts, chipotle mayo, spiced macadamia.", tags: [V, GF] },
      { name: "Guacamole", price: 700, desc: "Avocado, tomato, onion, coriander and lime.", tags: [VG, GF] },
      { name: "Leafy Salad", price: 700, desc: "Mesclun salad, pico de gallo, agave & lime dressing.", tags: [VG, GF] },
    ],
  },
  {
    name: "Desserts",
    items: [
      { name: "Super Churros", price: 1400, desc: "Crispy churros, Mexican chocolate sauce, coconut dulce de leche.", tags: [V, "bestseller"] },
      { name: "Chocolate Lava Cake", price: 1400, desc: "Mexican chocolate lava cake, vanilla & chocolate mint ice cream.", tags: [V] },
      { name: "Mango Chamoy Sorbet", price: 600, desc: "Fresh mango, dried raspberry, Tajin spice, pickled fruit and hibiscus dressing.", tags: [VG, GF] },
    ],
  },
  {
    name: "Los Super Niños (kids)",
    items: [
      { name: "Kids Chips n Guac", price: 800, desc: "Crunchy yellow corn chips, avocado.", tags: [VG, GF] },
      { name: "Kids Golden Corn", price: 600, desc: "Grilled corn on the cob with a touch of salt-free butter.", tags: [V, GF] },
      { name: "Kids Chicken Quesadilla", price: 800, desc: "Chicken, corn, cheese, mayonnaise.", tags: [] },
      { name: "Kids Ham Quesadilla", price: 800, desc: "Ham, cheese, mayonnaise.", tags: [] },
      { name: "Kids Cheese Quesadilla", price: 800, desc: "Monterey Jack, cotija, mozzarella, mayo.", tags: [V] },
      { name: "Kids Fish & Crispy Potatoes", price: 1200, desc: "Crunchy crumbed fish fillet, potatoes, tomato ketchup, lemon.", tags: [] },
      { name: "Kids Chicken Taco", price: 800, desc: "Chicken, cheese, ketchup mayo.", tags: [GF] },
      { name: "Kids Fish Taco", price: 1000, desc: "Fish fingers, avocado, sour cream.", tags: [] },
      { name: "Kids Cauliflower Taco", price: 600, desc: "Cauliflower, sweet corn, lime mayo, avocado.", tags: [V, GF] },
      { name: "Kids Churros", price: 800, desc: "Two crunchy churros, chocolate sauce.", tags: [V] },
      { name: "Happy Daze", price: 800, desc: "Vanilla ice cream, chocolate sauce, strawberries, crumbled Oreo.", tags: [V] },
    ],
  },
  {
    name: "El Loco Hour · daily 3–7pm",
    items: [
      { name: "Loco Hour Frozen Lime Margarita (glass)", price: 1000, desc: "Happy-hour price, 3–7pm.", tags: [], mods: [{ name: "Flavour", min: 1, max: 1, opts: [["Lime", 0], ["Pineapple & calamansi", 200], ["Acai & blueberry", 200], ["Prickly pear", 200]] }] },
      { name: "Loco Hour Frozen Lime Margarita (jug)", price: 4500, desc: "1L jug, serves 4–5. Happy-hour price, 3–7pm.", tags: [] },
      { name: "Loco Hour Corona", price: 1000, desc: "Bottle. Happy-hour price, 3–7pm.", tags: [], mods: [{ name: "Size", min: 1, max: 1, opts: [["Bottle", 0], ["Bucket of 5", 3500]] }] },
      { name: "Loco Hour Brewlander Draught", price: 1200, desc: "On tap. Happy-hour price, 3–7pm.", tags: [], mods: [{ name: "Beer", min: 1, max: 1, opts: [["Pesado Pilsner", 0], ["Joy Session IPA", 0], ["Freedom Lager", 0]] }] },
      { name: "Loco Hour Vino", price: 1000, desc: "By the glass. Happy-hour price, 3–7pm.", tags: [], mods: [{ name: "Wine", min: 1, max: 1, opts: [["Bellevie Merlot", 0], ["Buronga Sauvignon Blanc", 0]] }] },
      { name: "Loco Hour Spirits", price: 1000, desc: "Happy-hour price, 3–7pm.", tags: [], mods: [{ name: "Spirit", min: 1, max: 1, opts: [["Nikka Coffey Gin", 0], ["Nikka Coffey Vodka", 0], ["Planteray Dark Rum", 0], ["Planteray Coconut Rum", 200]] }] },
    ],
  },
  {
    name: "Margaritas",
    items: [
      { name: "Frozen Lime Margarita", price: 1800, desc: "Volcan Blanco 100% blue weber agave, lime, agave, orange liqueur.", tags: [], mods: [GLASS_OR_JUG(4500)] },
      { name: "Frozen Pineapple & Calamansi Margarita", price: 1900, desc: "Frozen margarita with tequila blanco, pineapple, calamansi, agave, orange liqueur.", tags: [], mods: [GLASS_OR_JUG(5000)] },
      { name: "Frozen Acai & Blueberry Margarita", price: 1900, desc: "Volcan Blanco 100% blue weber agave.", tags: [], mods: [GLASS_OR_JUG(5000)] },
      { name: "Frozen Prickly Pear Margarita", price: 1900, desc: "Volcan Blanco 100% blue weber agave.", tags: [], mods: [GLASS_OR_JUG(5000)] },
      { name: "El Classico", price: 2100, desc: "Shaken margarita with tequila blanco, orange liqueur, fresh lime, agave.", tags: ["bestseller"], mods: [{ name: "Make it", min: 0, max: 2, opts: [["Double serve", 1400], ["Spicy", 200]] }] },
      { name: "Wild Mezcalita", price: 2100, desc: "Mezcal, orange liqueur, fresh lime, agave, firewater bitters.", tags: [] },
      { name: "Super Tommy's", price: 2200, desc: "Tequila reposado, fresh lime, agave.", tags: [] },
      { name: "Blood Orange Guava", price: 1900, desc: "Tequila blanco, blood orange, guava, fresh lime, agave.", tags: [] },
    ],
  },
  {
    name: "Cócteles & Hotshots",
    items: [
      { name: "Passion Smashito", price: 1900, desc: "Vodka, passionfruit, agave, vanilla extract.", tags: [] },
      { name: "Coconut Mojito", price: 1900, desc: "Coconut and white rum, coconut water, lime, lemongrass-infused agave, mint.", tags: [] },
      { name: "Sangria Roja", price: 1900, desc: "Red wine merlot, tequila blanco, orange liqueur, prickly pear, açai berry, lemongrass-infused agave.", tags: [] },
      { name: "Sparkling Sangria", price: 1900, desc: "Tequila blanco, yuzu, apple, peach, mint, prosecco.", tags: [] },
      { name: "Dirty Negroni", price: 2100, desc: "Mezcal, gin, campari, chinato.", tags: [] },
      { name: "Oaxacan Old Fashioned", price: 2100, desc: "Mezcal, agave, caramelised orange, angostura, aged orange, firewater bitters.", tags: [] },
      { name: "Paloma", price: 1900, desc: "Tequila blanco, campari, grapefruit, agave, soda.", tags: [] },
      {
        name: "Hotshots (4 for 20)",
        price: 2000,
        desc: "Four shots. Mexican Lover: tequila blanco, passionfruit, agave, vanilla. Rosa's Revenge: tequila blanco, prickly pear, firewater bitters. Smoky Bandito: mezcal, açai berry, firewater bitters.",
        tags: [],
        mods: [{ name: "Shots", min: 1, max: 3, opts: [["Mexican Lover", 0], ["Rosa's Revenge", 0], ["Smoky Bandito", 0]] }],
      },
    ],
  },
  {
    name: "Cerveza",
    items: [
      { name: "Brewlander Pesado Pilsner", price: 1600, desc: "", tags: [] },
      { name: "Brewlander Freedom Lager", price: 1600, desc: "", tags: [] },
      { name: "Brewlander Joy Session IPA", price: 1600, desc: "", tags: [] },
      { name: "Guinness", price: 1800, desc: "", tags: [] },
      { name: "Corona | Asahi", price: 1400, desc: "", tags: [], mods: [{ name: "Beer", min: 1, max: 1, opts: [["Corona", 0], ["Asahi", 0]] }, { name: "Size", min: 1, max: 1, opts: [["Bottle", 0], ["Bucket of 5", 5100]] }] },
      { name: "Michelada", price: 1300, desc: "Beer, fresh lime, tomato, orange juice and spices, mezcal.", tags: [], mods: [{ name: "Style", min: 1, max: 1, opts: [["Non-alcoholic", 0], ["Alcoholic", 300]] }] },
      { name: "Tiny but Mighty Hazy IPA (non-alc)", price: 1200, desc: "Non-alcoholic beer.", tags: [] },
    ],
  },
  {
    name: "Vino",
    items: [
      { name: "Merlot, Bellevie Pavillon", price: 1600, desc: "France. House red.", tags: [], mods: [GLASS_OR_BOTTLE(5900)] },
      { name: "Sauvignon Blanc, Buronga Hill", price: 1600, desc: "Australia. House white.", tags: [], mods: [GLASS_OR_BOTTLE(5900)] },
      { name: "Rosé, Les Sardines", price: 1600, desc: "France.", tags: [], mods: [GLASS_OR_BOTTLE(6400)] },
      { name: "Prosecco, Botter Extra Dry", price: 1600, desc: "Italy.", tags: [], mods: [GLASS_OR_BOTTLE(6400)] },
      { name: "Pinot Noir, Tai Tira", price: 10000, desc: "New Zealand. Bottle.", tags: [] },
      { name: "Malbec, DBR (Lafite) Aruma", price: 10500, desc: "Argentina. Bottle.", tags: [] },
      { name: "Cabernet Sauvignon, DBR (Lafite) Los Vascos Cromas", price: 11000, desc: "Chile. Bottle.", tags: [] },
      { name: "Freixenet, Chianti DOCG", price: 9000, desc: "Italy. Bottle.", tags: [] },
      { name: "Sauvignon Blanc, Cloudy Bay", price: 12000, desc: "New Zealand. Bottle.", tags: [] },
      { name: "Chardonnay, Bliss", price: 8500, desc: "California. Bottle.", tags: [] },
      { name: "Freixenet, Pinot Grigio", price: 9000, desc: "Italy. Bottle.", tags: [] },
      { name: "Chablis, Billaud-Simon", price: 11000, desc: "France. Bottle.", tags: [] },
      { name: "Champagne, Louis Roederer", price: 14000, desc: "France. Bottle.", tags: [] },
    ],
  },
  {
    name: "No Alcohólico",
    items: [
      { name: "Pineapple, Cilantro & Mint Soda", price: 900, desc: "Healthy fruit fresca.", tags: [VG] },
      { name: "White Peach Ginger Soda", price: 900, desc: "Healthy fruit fresca.", tags: [VG] },
      { name: "Passionfruit Soda", price: 900, desc: "Healthy fruit fresca.", tags: [VG] },
      { name: "Watermelon Basil Cooler", price: 900, desc: "Healthy fruit fresca.", tags: [VG] },
      { name: "Frozen Fruit Slushie", price: 1000, desc: "", tags: [VG] },
      { name: "Zero Zombie", price: 1500, desc: "Pineapple, passionfruit, lime leaf agave, mango passion kombucha.", tags: [] },
      { name: "Sangria Sin", price: 1500, desc: "0% red wine, berries, spices, soda.", tags: [] },
      { name: "Mango Tamarind", price: 1500, desc: "Tamarind, mango, lemon juice, coconut water.", tags: [] },
      { name: "Apple & Cherry Sour", price: 1500, desc: "Apple-infused tea, aquafaba, black cherry agave.", tags: [VG] },
      { name: "Filtered Still Water on Tap", price: 100, desc: "In-house filtered water — no imported bottles. A portion goes to planting trees in Borneo.", tags: [] },
    ],
  },
  {
    name: "Coffee, Tea & Soft Drinks",
    items: [
      { name: "Espresso", price: 400, desc: "", tags: [], mods: COFFEE_MODS },
      { name: "Long Black (double shot)", price: 500, desc: "", tags: [], mods: COFFEE_MODS },
      { name: "Latte", price: 600, desc: "", tags: [], mods: COFFEE_MODS },
      { name: "Cappuccino", price: 600, desc: "", tags: [], mods: COFFEE_MODS },
      { name: "Flat White", price: 600, desc: "", tags: [], mods: COFFEE_MODS },
      { name: "Tea", price: 700, desc: "", tags: [], mods: [{ name: "Tea", min: 1, max: 1, opts: [["Earl Grey", 0], ["Chamomile", 0], ["English Breakfast", 0], ["Peppermint", 0]] }, { name: "Iced", min: 0, max: 1, opts: [["Make it iced", 100]] }] },
      { name: "Soft Drink", price: 600, desc: "", tags: [], mods: [{ name: "Drink", min: 1, max: 1, opts: [["Coke", 0], ["Coke Zero", 0], ["Sprite", 0], ["Ginger Ale", 0]] }] },
    ],
  },
];

// Matches the printed menus: navy ink + flamingo pink on paper, condensed poster headings, square-ish corners.
export const SUPER_LOCO_THEME = {
  colors: {
    primary: "#2F4B6E",
    onPrimary: "#FFFFFF",
    background: "#F6F4F0",
    surface: "#FFFFFF",
    text: "#253A55",
    mutedText: "#5E6E82",
    accent: "#E8707C",
  },
  font: { heading: "Oswald", body: "Montserrat" },
  radius: "sm",
  layout: "list",
  labels: {
    welcome: "¡Bienvenidos! A fiesta of Mexican flavours — order right from your table.",
    callWaiter: "Call an amigo",
    requestBill: "La cuenta",
    addToCart: "Add to order",
    placeOrder: "¡Vamos! Place order",
  },
  toggles: { showImages: true, showTags: true, showDescriptions: true },
  hideBranding: false,
};

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
  const ownerEmail = arg("owner", "superloco.owner@kopiscan.test");
  const staffEmail = arg("staff", "superloco.staff@kopiscan.test");
  const res = await seedDemo({
    slug: "super-loco",
    plan: "premium",
    name: "Super Loco",
    ownerEmail,
    staffEmail,
    password,
    tableCount: 12,
    menu: SUPER_LOCO_MENU,
    theme: SUPER_LOCO_THEME,
  });
  const site = arg("site", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const items = SUPER_LOCO_MENU.reduce((n, c) => n + c.items.length, 0);
  console.log(`Seeded ${res.slug} (${SUPER_LOCO_MENU.length} categories, ${items} items)  →  ${site}/r/${res.slug}`);
  console.log(`  Owner: ${ownerEmail}   Staff: ${staffEmail}   Password: (the one you passed)   Login: ${site}/login`);
  console.log("Scan links:");
  for (const t of res.tables) console.log(`  Table ${t.label}: ${site}/t/${t.qr_token}`);
}
