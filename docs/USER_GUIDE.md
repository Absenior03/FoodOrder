# User Guide - Food Ordering Platform

Welcome to the Food Ordering Platform! This guide will help you navigate and use all the features of our application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Browsing Food Items](#browsing-food-items)
4. [Shopping Cart](#shopping-cart)
5. [Placing Orders](#placing-orders)
6. [Order Management](#order-management)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Application

1. Open your web browser
2. Navigate to the application URL (e.g., `http://localhost:3000` for development)
3. You'll see the homepage with food categories and featured items

### System Requirements

- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **JavaScript enabled**
- **Internet connection** for real-time features
- **Mobile-friendly** - works on phones and tablets

## Account Management

### Creating an Account

1. Click the **"Sign Up"** button in the top navigation
2. Fill in the registration form:
   - **Email address** (must be unique)
   - **Password** (minimum 6 characters)
   - **First Name**
   - **Last Name**
   - **Phone Number** (optional)
3. Click **"Register"** to create your account
4. You'll be automatically logged in after successful registration

### Logging In

1. Click the **"Login"** button in the top navigation
2. Enter your **email** and **password**
3. Click **"Login"** to access your account
4. Your login session will persist across browser sessions

### Managing Your Profile

1. Click on your **profile icon** in the top navigation
2. Select **"Profile"** from the dropdown menu
3. Update your information:
   - Personal details (name, phone)
   - Delivery address
   - Password (if needed)
4. Click **"Save Changes"** to update your profile

### Logging Out

1. Click on your **profile icon** in the top navigation
2. Select **"Logout"** from the dropdown menu
3. You'll be redirected to the homepage

## Browsing Food Items

### Viewing All Items

- The homepage displays all available food items
- Items show **name**, **price**, and **availability status**
- **"Not Available"** items cannot be added to cart

### Filtering by Category

1. Use the **category filter** at the top of the page
2. Available categories:
   - **All** - Shows all items
   - **Fruits** - Fresh fruits and berries
   - **Vegetables** - Fresh vegetables and greens
   - **Non-veg** - Meat, poultry, and seafood
   - **Breads** - Breads, pastries, and baked goods
3. Click any category to filter items

### Searching for Items

1. Use the **search bar** at the top of the page
2. Type the name of the item you're looking for
3. Results update automatically as you type
4. Search works across item names and descriptions

### Sorting Items

Use the **sort dropdown** to organize items by:

- **Name** (A-Z or Z-A)
- **Price** (Low to High or High to Low)
- **Availability** (Available items first)

### Item Details

- **Hover** over an item card to see additional details
- **Click** on an item to view full description
- Check **stock availability** before adding to cart
- View **price per unit** clearly displayed

## Shopping Cart

### Adding Items to Cart

1. Find the item you want to purchase
2. Ensure the item shows as **"Available"**
3. Click the **"Add to Cart"** button
4. Choose quantity using the **quantity selector**
5. Confirm by clicking **"Add"**

### Viewing Your Cart

1. Click the **cart icon** in the top navigation
2. The cart sidebar will slide out showing:
   - All items in your cart
   - Quantities and prices
   - Total amount
   - Item count

### Managing Cart Items

**Updating Quantities:**

1. In the cart sidebar, use **+** and **-** buttons
2. Quantities update automatically
3. Total price recalculates instantly

**Removing Items:**

1. Click the **trash icon** next to any item
2. Confirm removal when prompted
3. Item is immediately removed from cart

**Clearing Cart:**

1. Click **"Clear Cart"** at the bottom of the cart
2. Confirm when prompted
3. All items are removed

### Cart Synchronization

- Your cart **syncs across devices** when logged in
- Add items on your phone, view on your computer
- Real-time updates when stock changes
- Cart persists until you complete checkout

## Placing Orders

### Starting Checkout

1. Ensure your cart has items
2. Click **"Checkout"** in the cart sidebar
3. You'll be taken to the checkout page

### Delivery Information

1. **Review your delivery address**:
   - Use address from your profile
   - Or enter a new delivery address
2. **Add special instructions** (optional):
   - Delivery preferences
   - Contact instructions
   - Dietary notes

### Order Review

1. **Review all items** in your order:
   - Item names and quantities
   - Individual prices
   - Total amount
2. **Check delivery details**
3. **Verify contact information**

### Payment Simulation

1. Select **payment method** (simulation only)
2. Enter **mock payment details**:
   - Card number: Use `4111111111111111` for testing
   - Expiry: Any future date
   - CVV: Any 3-digit number
3. Click **"Process Payment"**

### Order Confirmation

1. After successful payment simulation:
   - Receive **order confirmation**
   - Get unique **order tracking ID**
   - See **estimated delivery time**
2. **Order confirmation email** (simulated)
3. Cart is automatically cleared

## Order Management

### Viewing Order History

1. Click your **profile icon**
2. Select **"Order History"**
3. See all your previous orders with:
   - Order ID and date
   - Items and quantities
   - Total amount
   - Current status

### Tracking Orders

1. From order history, click **"View Details"** on any order
2. See detailed order information:
   - All items ordered
   - Delivery address
   - Payment status
   - Current order status

### Order Status Meanings

- **Pending** - Order received, awaiting confirmation
- **Confirmed** - Order confirmed, being prepared
- **Preparing** - Food is being prepared
- **Delivered** - Order has been delivered
- **Cancelled** - Order was cancelled

### Real-time Updates

- Order status updates automatically
- Receive notifications for status changes
- Estimated delivery times update in real-time
- No need to refresh the page

## Features and Tips

### Real-time Stock Updates

- **Stock levels update automatically** while browsing
- Items may become unavailable during your session
- You'll be notified if cart items become unavailable
- Stock validation happens during checkout

### Multi-device Support

- **Same account on multiple devices**
- Cart syncs across all your devices
- Order history available everywhere
- Seamless experience switching devices

### Responsive Design

- **Works on all screen sizes**
- Mobile-optimized interface
- Touch-friendly buttons and controls
- Swipe gestures on mobile devices

### Accessibility Features

- **Keyboard navigation** support
- Screen reader compatible
- High contrast mode available
- Large text options

### Performance Features

- **Fast loading** with optimized images
- **Offline support** for basic browsing
- **Automatic retry** for failed requests
- **Smooth animations** and transitions

## Troubleshooting

### Common Issues

**Can't Add Items to Cart:**

- Check if item is in stock
- Ensure you're logged in
- Try refreshing the page
- Clear browser cache if needed

**Cart Not Syncing:**

- Check internet connection
- Ensure you're logged in
- Try logging out and back in
- Contact support if issue persists

**Checkout Fails:**

- Verify all cart items are still available
- Check delivery address is complete
- Ensure payment details are correct
- Try again after a few minutes

**Page Won't Load:**

- Check internet connection
- Try refreshing the page
- Clear browser cache and cookies
- Try a different browser

**Login Issues:**

- Verify email and password are correct
- Check if Caps Lock is on
- Try password reset if needed
- Ensure account exists

### Browser Compatibility

**Supported Browsers:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Unsupported Features:**

- Internet Explorer (not supported)
- Very old browser versions
- Browsers with JavaScript disabled

### Performance Tips

**For Better Performance:**

- Use a modern browser
- Ensure stable internet connection
- Close unnecessary browser tabs
- Clear cache periodically
- Enable JavaScript

**Mobile Tips:**

- Use WiFi when possible
- Close other apps while ordering
- Ensure sufficient battery
- Use portrait mode for best experience

### Getting Help

**Self-Service Options:**

1. Check this user guide
2. Review FAQ section
3. Try troubleshooting steps above
4. Check system status page

**Contact Support:**

- Email: support@foodordering.com
- Phone: 1-800-FOOD-ORDER
- Live chat: Available 9 AM - 9 PM
- Help center: Available 24/7

**Reporting Issues:**
When contacting support, please include:

- Your account email
- Description of the issue
- Steps you tried
- Browser and device information
- Screenshots if helpful

## Privacy and Security

### Data Protection

- Your personal information is encrypted
- Payment details are not stored
- Order history is private to your account
- Data is not shared with third parties

### Account Security

- Use a strong, unique password
- Log out on shared devices
- Don't share your account credentials
- Report suspicious activity immediately

### Safe Ordering

- Verify delivery address before checkout
- Keep order confirmation for your records
- Report any delivery issues promptly
- Check items upon delivery

## Feedback and Suggestions

We value your feedback! Help us improve by:

- **Rating your experience** after each order
- **Suggesting new features** through the feedback form
- **Reporting bugs** or issues you encounter
- **Sharing the app** with friends and family

Thank you for using our Food Ordering Platform! We hope you enjoy your experience.
