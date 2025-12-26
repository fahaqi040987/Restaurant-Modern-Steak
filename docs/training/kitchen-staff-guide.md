# Kitchen Staff Guide
# Steak Kenangan POS System

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Target Users**: Kitchen Staff, Cooks, Chef de Partie
**Training Time**: 30 minutes

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Kitchen Display System](#kitchen-display-system)
4. [Order Workflow](#order-workflow)
5. [Managing Orders](#managing-orders)
6. [Special Instructions](#special-instructions)
7. [As-Ready Service](#as-ready-service)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is the Kitchen Display System (KDS)?

The Kitchen Display System is your digital order screen that replaces paper tickets. It shows:
- All incoming orders in real-time
- Order details (items, quantities, special instructions)
- Order priority (by time received)
- Table/customer information
- Order status (pending, preparing, ready)

### Your Role

As kitchen staff, you are responsible for:
- ✅ Monitoring incoming orders on KDS
- ✅ Preparing food according to order specifications
- ✅ Updating order status as you work
- ✅ Marking items ready for serving
- ✅ Following special customer instructions
- ✅ Maintaining food quality and speed

---

## Getting Started

### Logging In

1. **Open the Kitchen Display**:
   - Tablet/Monitor URL: https://steakkenangan.com/kitchen
   - Or navigate from main site: Click "Login" → Enter credentials → Redirects to Kitchen Display

2. **Enter Your Credentials**:
   - Username: (provided by manager, e.g., `kitchen1`, `chef.budi`)
   - Password: (provided during onboarding)

3. **Click "Masuk" (Login)**

**After Login**: You'll see the Kitchen Display System dashboard.

### Kitchen Display Layout

```
┌──────────────────────────────────────────────────────────────┐
│  🔔 Orders Pending: 5  |  ⏱️ Oldest: 8 min  |  🍽️ Ready: 2   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ ORD-001        │  │ ORD-002        │  │ ORD-003        ││
│  │ Table A01      │  │ Takeaway       │  │ Table B05      ││
│  │ 5 min ago      │  │ 3 min ago      │  │ 1 min ago      ││
│  │                │  │                │  │                ││
│  │ 1x Rendang Wgy │  │ 2x Sate Wagyu  │  │ 1x Rib Eye     ││
│  │ 1x Sate Wagyu  │  │ 1x Es Teler    │  │   🔥 WELL DONE ││
│  │   ⚠️ NO ONIONS │  │                │  │                ││
│  │                │  │                │  │                ││
│  │ [Start]        │  │ [Start]        │  │ [Start]        ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- **Top Bar**: Summary (pending count, oldest order time, ready orders)
- **Order Cards**: Each order is a separate card
- **Color Coding**:
  - 🟡 Yellow: New order (pending)
  - 🔵 Blue: In progress (preparing)
  - 🟢 Green: Ready to serve
- **Timer**: Shows how long ago the order was placed

---

## Kitchen Display System

### Order Card Details

Each order card shows:

**Header**:
- Order ID (e.g., `ORD-20251226-001`)
- Order Type Icon:
  - 🍽️ Dine-in (Table number shown)
  - 📦 Takeaway
  - 🚗 Delivery
- Time elapsed (e.g., `5 min ago`)

**Items List**:
- Quantity (e.g., `1x`, `2x`)
- Product Name (e.g., `Rendang Wagyu`, `Sate Wagyu`)
- Special instructions (in red/bold if present)

**Footer**:
- Action button: `[Start]`, `[Mark Ready]`, or `[Complete]`

**Example Order Card**:
```
┌────────────────────────────┐
│ ORD-20251226-012           │
│ 🍽️ Table A03   ⏱️ 7 min ago │
├────────────────────────────┤
│ 2x Rendang Wagyu           │
│    ⚠️ NO ONIONS             │
│ 1x Wagyu Gulai             │
│    ⚠️ EXTRA SPICY           │
│ 1x Sate Wagyu              │
│ 2x Nasi Putih              │
├────────────────────────────┤
│ Server: Jane (server1)     │
│ Notes: Birthday table      │
├────────────────────────────┤
│    [Start Preparing]       │
└────────────────────────────┘
```

### Order Priority

Orders are sorted by **time received** (oldest first, left to right).

**Priority Indicators**:
- 🟡 **0-5 minutes**: Normal (yellow border)
- 🟠 **5-10 minutes**: Attention (orange border)
- 🔴 **10+ minutes**: Urgent (red border, flashing)

**Rule**: Always work on the oldest orders first (leftmost cards).

### Sound Alerts

The Kitchen Display plays sounds for:
- 🔔 **New Order**: "Ding!" sound when new order arrives
- ⏰ **Order Aging**: Beep every 2 minutes for orders > 10 minutes old
- ✅ **Order Complete**: Chime when order marked ready

**To mute alerts**:
- Click the 🔇 icon in the top-right corner
- Click again to unmute

---

## Order Workflow

### Step 1: New Order Arrives

**What Happens**:
1. New order appears on the left side of the screen
2. 🔔 Sound alert plays
3. Order card is highlighted in yellow
4. Card shows "New" badge

**What You Do**:
1. Read the order items
2. Check for special instructions (⚠️ red text)
3. Click **"Start Preparing"** button

### Step 2: Preparing the Order

**What Happens**:
1. Order card turns blue
2. Status changes to "Preparing"
3. Timer continues running
4. Card moves to "In Progress" section

**What You Do**:
1. Gather ingredients
2. Cook items according to specifications:
   - Follow preparation time guidelines
   - Check doneness (e.g., 🔥 WELL DONE, 🥩 MEDIUM RARE)
   - Add special modifications (e.g., NO ONIONS)
3. Plate the dish
4. Verify all items in order are complete

**Tip**: You can cook multiple orders simultaneously. The system tracks each one independently.

### Step 3: Marking Items Ready

**When All Items are Complete**:
1. Click **"Mark Ready"** button on the order card
2. Confirmation dialog: *"All items ready?"*
3. Click **"Yes, Ready to Serve"**
4. Order card turns green
5. Order moves to "Ready" section
6. ✅ Chime sound plays

**What Happens Next**:
- Servers are notified (their tablets show "Ready" badge)
- Counter staff can see ready orders (for takeaway/delivery)
- Order awaits pickup

### Step 4: Order Served/Completed

**After Server/Counter Picks Up**:
- They mark order as "Served" or "Completed"
- Order card disappears from your Kitchen Display
- Your screen clears for new orders

---

## Managing Orders

### Starting an Order

**Steps**:
1. Find the oldest pending order (leftmost yellow card)
2. Click **"Start Preparing"** button
3. Order card turns blue and moves to "In Progress"
4. Timer continues running

**Visual Change**:
```
Before:                    After:
┌────────────────┐        ┌────────────────┐
│ ORD-001   🟡   │   →    │ ORD-001   🔵   │
│ [Start]        │        │ [Mark Ready]   │
└────────────────┘        └────────────────┘
```

### Marking Order Ready

**Steps**:
1. Verify all items are cooked and plated
2. Click **"Mark Ready"** button
3. Confirmation prompt appears
4. Click **"Yes, Ready"**
5. Order card turns green

**Visual Change**:
```
Before:                    After:
┌────────────────┐        ┌────────────────┐
│ ORD-001   🔵   │   →    │ ORD-001   🟢   │
│ [Mark Ready]   │        │ [Complete]     │
└────────────────┘        └────────────────┘
```

**Note**: "Complete" button is for servers/counter staff, not kitchen.

### Viewing Order Details

**To see full order information**:
1. Click anywhere on the order card (not on the button)
2. A detailed view opens showing:
   - Full item list with quantities
   - Special instructions for each item
   - Customer name
   - Server who placed the order
   - Order notes
3. Click "X" or "Close" to return to main display

### Filtering Orders

**Filter Buttons** (top of screen):
- **All Orders**: Show all statuses
- **Pending**: Show only new orders (yellow)
- **In Progress**: Show only preparing orders (blue)
- **Ready**: Show only completed orders (green)

**Use Case**:
*"I want to see only orders I'm currently working on"*
- Click **"In Progress"** filter
- Only blue cards display

### Refreshing the Display

**Auto-Refresh**: Display updates automatically every 10 seconds.

**Manual Refresh**:
- Click 🔄 icon (top-right corner)
- Or press F5 on keyboard

---

## Special Instructions

### Types of Special Instructions

Customers can request modifications. These appear in **red text** with ⚠️ icon.

**Common Instructions**:

**Doneness** (for steaks):
- 🔥 **WELL DONE**: Cook fully, no pink
- 🥩 **MEDIUM**: Pink center, warm
- 🩸 **RARE**: Red center, cool

**Modifications**:
- ⚠️ **NO ONIONS**: Exclude onions
- ⚠️ **NO GARLIC**: Exclude garlic
- ⚠️ **EXTRA SPICY**: Add more chili
- ⚠️ **LESS SALT**: Reduce salt

**Allergies** (⚠️ CRITICAL):
- 🚨 **ALLERGY: PEANUTS**: No peanuts or peanut oil
- 🚨 **ALLERGY: SEAFOOD**: No seafood ingredients
- 🚨 **ALLERGY: DAIRY**: No milk, cream, butter, cheese

**⚠️ IMPORTANT**: Always follow allergy instructions carefully. Customer health is at risk!

### How Special Instructions Display

**Example 1**:
```
┌────────────────────────────┐
│ 1x Rendang Wagyu           │
│    ⚠️ NO ONIONS             │
│    ⚠️ MEDIUM DONENESS       │
└────────────────────────────┘
```

**Example 2**:
```
┌────────────────────────────┐
│ 1x Sate Wagyu              │
│    🚨 ALLERGY: PEANUTS!     │
│    ⚠️ Use coconut sauce    │
└────────────────────────────┘
```

### Handling Special Instructions

**Step-by-Step**:
1. **Read Carefully**: Check all special instructions before starting
2. **Communicate**: If unclear, ask chef or manager
3. **Double-Check**: Before plating, verify modifications were made
4. **Separate Tools**: For allergies, use separate utensils and cookware

**If You Cannot Fulfill a Special Request**:
1. **Do NOT proceed** with cooking
2. **Notify Server or Manager** immediately
3. They will contact the customer to adjust the order
4. Wait for updated order before starting

**Example**:
*Customer requests "EXTRA SPICY" but we're out of chili*
- Don't cook without chili
- Tell server: "Out of chili, cannot make extra spicy"
- Server will ask customer if medium spicy is okay

---

## As-Ready Service

### What is As-Ready Service?

**Definition**: Items are served as soon as they're ready, not waiting for the entire order.

**Use Case**: A table orders appetizers and main courses. Serve appetizers first (as ready), then mains later.

**Example**:
```
Order:
- 1x Lumpia Wagyu (appetizer, 10 min prep)
- 1x Rendang Wagyu (main, 25 min prep)

As-Ready Flow:
1. Cook lumpia (10 min) → Mark ready → Server delivers
2. Continue cooking Rendang (15 more min) → Mark ready → Server delivers
```

### How to Handle As-Ready Orders

**In the KDS**:
1. Each item can be marked ready individually
2. Click **"Mark Item Ready"** next to specific item (not the whole order)
3. Item turns green, but order card stays blue
4. Server is notified to pick up ready items
5. Continue cooking remaining items
6. When all items ready, entire order turns green

**Example Display**:
```
┌────────────────────────────┐
│ ORD-012  Table A03  🔵     │
│                            │
│ ✅ 1x Lumpia Wagyu (READY) │
│ 🔵 1x Rendang Wagyu (PREP) │
│                            │
│ [Mark All Ready]           │
└────────────────────────────┘
```

### Benefits of As-Ready Service

- **Faster Service**: Customers get appetizers quickly
- **Better Experience**: Food arrives hot and fresh
- **Efficient Kitchen**: Cook at optimal pace, not rushed

**⚠️ Note**: Communicate with servers. They need to know which items are ready for pickup.

---

## Best Practices

### Speed & Efficiency

**Target Preparation Times**:
| Item Type | Target Time |
|-----------|-------------|
| Appetizers | 10-15 min |
| Soups | 10-12 min |
| Main Courses (Wagyu) | 20-25 min |
| Desserts | 5-8 min |
| Beverages | 2-3 min (counter) |

**Tips for Speed**:
1. **Prep in Advance**: Pre-cut vegetables, marinate meats
2. **Cook in Batches**: Group similar items (e.g., all satay together)
3. **Use Timers**: Set kitchen timers for each dish
4. **Communicate**: Call out when items go on the grill/stove
5. **Stay Organized**: Keep station clean, tools ready

### Quality Control

**Before Marking Ready**:
- ✅ Check doneness (use meat thermometer for steaks)
- ✅ Verify portion size (standard servings)
- ✅ Taste (if applicable)
- ✅ Check plating (presentation matches standards)
- ✅ Wipe plate edges (clean presentation)
- ✅ Garnish (herbs, microgreens as per recipe)

**Quality Checklist**:
- Meat cooked to requested doneness
- Vegetables not overcooked
- Sauce properly portioned
- Hot food is hot (>60°C)
- Cold food is cold (<5°C)
- No hair, foreign objects

### Communication

**With Other Kitchen Staff**:
- **"Ordering!"**: Announce new orders (e.g., "Ordering 2 Rendang, 1 Sate")
- **"Firing!"**: Announce when you start cooking (e.g., "Firing Table A03")
- **"Ready!"**: Announce when items are done (e.g., "Rendang Table A03 ready!")
- **"Behind!"**: When passing behind someone with hot items
- **"Sharp!"**: When carrying knives

**With Servers**:
- Notify when orders are ready (they may be busy elsewhere)
- Inform of any delays (e.g., "Table B05, add 5 minutes")
- Report 86'd items (out of stock): "86 Wagyu Gulai"

### Hygiene & Safety

**Personal Hygiene**:
- Wash hands every 30 minutes (and after touching face, phone, etc.)
- Wear clean uniform and apron
- Hair tied back, beard net if applicable
- No jewelry (except plain wedding band)
- Nails trimmed and clean

**Food Safety**:
- Separate raw and cooked foods
- Use color-coded cutting boards (red: meat, green: vegetables)
- Cook to safe internal temperatures:
  - Beef (medium): 63°C
  - Chicken: 74°C
  - Pork: 71°C
- Discard food left at room temp > 2 hours

**Kitchen Safety**:
- Keep floors dry (wipe spills immediately)
- Use oven mitts for hot items
- Keep knives sharp (safer than dull)
- Store chemicals away from food

---

## Troubleshooting

### Issue: New Orders Not Appearing

**Possible Causes**:
- Display not refreshing
- Network connection lost
- Filter hiding new orders

**Solutions**:
1. Click 🔄 **Refresh** button (top-right)
2. Press **F5** on keyboard to reload page
3. Check filter: Ensure **"All Orders"** is selected (not "Ready" or "In Progress")
4. Check Wi-Fi connection: Look for Wi-Fi icon (top-right)
5. If still not working, notify manager

---

### Issue: Order Stuck on "Preparing"

**Possible Cause**:
- You forgot to click "Mark Ready"

**Solution**:
1. Find the order card (should be blue)
2. Verify all items are cooked
3. Click **"Mark Ready"** button
4. Confirm when prompted

---

### Issue: Cannot Click "Mark Ready"

**Possible Causes**:
- Order already marked ready (green)
- Network issue
- Browser frozen

**Solutions**:
1. Check order card color:
   - If green: Already marked ready, no action needed
   - If blue: Should be clickable
2. Click 🔄 **Refresh** button
3. Reload page (F5)
4. Try clicking again
5. If still not working, ask manager to manually update order status

---

### Issue: Special Instructions Not Visible

**Possible Cause**:
- Instructions are in collapsed view

**Solution**:
1. **Click on the order card** (not the button)
2. Full order details open
3. Special instructions display prominently
4. Read carefully and proceed

---

### Issue: Kitchen Display Frozen/Blank

**Possible Causes**:
- Network disconnected
- Browser crash
- Server issue

**Solutions**:
1. Check Wi-Fi connection (icon top-right)
2. **Reload page**: Press F5 or Ctrl+R
3. **Close and reopen browser**:
   - Close all browser windows
   - Open new browser window
   - Go to: https://steakkenangan.com/kitchen
   - Log in again
4. **Restart tablet/computer**:
   - Save all work (if applicable)
   - Restart device
   - Log in again
5. If issue persists, notify manager

**Temporary Workaround**:
- Ask servers to call out orders verbally
- Write orders on paper until system is back

---

### Issue: Sound Alerts Not Working

**Possible Causes**:
- Alerts muted
- Device volume off
- Browser permissions

**Solutions**:
1. Check mute icon (🔇 top-right):
   - If visible, click to unmute (should change to 🔊)
2. Check device volume:
   - Increase volume (device buttons or settings)
3. Check browser permissions:
   - In browser, go to Settings > Site Permissions > Sound
   - Allow sound for steakkenangan.com
4. Reload page (F5)

---

### Issue: Too Many Orders on Screen

**Situation**: Rush hour, many orders pending

**Solutions**:
1. **Use Filters**:
   - Click **"In Progress"** to see only what you're cooking
   - Focus on oldest orders first
2. **Communicate with Team**:
   - Ask for help from other cooks
   - Delegate items (e.g., appetizers to one station, mains to another)
3. **Stay Calm**:
   - Work systematically (oldest first)
   - Don't rush (quality over speed)
4. **Notify Manager**:
   - If orders exceed 10+ pending for >15 minutes
   - Manager can adjust staffing or slow new orders

---

## Quick Reference

### Daily Routine

**Start of Shift**:
1. Log in to Kitchen Display
2. Check pending orders (if any from previous shift)
3. Review prep checklist (ingredients, sauces ready)
4. Verify equipment working (grill, stove, oven)
5. Read special instructions for first few orders

**During Shift**:
1. Monitor Kitchen Display continuously
2. Work on oldest orders first (leftmost)
3. Mark items ready as soon as done
4. Communicate with team
5. Keep station clean

**End of Shift**:
1. Complete all assigned orders
2. Hand off any in-progress orders to next shift
3. Clean station thoroughly
4. Log out of Kitchen Display
5. Report any issues to manager

### Common Actions Cheat Sheet

| Action | How To |
|--------|--------|
| **Start Order** | Click "Start Preparing" on yellow card |
| **Mark Ready** | Click "Mark Ready" on blue card, confirm |
| **View Details** | Click anywhere on card (not button) |
| **Refresh Display** | Click 🔄 icon or press F5 |
| **Filter Orders** | Click filter buttons (All, Pending, In Progress, Ready) |
| **Mute Alerts** | Click 🔇 icon (top-right) |
| **Unmute Alerts** | Click 🔊 icon (top-right) |

### Emergency Contacts

**On-Site**:
- Chef/Manager: Call on intercom or find in restaurant
- Server Station: Buzz/call to notify of issues

**Phone**:
- Restaurant Main Line: +62 21 5555 1234
- Manager Cell: +62 812 3456 7890
- IT Support: +62 821 1234 5678 (for system issues)

---

## Training Checklist

Complete this checklist during your first day:

- [ ] Successfully logged in to Kitchen Display
- [ ] Identified different order card colors (yellow, blue, green)
- [ ] Started an order (clicked "Start Preparing")
- [ ] Marked an order ready (clicked "Mark Ready")
- [ ] Viewed full order details (clicked on card)
- [ ] Used filters (Pending, In Progress, Ready)
- [ ] Recognized special instructions (⚠️ red text)
- [ ] Handled an allergy instruction (🚨 alert)
- [ ] Muted and unmuted sound alerts
- [ ] Refreshed the display manually
- [ ] Cooked an order with correct doneness (MEDIUM, WELL DONE)
- [ ] Communicated with server about ready order
- [ ] Cleaned station at end of shift
- [ ] Logged out of Kitchen Display

**Trainer Signature**: _______________ **Date**: ___________

---

## Notes Section

Use this space for personal notes during training:

```
_________________________________________________________

_________________________________________________________

_________________________________________________________

_________________________________________________________

_________________________________________________________

_________________________________________________________

_________________________________________________________
```

---

**END OF KITCHEN STAFF GUIDE**

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Document Owner**: Kitchen Department, Steak Kenangan

**Questions?** Ask your Chef or Manager, or email training@steakkenangan.com
