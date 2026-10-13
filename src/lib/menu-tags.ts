export const TAGS = ["vegetarian", "vegan", "spicy", "halal", "no-pork", "gluten-free", "new", "bestseller", "chef-pick"] as const;
export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  spicy: "Spicy",
  halal: "Halal",
  "no-pork": "No pork",
  "gluten-free": "Gluten-free",
  new: "New",
  bestseller: "Bestseller",
  "chef-pick": "Chef's pick",
};
