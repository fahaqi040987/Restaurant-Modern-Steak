# Server Staff Guide
# Steak Kenangan POS System

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Target Users**: Waiters, Waitresses, Server Staff
**Training Time**: 45 minutes

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Table Management](#table-management)
4. [Taking Orders](#taking-orders)
5. [Order Management](#order-management)
6. [Serving Workflow](#serving-workflow)
7. [Handling Customer Requests](#handling-customer-requests)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

### Your Role as a Server

As a server at Steak Kenangan, you are the primary point of contact for dine-in customers. You are responsible for:

- ✅ Greeting and seating customers
- ✅ Taking accurate food and beverage orders
- ✅ Entering orders into the POS system
- ✅ Communicating special requests to the kitchen
- ✅ Serving food and drinks
- ✅ Checking on customer satisfaction
- ✅ Managing table status (available, occupied, cleaning)
- ✅ Directing customers to counter for payment

**⚠️ Note**: As a server, you **do not** process payments. Customers pay at the counter after their meal.

### What You Have Access To

With your Server role login, you can:
- ✅ View and manage tables
- ✅ Create dine-in orders
- ✅ View and edit your own orders
- ✅ Mark orders as served
- ✅ Update table status
- ❌ **Cannot**: Process payments, manage inventory, access admin functions

---

## Getting Started

### Logging In

1. **Access the System**:
   - On tablet: Open browser, go to https://steakkenangan.com
   - Or use dedicated Server Station tablet (pre-configured)

2. **Click "Login"** (top-right corner)

3. **Enter Your Credentials**:
   - Username: (e.g., `server1`, `jane.doe`)
   - Password: (provided by manager)

4. **Click "Masuk" (Login)**

**After Login**: You'll be redirected to the Server Dashboard at `/server`

### Server Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  Steak Kenangan  |  Tables  Orders  Profile  [Logout]    │
├──────────────────────────────────────────────────────────┤
│  Server Dashboard - Welcome, Jane! 👋                     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  📊 Quick Stats                                      │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │ │
│  │  │ My Orders    │ │ Pending      │ │ Ready       │ │ │
│  │  │    12        │ │    3         │ │    2        │ │ │
│  │  └──────────────┘ └──────────────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  🍽️ Table Status                                     │ │
│  │                                                      │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │ │
│  │  │ A01  │  │ A02  │  │ A03  │  │ A04  │  │ A05  │ │ │
│  │  │  🟢  │  │  🔴  │  │  🟢  │  │  🔴  │  │  🟢  │ │ │
│  │  │  4   │  │  2   │  │  4   │  │  6   │  │  4   │ │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘ │ │
│  │  Available Occupied Available Occupied Available   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  📋 My Active Orders                                 │ │
│  │  Table  Order ID       Items   Status      Action   │ │
│  │  A02    ORD-001        3       Preparing   [View]   │ │
│  │  A04    ORD-005        5       Ready       [Serve]  │ │
│  │  B01    ORD-007        2       Preparing   [View]   │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Key Sections**:
- **Quick Stats**: Your orders today, pending, ready to serve
- **Table Status**: Visual grid of all tables with status colors
- **My Active Orders**: Orders you've placed that are still in progress

---

## Table Management

### Understanding Table Status

| Status | Color | Meaning | Your Action |
|--------|-------|---------|-------------|
| **Available** | 🟢 Green | Empty, ready for seating | Seat customers here |
| **Occupied** | 🔴 Red | Customers are seated | Take/serve orders |
| **Reserved** | 🟡 Yellow | Reserved for specific time | Check reservation notes |
| **Cleaning** | 🔵 Blue | Being cleaned/reset | Wait, do not seat |

### Seating Customers

**Steps**:
1. **Greet Customers**: "Welcome to Steak Kenangan! How many guests?"
2. **Check Table Availability**: Look at Table Status section
   - Find green (Available) table matching group size
   - Example: 4 guests → Table A01 (capacity 4)
3. **Seat Customers**: Walk them to the table
4. **Mark Table as Occupied**:
   - On your tablet, go to **"Tables"** page
   - Find the table (e.g., A01)
   - Click **"Mark as Occupied"**
   - Table turns red
5. **Provide Menu**: Hand physical menu to customers
6. **Inform**: "I'll be back in a moment to take your order"

**Tips**:
- Seat larger groups away from entrance (less disturbance)
- Seat couples near windows (romantic ambiance)
- Balance table assignments among servers (fair distribution)

### Viewing Table Details

**To see full table information**:
1. Go to **"Tables"** page
2. Click on a table card (e.g., A01)
3. Details display:
   - Table number
   - Capacity (number of seats)
   - Current status
   - Order ID (if occupied)
   - Time occupied
   - QR code (for customer self-ordering, if used)

### Changing Table Status Manually

**Scenario**: Table needs cleaning after customers leave

**Steps**:
1. Go to **"Tables"** page
2. Find the table (e.g., A02)
3. Click on table card
4. Click **"Change Status"** dropdown
5. Select **"Cleaning"**
6. Table turns blue
7. **After cleaning done**:
   - Click **"Change Status"** → **"Available"**
   - Table turns green

**⚠️ Note**: Table status usually changes automatically when you create or complete orders. Manual changes are for exceptions (e.g., table spill, broken chair).

---

## Taking Orders

### Step 1: Approach the Table

**Timing**: Return after 2-3 minutes (give customers time to review menu)

**Greeting**:
- "Good afternoon! My name is Jane, and I'll be taking care of you today."
- "Are you ready to order, or do you need a few more minutes?"

**If NOT Ready**:
- "No problem! Take your time. I'll check back in a few minutes."

**If Ready**:
- Proceed to Step 2

### Step 2: Take the Order

**On Your Tablet**:
1. Click **"+ New Order"** button (green button, top-right)
2. Order creation screen opens

**Order Type Selection**:
- Select **"Dine-in"** (default for servers)
- **Table Number**: Select from dropdown (e.g., A01)
- Auto-fills if you clicked from table detail page

**Customer Information** (optional):
- Name: (if customer provides, e.g., "Mr. Budi")
- Phone: (for follow-up or reservations)
- Leave blank if customer prefers privacy

**Adding Items**:

**Method 1: Search** (faster):
1. Type product name in search bar (e.g., "Rendang")
2. Product card appears
3. Click on product card
4. Quantity selector appears
5. Use **+** button to increase quantity (default: 1)
6. Click **"Add to Order"**

**Method 2: Browse Menu**:
1. Browse by category:
   - Signature Wagyu
   - Appetizers
   - Main Courses
   - Desserts
   - Beverages
2. Click on product card
3. Add quantity and click "Add to Order"

**Example Conversation**:
```
Customer: "I'll have the Rendang Wagyu, please."
You: [Search "Rendang" → Click card → Add to Order]
     "Great choice! How would you like that cooked?"
Customer: "Medium, please."
You: [Click on item in cart → Select "Medium" → Save]
```

### Step 3: Special Instructions

**When Customer Has Special Requests**:
- "No onions, please"
- "Extra spicy"
- "Allergy to peanuts"

**How to Add Special Instructions**:
1. After adding item to order, click on the item in the cart
2. A popup opens with options:
   - **Doneness** (for steaks): Rare, Medium Rare, Medium, Medium Well, Well Done
   - **Special Instructions**: Text field
3. Enter instructions clearly
4. Click **"Save"**

**Example**:
```
Item: 1x Rendang Wagyu
Doneness: Medium
Special Instructions: No onions, less salt

Item: 1x Sate Wagyu
Special Instructions: ALLERGY: PEANUTS - Use coconut sauce
```

**⚠️ CRITICAL**: Always mark allergies clearly. Use "ALLERGY:" prefix in special instructions.

### Step 4: Review Order

**Before submitting**:
1. **Read back the order to the customer**:
   - "So that's one Rendang Wagyu medium, no onions..."
   - "One Sate Wagyu with coconut sauce..."
   - "And two Es Teler desserts. Is that correct?"
2. Customer confirms: "Yes, that's right."
3. **Check subtotal** (displayed at bottom of screen)
4. **Ask about beverages** (if not ordered):
   - "Would you like anything to drink with that?"

### Step 5: Submit Order

**Steps**:
1. Click **"Submit Order"** button (bottom-right)
2. Confirmation dialog: *"Order total: Rp 550.000. Submit?"*
3. Click **"Confirm"**
4. Order is sent to kitchen
5. **Order ID** displays (e.g., `ORD-20251226-012`)
6. Success message: "Order submitted successfully!"

**What Happens**:
- Kitchen receives order on Kitchen Display System
- Order appears in your "My Active Orders" list
- Table remains "Occupied"

**Inform Customer**:
- "Thank you! Your food will be ready in approximately 20-25 minutes."
- "I'll bring your drinks first."
- Return with beverages (if ordered) within 5 minutes

---

## Order Management

### Viewing Your Orders

**To see all your orders**:
1. Click **"Orders"** in the navigation menu
2. Your orders display in a table:
   - Order ID
   - Table Number
   - Items (count)
   - Status (Pending, Preparing, Ready, Served)
   - Total Amount
   - Order Time

**Filter Options**:
- **All Orders**: All your orders today
- **Active**: Pending, Preparing, Ready (not yet served/completed)
- **Completed**: Served and customer went to pay

### Viewing Order Details

**To see full order information**:
1. Find order in list
2. Click **"View"** button (eye icon) or click on order row
3. Order details display:
   - Customer name and table
   - Full item list with quantities and prices
   - Special instructions
   - Subtotal, tax (11% PPN), total
   - Order status
   - Status history (timeline):
     - Created, Sent to Kitchen, Preparing, Ready, Served

### Editing an Order

**When to Edit**:
- Customer changes their mind (before kitchen starts preparing)
- You made a mistake entering the order
- Customer wants to add more items

**Steps**:
1. Find order in your "Orders" list
2. Click **"Edit"** button (pencil icon)
3. Order editing screen opens
4. Make changes:
   - **Add Items**: Click "+ Add Item"
   - **Remove Items**: Click "X" next to item
   - **Change Quantity**: Use +/- buttons
   - **Update Instructions**: Click on item, edit instructions
5. Click **"Save Changes"**
6. Confirmation: "Order updated successfully"

**⚠️ Important**:
- You can only edit orders with status **"Pending"** or **"Preparing"**
- If order is **"Ready"** or **"Served"**, you cannot edit
- If kitchen already started cooking and customer wants to cancel, inform manager

### Checking Order Status

**Real-Time Status Updates**:
The order status updates automatically as kitchen progresses:

| Status | Color | Meaning | Your Action |
|--------|-------|---------|-------------|
| **Pending** | 🟡 Yellow | Awaiting kitchen | Wait, monitor time |
| **Preparing** | 🔵 Blue | Kitchen is cooking | Customer is waiting |
| **Ready** | 🟢 Green | Food is ready! | **Serve immediately** |
| **Served** | ✅ Green Check | You delivered food | Check on customer later |
| **Completed** | ✅ Gray | Customer paid | Clean table |

**How to Check**:
1. Go to **"Orders"** page or **Dashboard**
2. Look at **"My Active Orders"** section
3. Status displays next to each order
4. 🟢 Green "Ready" badge = **Food ready, go to kitchen now**

### Marking Order as Served

**When**: After you've delivered all items to the table

**Steps**:
1. Find order in "My Active Orders"
2. Click **"Mark as Served"** button
3. Confirmation: *"All items delivered to table?"*
4. Click **"Yes, Served"**
5. Order status changes to "Served"
6. Timer starts for table occupancy tracking

**What This Does**:
- Updates order status (for admin reports)
- Starts billing timer (table occupied time)
- Removes order from "Ready" list
- Keeps order in "Active" until payment complete

---

## Serving Workflow

### Step 1: Monitor Orders

**Throughout Your Shift**:
- Keep tablet nearby or check Dashboard every 5 minutes
- Look for orders with **"Ready"** status (🟢 green)
- Kitchen may also call out: "Order for Table A01 ready!"

### Step 2: Pick Up Food from Kitchen

**When Order is Ready**:
1. Go to kitchen pass (pickup area)
2. Verify order:
   - Check order ID matches (e.g., ORD-012)
   - Check table number (e.g., A01)
   - Count items (ensure all items are there)
3. Load onto tray:
   - Use tray for multiple plates
   - Ensure hot plates have warnings: "Hot plate, careful!"
4. Bring to table immediately (food should be hot)

**⚠️ Quality Check Before Serving**:
- ✅ Plates are clean (no spills on edges)
- ✅ Food looks appetizing (proper garnish)
- ✅ Hot food is hot (steam visible)
- ✅ Items match order (no mix-up)

### Step 3: Serve Food to Table

**Approaching the Table**:
- "Here's your Rendang Wagyu, medium doneness, and your Sate Wagyu. Enjoy!"
- Place items in front of correct customer (if you remember who ordered what)
- If unsure: "Who had the Rendang Wagyu?" → Place accordingly

**Presentation**:
- Place plates gently (not dropped)
- "Careful, the plate is hot!" (if applicable)
- Ensure customers have utensils and napkins
- Refill water if needed

**After Serving**:
- "Is there anything else I can get for you?"
- If customer requests something small (sauce, napkin): Handle immediately
- If customer wants to add to order: Take new order (add items to existing order)

**On Your Tablet**:
- Click **"Mark as Served"** button for the order
- Confirms delivery

### Step 4: Check Back

**Timing**: Return after 2-3 minutes (or when they've had a few bites)

**Check-In**:
- "How is everything? Is the food to your liking?"
- Listen to feedback:
  - If positive: "Wonderful! Enjoy your meal."
  - If negative: "I'm sorry to hear that. Let me get the manager for you."

**Handling Complaints**:
- Do NOT argue or make excuses
- Apologize: "I sincerely apologize for that."
- Fetch manager immediately: "Let me get my manager to assist you."
- Manager will handle complaint resolution (comp, remake, etc.)

### Step 5: Clear Plates

**When**: After customer finishes eating (empty plates)

**Ask First**:
- "Are you finished with this?" (gesture to plate)
- Wait for confirmation: "Yes, thank you."
- If customer says "I'm still working on it": Leave it, check back later

**Clearing**:
- Stack plates carefully (don't clatter)
- Remove from table
- Wipe table if needed (crumbs, spills)
- Ask: "Would you like to see the dessert menu?"

**If Customer Wants Dessert**:
- Take dessert order (same process as main order)
- Add items to existing order (or create new order if original is completed)

**If Customer is Done**:
- "Whenever you're ready, you can pay at the counter. Thank you!"

---

## Handling Customer Requests

### Adding Items to Existing Order

**Scenario**: Customer wants to order more food after initial order

**Steps**:
1. Go to **"Orders"** page
2. Find the customer's order (by table number)
3. Click **"Edit"** button
4. Click **"+ Add Item"**
5. Search and add new items
6. Click **"Save Changes"**
7. Kitchen receives updated order

**⚠️ Note**: Can only add items if order status is "Pending" or "Preparing". If "Ready" or "Served", create a new order.

### Cancelling an Item

**Scenario**: Customer changes mind before food is cooked

**Steps**:
1. Find order in "Orders" page
2. Click **"Edit"**
3. Click **"X"** next to item to remove
4. Confirm: *"Remove this item?"*
5. Click **"Yes, Remove"**
6. Click **"Save Changes"**
7. Order updates, kitchen notified

**⚠️ Important**:
- Can only cancel if status is "Pending" or early "Preparing"
- If kitchen already cooked, cannot cancel (item will be charged)
- If customer insists, involve manager

### Handling Special Dietary Requests

**Common Requests**:
- Vegetarian (no meat)
- Halal (our wagyu is halal-certified, assure customer)
- No pork (we don't serve pork, assure customer)
- Gluten-free (limited options, check with chef)
- Allergy to nuts, seafood, dairy, etc.

**Steps**:
1. **Listen carefully** to customer's restriction
2. **Recommend suitable menu items**:
   - Vegetarian: Salads, vegetable sides, certain appetizers
   - Allergies: Ask chef which dishes are safe
3. **Add special instructions** to order clearly:
   - Example: "ALLERGY: PEANUTS - No peanut sauce"
4. **Inform kitchen** personally (don't just rely on system):
   - Walk to kitchen, tell chef: "Table A01 has peanut allergy, Order ORD-012"
   - Chef will acknowledge
5. **Double-check before serving**:
   - Ask kitchen: "This is the nut-free plate for A01, correct?"
   - Confirm with customer: "This is prepared without peanuts as requested."

**⚠️ CRITICAL**: Never guess or assume. If unsure, ask chef or manager.

### Handling Bill Requests

**⚠️ Important**: Servers do NOT process payments. Direct customers to counter.

**Scenario**: Customer asks for the bill

**Your Response**:
- "Certainly! You can pay at the counter when you're ready."
- "The total for your table is Rp 550.000 (including 11% tax)."
- (Optional) "Would you like me to print a receipt to review first?"

**If Customer Wants to Review Bill**:
1. Go to **"Orders"** page on tablet
2. Find their order
3. Click **"View"** → Shows full breakdown
4. Click **"Print"** (if printer available) or show tablet screen
5. Customer reviews itemized bill

**If Customer Reports Incorrect Charge**:
- "Let me double-check that for you."
- Review order details
- If item is wrong: "I see the issue. Let me get my manager to adjust the bill."
- If item is correct: Politely explain: "This is the Rendang Wagyu you ordered, which is Rp 275.000."
- If customer insists: Get manager

**Directing to Counter**:
- "Please head to the counter when you're ready. They'll process your payment there."
- (Optional) Walk them to counter if restaurant is busy/confusing layout

### Handling Complaints

**Common Complaints**:
- Food is cold
- Wrong doneness (ordered medium, got well done)
- Food doesn't taste good
- Missing item from order
- Taking too long

**Your Response** (for all complaints):
1. **Listen** without interrupting
2. **Apologize sincerely**: "I'm very sorry about that."
3. **Do NOT make excuses** ("We're busy" is not an excuse)
4. **Offer solution**:
   - Cold food: "Let me take this back and get you a fresh hot plate."
   - Wrong doneness: "I'll have the chef remake this to medium for you right away."
   - Missing item: "I apologize, let me bring that out immediately."
   - Too long: "I understand. Let me check with the kitchen on the status."
5. **Involve manager** if:
   - Customer is very upset
   - Solution requires discount/comp
   - You're unsure how to resolve

**What NOT to Do**:
- ❌ Blame the kitchen or another staff member
- ❌ Argue with the customer
- ❌ Ignore the complaint
- ❌ Promise discounts (only manager can authorize)

---

## Best Practices

### Timing & Efficiency

**Table Service Timeline**:
1. **Greeting**: Within 1 minute of seating
2. **Take Order**: Within 5 minutes of seating
3. **Deliver Drinks**: Within 5 minutes of order
4. **Deliver Food**: When kitchen marks ready (typically 20-25 min)
5. **Check-In**: Within 3 minutes of serving food
6. **Clear Plates**: Within 2 minutes of customer finishing
7. **Offer Dessert**: Immediately after clearing
8. **Bill**: When customer requests

**Tips for Speed**:
- Carry tablet always (don't walk back to station for every order)
- Batch trips (bring drinks + napkins in one trip, not separate)
- Know menu well (quick recommendations without checking tablet)
- Communicate with kitchen (call out urgency for late orders)

### Customer Service

**Greeting Every Guest**:
- Make eye contact, smile
- Use polite language: "Selamat siang" (Good afternoon) or "Good afternoon"
- Be warm and welcoming (first impression matters)

**Anticipate Needs**:
- Refill water before customer asks
- Bring extra napkins for messy dishes (ribs, sate)
- Suggest pairings: "The Rendang Wagyu goes wonderfully with our Kopi Kenangan"

**Upselling** (Increase Sales):
- **Appetizers**: "Would you like to start with our Lumpia Wagyu?"
- **Sides**: "Would you like to add a side of Nasi Putih or French Fries?"
- **Desserts**: "We have a delicious Es Teler dessert, would you like to try?"
- **Beverages**: "Our signature Kopi Kenangan pairs perfectly with dessert."

**⚠️ Upselling Tip**: Suggest, don't push. If customer declines, accept gracefully.

### Table Management

**Turn Tables Quickly** (But Don't Rush Customers):
- Clear plates promptly
- Offer bill shortly after dessert/coffee
- As soon as customer leaves, mark table "Cleaning"
- Clean and reset within 5 minutes
- Mark table "Available" for next guests

**Peak Hours** (Lunch 12-2 PM, Dinner 6-9 PM):
- Work faster but maintain quality
- Communicate with team (help each other)
- Prioritize new orders (get them to kitchen ASAP)

### Communication

**With Kitchen**:
- Call out urgency: "Chef, Table A01 has been waiting 30 minutes, can we prioritize?"
- Confirm special instructions: "Table B02 has nut allergy, Order ORD-015"
- Thank them: "Thank you, Chef!" (positive teamwork)

**With Other Servers**:
- Help each other: "I'm going to the kitchen, need anything?"
- Cover sections: "Can you watch my tables while I take my break?"
- Communicate tables: "Table A01 is ready to pay"

**With Manager**:
- Report issues immediately: "Table B05 is unhappy with their steak"
- Ask questions: "I'm not sure how to handle this situation..."
- Update on status: "All my tables are served, can I help elsewhere?"

### Hygiene & Presentation

**Personal Hygiene**:
- Wash hands every hour (and after touching face, phone, etc.)
- Wear clean, pressed uniform
- Hair tied back neatly (if long)
- Minimal jewelry (no dangling earrings)
- Fresh breath (use mints, not gum)

**Professional Appearance**:
- Stand up straight (good posture)
- Smile naturally
- Speak clearly (not too loud, not mumbling)
- Make eye contact when talking to customers

**Table Hygiene**:
- Wipe tables between customers (disinfectant spray)
- Replace linens if stained
- Ensure clean utensils and glassware
- Check for crumbs on seats

---

## Troubleshooting

### Issue: Cannot Create Order

**Possible Causes**:
- Not logged in
- No table selected
- Internet connection issue

**Solutions**:
1. Check you're logged in (see username in top-right)
2. Select table number from dropdown (dine-in orders require table)
3. Check Wi-Fi connection (icon top-right)
4. Try clicking "+ New Order" again
5. If still not working, reload page (F5) and try again

---

### Issue: Order Not Appearing in Kitchen

**Possible Cause**:
- Order didn't submit properly

**Solution**:
1. Go to **"Orders"** page
2. Check if order exists in your list
3. If order exists:
   - Status should be "Pending" or "Preparing"
   - If so, kitchen received it (they may be busy)
   - If status is still "Draft", click "Submit" again
4. If order doesn't exist:
   - Order didn't save, create again
5. If unsure, ask kitchen: "Did you receive Order ORD-012 for Table A01?"

---

### Issue: Customer Says Item is Wrong

**Possible Causes**:
- You entered wrong item
- Kitchen made wrong item
- Customer misremembered order

**Solutions**:
1. **Check order on tablet**:
   - Go to "Orders" page
   - Find customer's order
   - Click "View" to see what was actually ordered
2. **If you entered wrong item**:
   - Apologize: "I'm very sorry, I entered the wrong item."
   - "Let me get you the correct dish right away."
   - Take wrong dish back, inform kitchen of mistake
   - Manager may comp the wrong item (their decision)
3. **If kitchen made wrong item**:
   - Apologize: "I'm sorry, the kitchen made an error."
   - Take dish back, inform kitchen to remake
4. **If customer misremembered**:
   - Politely clarify: "I have here that you ordered the Rendang Wagyu. Would you prefer to change to the Sate Wagyu instead?"
   - If yes, involve manager (may charge difference or comp)

---

### Issue: Order Taking Too Long

**Expected Times**:
- Appetizers: 10-15 minutes
- Main courses: 20-25 minutes
- Desserts: 5-8 minutes

**If Exceeding**:
1. Check order status on tablet:
   - If still "Pending": Kitchen hasn't started (very unusual)
   - If "Preparing": Kitchen is working on it
2. Go to kitchen, speak to chef:
   - "Chef, Table A01 order ORD-012, it's been 35 minutes. ETA?"
   - Chef will update: "5 more minutes" or "Just finishing now"
3. Return to table, update customer:
   - "I just checked with the kitchen, your food will be out in about 5 minutes. Thank you for your patience."
   - Offer complimentary drinks or appetizer (manager authorization)
4. If exceeds 40 minutes, involve manager

---

### Issue: Tablet is Slow or Frozen

**Solutions**:
1. **Close unused apps**: Swipe up (iOS) or tap recent apps button (Android), close apps
2. **Restart browser**:
   - Close browser app completely
   - Reopen browser
   - Navigate to https://steakkenangan.com
   - Log in again
3. **Restart tablet**:
   - Hold power button
   - Select "Restart"
   - Wait for reboot
   - Log in again
4. **Use backup tablet** (if available):
   - Ask manager for backup device
   - Log in and continue working
5. **Paper backup** (last resort):
   - Write orders on paper pad
   - Enter into system when tablet works again

---

### Issue: Customer Cannot Pay with Card

**⚠️ Important**: Payment issues are handled by counter staff, not servers.

**Your Action**:
- "Let me get the counter staff to assist you with payment."
- Walk to counter, inform counter staff: "Table A01 having card issue"
- Counter staff will handle (try card again, offer alternative payment)

---

## Quick Reference

### Daily Routine

**Start of Shift**:
1. Log in to tablet
2. Check table status (all clean and available?)
3. Review any reserved tables (check schedule)
4. Check uniform (clean, neat)
5. Review daily specials (ask manager or chef)

**During Shift**:
1. Greet and seat customers promptly
2. Take orders within 5 minutes
3. Monitor "My Active Orders" for "Ready" status
4. Serve food immediately when ready
5. Check on customers 2-3 minutes after serving
6. Clear plates when finished
7. Direct to counter for payment

**End of Shift**:
1. Complete all active orders (serve, clear)
2. Ensure all your tables are cleaned and set
3. Report any issues to manager
4. Log out of tablet
5. Hand off any in-progress tables to next shift server

### Common Actions Cheat Sheet

| Action | How To |
|--------|--------|
| **Create Order** | Click "+ New Order" → Select table → Add items → Submit |
| **Add Item to Order** | Find order → Edit → "+ Add Item" → Save |
| **Remove Item** | Find order → Edit → Click "X" next to item → Save |
| **Special Instructions** | Add item → Click on item in cart → Enter instructions → Save |
| **Mark as Served** | Find order in "My Active Orders" → Click "Mark as Served" |
| **View Order Details** | Go to "Orders" → Click order row or "View" button |
| **Change Table Status** | Go to "Tables" → Click table → "Change Status" dropdown |
| **Print Receipt** | View order → Click "Print" button |

### Emergency Contacts

**On-Site**:
- Manager: [Find in restaurant or use intercom]
- Counter Staff: [Counter station]
- Kitchen: [Chef or lead cook]

**Phone**:
- Restaurant Main: +62 21 5555 1234
- Manager Cell: +62 812 3456 7890

---

## Training Checklist

Complete during your first shift:

- [ ] Logged in to Server Dashboard successfully
- [ ] Viewed table status grid
- [ ] Marked a table as "Occupied" and "Available"
- [ ] Created a dine-in order with multiple items
- [ ] Added special instructions to an order item
- [ ] Submitted an order to kitchen
- [ ] Viewed order details
- [ ] Checked order status (Pending, Preparing, Ready)
- [ ] Marked an order as "Served"
- [ ] Edited an order (added/removed item)
- [ ] Practiced greeting customers professionally
- [ ] Cleared plates and cleaned a table
- [ ] Directed a customer to counter for payment
- [ ] Handled a customer request or question
- [ ] Communicated with kitchen staff
- [ ] Worked during a rush hour (if applicable)

**Trainer Signature**: _______________ **Date**: ___________

---

**END OF SERVER STAFF GUIDE**

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Document Owner**: Front-of-House Team, Steak Kenangan

**Questions?** Ask your Manager or Trainer, or email training@steakkenangan.com
