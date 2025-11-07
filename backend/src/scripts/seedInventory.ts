import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FoodItem, FoodCategory } from '../models/FoodItem';
import { DatabaseConfig } from '../config/database';

// Load environment variables
dotenv.config();

// Sample food items data
const sampleFoodItems = [
  // Fruits
  {
    name: 'Fresh Red Apples',
    description: 'Crisp and sweet red apples, perfect for snacking or baking. Rich in fiber and vitamin C.',
    category: FoodCategory.FRUIT,
    price: 120, // ₹120 per kg
    stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    isActive: true
  },
  {
    name: 'Organic Bananas',
    description: 'Naturally ripened organic bananas, great source of potassium and natural energy.',
    category: FoodCategory.FRUIT,
    price: 60, // ₹60 per dozen
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
    isActive: true
  },
  {
    name: 'Fresh Oranges',
    description: 'Juicy Valencia oranges packed with vitamin C and natural citrus flavor.',
    category: FoodCategory.FRUIT,
    price: 80, // ₹80 per kg
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400',
    isActive: true
  },
  {
    name: 'Strawberries',
    description: 'Sweet and juicy strawberries, perfect for desserts or eating fresh.',
    category: FoodCategory.FRUIT,
    price: 250, // ₹250 per 500g
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
    isActive: true
  },
  {
    name: 'Grapes - Green',
    description: 'Seedless green grapes, sweet and refreshing. Great for snacking.',
    category: FoodCategory.FRUIT,
    price: 150, // ₹150 per kg
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400',
    isActive: true
  },
  {
    name: 'Pineapple',
    description: 'Fresh tropical pineapple, sweet and tangy. Rich in vitamin C and enzymes.',
    category: FoodCategory.FRUIT,
    price: 50, // ₹50 per piece
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400',
    isActive: true
  },

  // Vegetables
  {
    name: 'Fresh Carrots',
    description: 'Crisp orange carrots, excellent source of beta-carotene and fiber.',
    category: FoodCategory.VEGETABLE,
    price: 40, // ₹40 per kg
    stock: 180,
    imageUrl: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400',
    isActive: true
  },
  {
    name: 'Organic Broccoli',
    description: 'Fresh organic broccoli crowns, packed with vitamins and minerals.',
    category: FoodCategory.VEGETABLE,
    price: 80, // ₹80 per 500g
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400',
    isActive: true
  },
  {
    name: 'Bell Peppers - Mixed',
    description: 'Colorful mix of red, yellow, and green bell peppers. Sweet and crunchy.',
    category: FoodCategory.VEGETABLE,
    price: 120, // ₹120 per kg
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
    isActive: true
  },
  {
    name: 'Fresh Spinach',
    description: 'Baby spinach leaves, perfect for salads and cooking. Rich in iron.',
    category: FoodCategory.VEGETABLE,
    price: 30, // ₹30 per bunch
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    isActive: true
  },
  {
    name: 'Tomatoes - Roma',
    description: 'Fresh Roma tomatoes, perfect for cooking and sauces. Rich in lycopene.',
    category: FoodCategory.VEGETABLE,
    price: 60, // ₹60 per kg
    stock: 140,
    imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400',
    isActive: true
  },
  {
    name: 'Cucumber',
    description: 'Fresh cucumbers, crisp and refreshing. Great for salads and snacking.',
    category: FoodCategory.VEGETABLE,
    price: 25, // ₹25 per kg
    stock: 110,
    imageUrl: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400',
    isActive: true
  },
  {
    name: 'Red Onions',
    description: 'Fresh red onions, adds flavor and nutrition to any dish.',
    category: FoodCategory.VEGETABLE,
    price: 35, // ₹35 per kg
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    isActive: true
  },

  // Non-veg
  {
    name: 'Chicken Breast - Boneless',
    description: 'Fresh boneless chicken breast, lean protein perfect for grilling or baking.',
    category: FoodCategory.NON_VEG,
    price: 350, // ₹350 per kg
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
    isActive: true
  },
  {
    name: 'Ground Beef - 85% Lean',
    description: 'Fresh ground beef, 85% lean. Perfect for burgers, tacos, and pasta dishes.',
    category: FoodCategory.NON_VEG,
    price: 450, // ₹450 per kg
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1588347818133-38c4106c7c2d?w=400',
    isActive: true
  },
  {
    name: 'Salmon Fillet',
    description: 'Fresh Atlantic salmon fillet, rich in omega-3 fatty acids.',
    category: FoodCategory.NON_VEG,
    price: 800, // ₹800 per kg
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
    isActive: true
  },
  {
    name: 'Chicken Thighs',
    description: 'Bone-in chicken thighs, juicy and flavorful. Great for roasting.',
    category: FoodCategory.NON_VEG,
    price: 280, // ₹280 per kg
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    isActive: true
  },
  {
    name: 'Shrimp - Large',
    description: 'Fresh large shrimp, peeled and deveined. Perfect for stir-fries and pasta.',
    category: FoodCategory.NON_VEG,
    price: 600, // ₹600 per kg
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400',
    isActive: true
  },
  {
    name: 'Pork Chops',
    description: 'Bone-in pork chops, tender and juicy. Great for grilling or pan-frying.',
    category: FoodCategory.NON_VEG,
    price: 400, // ₹400 per kg
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
    isActive: true
  },

  // Breads
  {
    name: 'Whole Wheat Bread',
    description: 'Fresh baked whole wheat bread, high in fiber and nutrients.',
    category: FoodCategory.BREADS,
    price: 45, // ₹45 per loaf
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    isActive: true
  },
  {
    name: 'Sourdough Bread',
    description: 'Artisan sourdough bread with a tangy flavor and chewy texture.',
    category: FoodCategory.BREADS,
    price: 80, // ₹80 per loaf
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
    isActive: true
  },
  {
    name: 'Dinner Rolls',
    description: 'Soft and fluffy dinner rolls, perfect for meals and sandwiches.',
    category: FoodCategory.BREADS,
    price: 35, // ₹35 per pack
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    isActive: true
  },
  {
    name: 'Bagels - Everything',
    description: 'Fresh everything bagels with sesame seeds, poppy seeds, and garlic.',
    category: FoodCategory.BREADS,
    price: 120, // ₹120 per pack
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    isActive: true
  },
  {
    name: 'Croissants',
    description: 'Buttery, flaky croissants perfect for breakfast or light meals.',
    category: FoodCategory.BREADS,
    price: 150, // ₹150 per pack
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=400',
    isActive: true
  },
  {
    name: 'Pita Bread',
    description: 'Soft pita bread, perfect for sandwiches, wraps, and Mediterranean dishes.',
    category: FoodCategory.BREADS,
    price: 60, // ₹60 per pack
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    isActive: true
  },

  // Ready-to-eat meals and popular dishes
  {
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh tomato sauce, mozzarella cheese, and basil leaves.',
    category: FoodCategory.NON_VEG,
    price: 450, // ₹450 per pizza
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    isActive: true
  },
  {
    name: 'Chicken Burger Deluxe',
    description: 'Juicy grilled chicken breast with lettuce, tomato, cheese, and special sauce in a brioche bun.',
    category: FoodCategory.NON_VEG,
    price: 320, // ₹320 per burger
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    isActive: true
  },
  {
    name: 'Chicken Ramen Bowl',
    description: 'Rich chicken broth with fresh ramen noodles, soft-boiled egg, and vegetables.',
    category: FoodCategory.NON_VEG,
    price: 380, // ₹380 per bowl
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    isActive: true
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan cheese, croutons, and classic Caesar dressing.',
    category: FoodCategory.VEGETABLE,
    price: 280, // ₹280 per bowl
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    isActive: true
  },
  {
    name: 'Beef Tacos (3 pieces)',
    description: 'Authentic street-style tacos with seasoned ground beef, onions, cilantro, and lime.',
    category: FoodCategory.NON_VEG,
    price: 350, // ₹350 per serving
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38174c4a6706?w=400',
    isActive: true
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten chocolate center, served with vanilla ice cream.',
    category: FoodCategory.BREADS,
    price: 220, // ₹220 per piece
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    isActive: true
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with eggs, cheese, pancetta, and black pepper.',
    category: FoodCategory.NON_VEG,
    price: 420, // ₹420 per plate
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
    isActive: true
  },
  {
    name: 'Vegetable Sushi Roll (8 pieces)',
    description: 'Fresh vegetable sushi with cucumber, avocado, and carrot, served with wasabi and ginger.',
    category: FoodCategory.VEGETABLE,
    price: 380, // ₹380 per roll
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    isActive: true
  },
  {
    name: 'BBQ Chicken Wings (6 pieces)',
    description: 'Crispy chicken wings glazed with smoky BBQ sauce, served with ranch dip.',
    category: FoodCategory.NON_VEG,
    price: 340, // ₹340 per serving
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
    isActive: true
  },
  {
    name: 'Mushroom Risotto',
    description: 'Creamy Italian rice dish with mixed mushrooms, parmesan cheese, and herbs.',
    category: FoodCategory.VEGETABLE,
    price: 390, // ₹390 per plate
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',
    isActive: true
  },
  {
    name: 'Fish and Chips',
    description: 'Beer-battered cod fillet with crispy fries, served with tartar sauce and mushy peas.',
    category: FoodCategory.NON_VEG,
    price: 480, // ₹480 per plate
    stock: 16,
    imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400',
    isActive: true
  },
  {
    name: 'Pad Thai',
    description: 'Traditional Thai stir-fried noodles with shrimp, tofu, bean sprouts, and peanuts.',
    category: FoodCategory.NON_VEG,
    price: 360, // ₹360 per plate
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400',
    isActive: true
  },

  // More Fruits
  {
    name: 'Mango - Alphonso',
    description: 'Premium Alphonso mangoes, sweet and aromatic. King of fruits.',
    category: FoodCategory.FRUIT,
    price: 300, // ₹300 per kg
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    isActive: true
  },
  {
    name: 'Watermelon',
    description: 'Fresh juicy watermelon, perfect for hot summer days. Hydrating and sweet.',
    category: FoodCategory.FRUIT,
    price: 30, // ₹30 per kg
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
    isActive: true
  },
  {
    name: 'Pomegranate',
    description: 'Fresh pomegranate with ruby red seeds, rich in antioxidants.',
    category: FoodCategory.FRUIT,
    price: 180, // ₹180 per kg
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    isActive: true
  },
  {
    name: 'Kiwi Fruit',
    description: 'Fresh kiwi fruit, tangy and sweet with high vitamin C content.',
    category: FoodCategory.FRUIT,
    price: 200, // ₹200 per kg
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400',
    isActive: true
  },
  {
    name: 'Dragon Fruit',
    description: 'Exotic dragon fruit with mild sweet flavor and striking appearance.',
    category: FoodCategory.FRUIT,
    price: 400, // ₹400 per kg
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400',
    isActive: true
  },

  // More Vegetables
  {
    name: 'Cauliflower',
    description: 'Fresh white cauliflower, versatile vegetable perfect for curries and roasting.',
    category: FoodCategory.VEGETABLE,
    price: 50, // ₹50 per kg
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1568584711271-61c4ac2b7d1e?w=400',
    isActive: true
  },
  {
    name: 'Eggplant (Brinjal)',
    description: 'Fresh purple eggplant, great for Indian curries and Mediterranean dishes.',
    category: FoodCategory.VEGETABLE,
    price: 45, // ₹45 per kg
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    isActive: true
  },
  {
    name: 'Green Beans',
    description: 'Fresh green beans, crisp and nutritious. Perfect for stir-fries.',
    category: FoodCategory.VEGETABLE,
    price: 60, // ₹60 per kg
    stock: 85,
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    isActive: true
  },
  {
    name: 'Sweet Potatoes',
    description: 'Orange sweet potatoes, naturally sweet and rich in vitamins.',
    category: FoodCategory.VEGETABLE,
    price: 55, // ₹55 per kg
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
    isActive: true
  },
  {
    name: 'Zucchini',
    description: 'Fresh green zucchini, mild flavor and great for healthy cooking.',
    category: FoodCategory.VEGETABLE,
    price: 80, // ₹80 per kg
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400',
    isActive: true
  },
  {
    name: 'Mushrooms - Button',
    description: 'Fresh button mushrooms, perfect for pizzas, pastas, and curries.',
    category: FoodCategory.VEGETABLE,
    price: 150, // ₹150 per kg
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    isActive: true
  },

  // More Non-Veg Items
  {
    name: 'Mutton - Goat Meat',
    description: 'Fresh goat meat, tender and flavorful. Perfect for traditional curries.',
    category: FoodCategory.NON_VEG,
    price: 650, // ₹650 per kg
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1588347818133-38c4106c7c2d?w=400',
    isActive: true
  },
  {
    name: 'Fish - Pomfret',
    description: 'Fresh pomfret fish, delicate flavor perfect for frying or curry.',
    category: FoodCategory.NON_VEG,
    price: 500, // ₹500 per kg
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    isActive: true
  },
  {
    name: 'Prawns - Medium',
    description: 'Fresh medium-sized prawns, sweet and succulent.',
    category: FoodCategory.NON_VEG,
    price: 550, // ₹550 per kg
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400',
    isActive: true
  },
  {
    name: 'Eggs - Farm Fresh',
    description: 'Farm fresh chicken eggs, high in protein and versatile.',
    category: FoodCategory.NON_VEG,
    price: 6, // ₹6 per piece
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
    isActive: true
  },
  {
    name: 'Turkey Breast',
    description: 'Lean turkey breast, healthy alternative to chicken.',
    category: FoodCategory.NON_VEG,
    price: 450, // ₹450 per kg
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400',
    isActive: true
  },

  // More Bread & Bakery Items
  {
    name: 'Naan Bread',
    description: 'Traditional Indian naan bread, soft and perfect with curries.',
    category: FoodCategory.BREADS,
    price: 25, // ₹25 per piece
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    isActive: true
  },
  {
    name: 'Garlic Bread',
    description: 'Buttery garlic bread with herbs, perfect appetizer or side dish.',
    category: FoodCategory.BREADS,
    price: 120, // ₹120 per serving
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400',
    isActive: true
  },
  {
    name: 'Focaccia Bread',
    description: 'Italian focaccia bread with olive oil and herbs.',
    category: FoodCategory.BREADS,
    price: 180, // ₹180 per loaf
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
    isActive: true
  },
  {
    name: 'Muffins - Blueberry',
    description: 'Fresh blueberry muffins, perfect for breakfast or snack.',
    category: FoodCategory.BREADS,
    price: 80, // ₹80 per piece
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400',
    isActive: true
  },
  {
    name: 'Donuts - Glazed',
    description: 'Classic glazed donuts, sweet and fluffy.',
    category: FoodCategory.BREADS,
    price: 60, // ₹60 per piece
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    isActive: true
  },

  // Ready-to-eat International Dishes
  {
    name: 'Chicken Tikka Masala',
    description: 'Creamy tomato-based curry with tender chicken tikka pieces.',
    category: FoodCategory.NON_VEG,
    price: 420, // ₹420 per plate
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    isActive: true
  },
  {
    name: 'Biryani - Chicken',
    description: 'Aromatic basmati rice with spiced chicken, traditional Indian dish.',
    category: FoodCategory.NON_VEG,
    price: 380, // ₹380 per plate
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400',
    isActive: true
  },
  {
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy cottage cheese curry, vegetarian favorite.',
    category: FoodCategory.VEGETABLE,
    price: 350, // ₹350 per plate
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    isActive: true
  },
  {
    name: 'Sushi Combo Platter',
    description: 'Assorted sushi rolls with salmon, tuna, and vegetables (12 pieces).',
    category: FoodCategory.NON_VEG,
    price: 650, // ₹650 per platter
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    isActive: true
  },
  {
    name: 'Greek Salad',
    description: 'Fresh Mediterranean salad with feta cheese, olives, and vegetables.',
    category: FoodCategory.VEGETABLE,
    price: 320, // ₹320 per bowl
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    isActive: true
  },
  {
    name: 'Lasagna - Meat',
    description: 'Layered pasta with meat sauce, cheese, and bechamel.',
    category: FoodCategory.NON_VEG,
    price: 480, // ₹480 per serving
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
    isActive: true
  },
  {
    name: 'Quesadilla - Chicken',
    description: 'Grilled tortilla with chicken, cheese, and peppers.',
    category: FoodCategory.NON_VEG,
    price: 280, // ₹280 per serving
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38174c4a6706?w=400',
    isActive: true
  },
  {
    name: 'Pho - Vietnamese Soup',
    description: 'Traditional Vietnamese noodle soup with beef and herbs.',
    category: FoodCategory.NON_VEG,
    price: 350, // ₹350 per bowl
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    isActive: true
  },
  {
    name: 'Falafel Wrap',
    description: 'Middle Eastern chickpea fritters in pita with tahini sauce.',
    category: FoodCategory.VEGETABLE,
    price: 250, // ₹250 per wrap
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    isActive: true
  },
  {
    name: 'Butter Chicken',
    description: 'Creamy tomato curry with tender chicken pieces, Indian classic.',
    category: FoodCategory.NON_VEG,
    price: 400, // ₹400 per plate
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    isActive: true
  },

  // Desserts & Sweets
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone.',
    category: FoodCategory.BREADS,
    price: 280, // ₹280 per slice
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    isActive: true
  },
  {
    name: 'Cheesecake - New York Style',
    description: 'Rich and creamy New York style cheesecake with berry topping.',
    category: FoodCategory.BREADS,
    price: 320, // ₹320 per slice
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
    isActive: true
  },
  {
    name: 'Gulab Jamun (2 pieces)',
    description: 'Traditional Indian sweet dumplings in sugar syrup.',
    category: FoodCategory.BREADS,
    price: 80, // ₹80 per serving
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    isActive: true
  },
  {
    name: 'Ice Cream - Vanilla',
    description: 'Premium vanilla ice cream, creamy and rich.',
    category: FoodCategory.BREADS,
    price: 150, // ₹150 per scoop
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    isActive: true
  },

  // Beverages & Drinks
  {
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice, no added sugar.',
    category: FoodCategory.FRUIT,
    price: 80, // ₹80 per glass
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400',
    isActive: true
  },
  {
    name: 'Mango Lassi',
    description: 'Traditional Indian yogurt drink with mango, refreshing and sweet.',
    category: FoodCategory.FRUIT,
    price: 100, // ₹100 per glass
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    isActive: true
  },
  {
    name: 'Green Smoothie',
    description: 'Healthy green smoothie with spinach, apple, and banana.',
    category: FoodCategory.VEGETABLE,
    price: 120, // ₹120 per glass
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    isActive: true
  },

  // Some items with low/zero stock to test availability features
  {
    name: 'Organic Blueberries',
    description: 'Fresh organic blueberries, packed with antioxidants and natural sweetness.',
    category: FoodCategory.FRUIT,
    price: 200, // ₹200 per 250g
    stock: 5, // Low stock
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400',
    isActive: true
  },
  {
    name: 'Avocados',
    description: 'Ripe avocados, creamy and nutritious. Perfect for guacamole and toast.',
    category: FoodCategory.FRUIT,
    price: 40, // ₹40 per piece
    stock: 0, // Out of stock
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
    isActive: true
  },
  {
    name: 'Lobster Tail',
    description: 'Fresh lobster tail, premium seafood for special occasions.',
    category: FoodCategory.NON_VEG,
    price: 1200, // ₹1200 per piece
    stock: 2, // Very low stock
    imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400',
    isActive: true
  }
];

async function seedInventory() {
  try {
    console.log('🌱 Starting inventory seeding...');

    // Connect to MongoDB
    await DatabaseConfig.connectMongoDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing food items (optional - comment out if you want to keep existing data)
    const existingCount = await FoodItem.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Found ${existingCount} existing food items`);
      const shouldClear = process.argv.includes('--clear');
      
      if (shouldClear) {
        await FoodItem.deleteMany({});
        console.log('🗑️  Cleared existing food items');
      } else {
        console.log('ℹ️  Skipping clear (use --clear flag to remove existing items)');
      }
    }

    // Insert sample data
    console.log(`📦 Inserting ${sampleFoodItems.length} food items...`);
    
    const insertedItems = await FoodItem.insertMany(sampleFoodItems);
    console.log(`✅ Successfully inserted ${insertedItems.length} food items`);

    // Display summary by category
    const categorySummary = await FoodItem.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Inventory Summary:');
    console.log('┌─────────────┬───────┬─────────────┬─────────────┐');
    console.log('│ Category    │ Items │ Total Stock │ Avg Price   │');
    console.log('├─────────────┼───────┼─────────────┼─────────────┤');
    
    categorySummary.forEach(cat => {
      const category = cat._id.padEnd(11);
      const count = String(cat.count).padStart(5);
      const stock = String(cat.totalStock).padStart(11);
      const price = `$${cat.avgPrice.toFixed(2)}`.padStart(11);
      console.log(`│ ${category} │ ${count} │ ${stock} │ ${price} │`);
    });
    
    console.log('└─────────────┴───────┴─────────────┴─────────────┘');

    // Display items with low stock
    const lowStockItems = await FoodItem.find({ 
      isActive: true, 
      stock: { $lte: 5 } 
    }).select('name stock');

    if (lowStockItems.length > 0) {
      console.log('\n⚠️  Low Stock Items:');
      lowStockItems.forEach(item => {
        const stockStatus = item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} remaining`;
        console.log(`   • ${item.name}: ${stockStatus}`);
      });
    }

    console.log('\n🎉 Inventory seeding completed successfully!');
    console.log('💡 You can now test the inventory API endpoints:');
    console.log('   • GET /api/inventory/items');
    console.log('   • GET /api/inventory/categories');
    console.log('   • GET /api/inventory/search?q=apple');

  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await DatabaseConfig.closeConnections();
    console.log('🔌 Database connections closed');
    process.exit(0);
  }
}

// Run the seeding script
if (require.main === module) {
  seedInventory();
}

export { seedInventory, sampleFoodItems };