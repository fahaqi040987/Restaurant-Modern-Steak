# Counter Staff Guide
# Steak Kenangan POS System

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Target Users**: Cashiers, Counter Staff, Front Desk
**Training Time**: 45 minutes

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Taking Takeaway Orders](#taking-takeaway-orders)
4. [Taking Delivery Orders](#taking-delivery-orders)
5. [Processing Payments](#processing-payments)
6. [Order Fulfillment](#order-fulfillment)
7. [Handling Dine-in Payments](#handling-dine-in-payments)
8. [Cash Management](#cash-management)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### Your Role as Counter Staff

As counter staff at Steak Kenangan, you are the first and last point of contact for customers. You are responsible for:

- ✅ Greeting walk-in customers
- ✅ Taking takeaway orders
- ✅ Taking delivery orders (phone or in-person)
- ✅ Processing all payments (dine-in, takeaway, delivery)
- ✅ Handling cash, card, and e-wallet payments
- ✅ Issuing receipts
- ✅ Managing customer pickup (when orders ready)
- ✅ Handling payment issues and refunds
- ✅ Maintaining cash drawer accuracy

**⚠️ Important**: Counter staff have the MOST access in the system:
- ✅ Can create ALL order types (dine-in, takeaway, delivery)
- ✅ Can process payments
- ✅ Can issue refunds (manager approval)
- ❌ **Cannot**: Manage inventory, create users, access admin reports

---

## Getting Started

### Logging In

1. **Access the Counter Station**:
   - On counter terminal: Browser should auto-open to https://steakkenangan.com
   - Or manually navigate to site

2. **Click "Login"** (top-right corner)

3. **Enter Your Credentials**:
   - Username: (e.g., `counter1`, `cashier1`)
   - Password: (provided by manager)

4. **Click "Masuk" (Login)**

**After Login**: You'll be redirected to the Counter Dashboard at `/counter`

### Counter Dashboard Layout

```
┌───────────────────────────────────────────────────────────┐
│  Steak Kenangan  |  Orders  Payment  Profile  [Logout]    │
├───────────────────────────────────────────────────────────┤
│  Counter Dashboard - Welcome, Sarah! 💳                    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  📊 Today's Summary                                   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ │ │
│  │  │ Orders      │ │ Revenue     │ │ Pending        │ │ │
│  │  │    45       │ │ Rp 12.5M    │ │    8           │ │ │
│  │  └─────────────┘ └─────────────┘ └────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  🍱 Ready for Pickup (Takeaway/Delivery)             │ │
│  │                                                       │ │
│  │  ORD-012  Mr. Budi     2x Rendang  Ready  [Pickup]  │ │
│  │  ORD-015  Ms. Jane     1x Sate     Ready  [Pickup]  │ │
│  │  ORD-018  Mr. Ahmad    3x Wagyu    Ready  [Pickup]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  💳 Awaiting Payment (Dine-in)                       │ │
│  │                                                       │ │
│  │  Table A01  ORD-003  Rp 550.000  Served  [Pay Now]  │ │
│  │  Table B05  ORD-008  Rp 725.000  Served  [Pay Now]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [+ New Takeaway]  [+ New Delivery]  [Open Cash Drawer]  │
└───────────────────────────────────────────────────────────┘
```

**Key Sections**:
- **Today's Summary**: Orders processed, revenue collected, pending orders
- **Ready for Pickup**: Takeaway/delivery orders ready for customer pickup
- **Awaiting Payment**: Dine-in customers ready to pay at counter
- **Quick Action Buttons**: Create new orders, manage cash drawer

---

## Taking Takeaway Orders

### Scenario: Customer Walks In for Takeaway

**Greeting**:
- "Welcome to Steak Kenangan! Will this be for dine-in or takeaway?"
- Customer: "Takeaway, please."
- "Great! What would you like to order today?"

### Step 1: Create Takeaway Order

**On Your Terminal**:
1. Click **"+ New Takeaway"** button (green button)
2. Order creation screen opens
3. **Order Type**: Pre-selected as "Takeaway"

**Customer Information**:
- Name *required*: "What name should I put for this order?"
  - Customer provides name (e.g., "Budi")
- Phone Number *optional but recommended*: "May I have your phone number in case we need to reach you?"
  - Format: 08xx-xxxx-xxxx or +62 8xx-xxxx-xxxx
- Email *optional*: (Usually skip for takeaway)

### Step 2: Add Items to Order

**Method 1: Search** (faster):
1. Type product name in search bar
2. Click product card
3. Adjust quantity with +/- buttons
4. Click **"Add to Order"**

**Method 2: Browse Categories**:
1. Click category tabs:
   - Signature Wagyu
   - Appetizers
   - Main Courses
   - Desserts
   - Beverages
2. Click product card
3. Add quantity and click "Add to Order"

**Example Conversation**:
```
You: "What would you like?"
Customer: "Two Rendang Wagyu, both medium, and one Sate Wagyu."
You: [Search "Rendang" → Click → Quantity: 2 → Add]
     [Search "Sate" → Click → Add]
     "Would you like any sides or drinks with that?"
Customer: "Yes, two Nasi Putih and two Teh Botol."
You: [Add items]
```

### Step 3: Special Instructions

**If Customer Has Requests**:
- "Any special instructions? Allergies, doneness preference?"
- Customer: "One Rendang medium, one well done. No onions on the well done."

**How to Add**:
1. Click on item in cart (right side of screen)
2. Popup opens
3. Select **Doneness**: Medium, Well Done, etc.
4. Enter **Special Instructions**: "No onions"
5. Click **"Save"**
6. Repeat for other items if needed

**⚠️ CRITICAL**: Always mark allergies clearly with "ALLERGY:" prefix.

### Step 4: Review and Submit Order

**Read Back to Customer**:
- "So that's two Rendang Wagyu - one medium, one well done with no onions - and one Sate Wagyu. Correct?"
- Customer confirms: "Yes, that's right."

**Display Subtotal**:
- Total displays at bottom: "Your total is Rp 825.000 including tax."

**Estimated Prep Time**:
- System calculates based on items (usually 20-25 minutes for mains)
- "Your order will be ready in approximately 25 minutes."

**Payment Options**:
- "Would you like to pay now or when you pick up?"

**Option A: Pay Now**:
1. Customer pays immediately
2. Continue to **Step 5: Process Payment**
3. After payment, click **"Submit Order"**
4. Give receipt: "Here's your receipt. Your order will be ready in 25 minutes."

**Option B: Pay Later**:
1. Click **"Submit Order"** (without payment)
2. Order goes to kitchen
3. Give order ID: "Your order number is ORD-012. Please return in 25 minutes to pay and pick up."
4. Customer leaves, returns later for payment/pickup

### Step 5: Process Payment (If Paying Now)

See **[Processing Payments](#processing-payments)** section below for detailed steps.

### Step 6: Customer Pickup

**When Customer Returns**:
1. Check **"Ready for Pickup"** section on dashboard
2. Find order by name or order ID
3. Verify order is ready (status: "Ready" with 🟢 green badge)
4. If not yet ready:
   - "Your order is still being prepared. It'll be ready in about 5 more minutes. You're welcome to wait here."
5. If ready:
   - "Your order is ready! Let me get that for you."
   - Go to kitchen/pickup area
   - Verify order ID on bag (e.g., "ORD-012 - Budi")
   - Bring to counter
   - "Here's your order. Please check that everything is correct."
   - Customer checks bag
6. If customer paid earlier:
   - "You're all set! Enjoy your meal!"
   - Click **"Mark as Picked Up"** button
7. If customer paying now:
   - Process payment (see next section)
   - After payment, click **"Mark as Picked Up"**

---

## Taking Delivery Orders

### Scenario: Customer Calls or Orders Delivery

**Greeting** (Phone):
- "Thank you for calling Steak Kenangan! How may I help you?"
- Customer: "I'd like to place a delivery order."
- "Certainly! May I have your name and delivery address please?"

**Greeting** (In-person at counter):
- "Welcome! Will this be for dine-in, takeaway, or delivery?"
- Customer: "Delivery, please."

### Step 1: Create Delivery Order

**On Your Terminal**:
1. Click **"+ New Delivery"** button
2. Order creation screen opens
3. **Order Type**: Pre-selected as "Delivery"

**Customer Information** (ALL required for delivery):
- Name *required*: "What's your name?"
- Phone Number *required*: "Phone number?"
  - Format: 08xx-xxxx-xxxx
- Delivery Address *required*: "What's the delivery address?"
  - Customer provides full address: "Jl. Sudirman No. 45, Apartment Tower B, Unit 1203, Jakarta Selatan"
  - Enter exactly as customer says
- Notes *optional*: "Any additional delivery notes?"
  - Examples: "Ring buzzer #1203", "Leave at front desk", "Call when arrived"

**Delivery Zone Check**:
- System may show delivery zone indicator:
  - ✅ Green: Within delivery area
  - ⚠️ Yellow: Far, extra charge applies
  - ❌ Red: Outside delivery area

**If Outside Delivery Area**:
- "I'm sorry, but we don't currently deliver to that area. Would you like to place a takeaway order for pickup instead?"

### Step 2: Add Items (Same as Takeaway)

Follow same process as takeaway:
1. Search or browse products
2. Add to cart
3. Add special instructions if needed

### Step 3: Review Order and Confirm Delivery

**Read Back**:
- "So that's two Rendang Wagyu and one Sate Wagyu for delivery to [address]. Is that correct?"
- Customer confirms

**Delivery Fee**:
- System calculates delivery fee based on distance
- Example: "Your subtotal is Rp 825.000, delivery fee is Rp 25.000, total is Rp 850.000 including tax."

**Estimated Delivery Time**:
- Prep time + delivery time
- "Your order will be delivered in approximately 45-60 minutes."

### Step 4: Payment for Delivery

**Payment Options**:
- "How would you like to pay? Cash on delivery, card, or e-wallet transfer?"

**Option A: Cash on Delivery (COD)**:
1. Select payment method: **"Cash"**
2. Enter amount: Total (e.g., Rp 850.000)
3. Click **"Submit Order"** (payment pending)
4. Order goes to kitchen
5. Driver will collect cash upon delivery

**Option B: Pay Now (Card/E-Wallet)**:
1. Process payment immediately (see Payment section)
2. After payment confirmed, click **"Submit Order"**
3. Driver delivers, no payment needed at door

**Confirm with Customer**:
- "Your order number is ORD-018. We'll call you when the driver is on the way. Expect delivery in about 45-60 minutes. Thank you!"

### Step 5: Dispatch to Driver

**⚠️ Note**: If your restaurant uses delivery drivers:
1. After kitchen marks order ready, notify driver
2. Hand package to driver with:
   - Order ID
   - Customer name and phone
   - Delivery address
   - Amount to collect (if COD)
3. Click **"Out for Delivery"** button (updates status)

**If using 3rd-party delivery** (Grab, Gojek):
- After order ready, call delivery service
- Provide pickup address and customer details
- Give order to courier when they arrive

---

## Processing Payments

### Payment Methods Available

Steak Kenangan accepts:
- 💵 **Cash** (Indonesian Rupiah)
- 💳 **Card** (Credit/Debit - Visa, Mastercard, AMEX)
- 📱 **E-Wallet** (GoPay, OVO, Dana, ShopeePay)
- 🏦 **Bank Transfer** (BCA, Mandiri, BNI, BRI)

### Payment Workflow Overview

```
1. Customer wants to pay
   ↓
2. Find order in system (by Order ID or Table)
   ↓
3. Verify order total
   ↓
4. Ask payment method
   ↓
5. Process payment (different steps per method)
   ↓
6. Print receipt
   ↓
7. Thank customer, mark order complete
```

---

### Method 1: Cash Payment

**Steps**:
1. **Find Order**:
   - For dine-in: Check "Awaiting Payment" section, find by table
   - For takeaway/delivery: Search by order ID or customer name
2. Click **"Pay Now"** button
3. Payment screen opens showing total (e.g., Rp 550.000)

4. **Select Payment Method**: Click **"Cash"**

5. **Enter Amount Received**:
   - Customer hands cash: "Here's Rp 600.000"
   - You enter: `600000` in "Amount Received" field

6. **System Calculates Change**:
   - Display shows: "Change: Rp 50.000"
   - Verify math is correct

7. **Count Change**:
   - Prepare exact change from cash drawer
   - Count out loud: "Rp 550.000 makes 600.000. Here's your change: 50.000."
   - Hand change to customer

8. **Confirm Payment**:
   - Click **"Process Payment"** button
   - Confirmation: "Payment successful!"

9. **Print Receipt**:
   - Receipt prints automatically OR click **"Print Receipt"** button
   - Hand receipt to customer: "Here's your receipt. Thank you!"

10. **Complete Order**:
    - Click **"Mark as Completed"**
    - Order moves to completed list

**Cash Handling Tips**:
- Count cash twice (when received, when giving change)
- Place customer's cash on top of register while making change (so customer can verify amount)
- Only after change given, place customer's cash in drawer

---

### Method 2: Card Payment (Credit/Debit)

**Steps**:
1. **Find Order** and click **"Pay Now"**
2. **Select Payment Method**: Click **"Card"**
3. Display shows total amount
4. **Prepare Card Reader**:
   - EDC machine (Electronic Data Capture)
   - Wake up screen if sleeping
5. **Enter Amount on EDC**:
   - Type total amount (e.g., 550000)
   - Confirm amount
6. **Customer Inserts/Taps Card**:
   - For chip card: Customer inserts and leaves in during transaction
   - For contactless: Customer taps card on reader
   - For magnetic stripe (rare): Swipe card
7. **Customer Enters PIN** (if required):
   - EDC prompts for PIN
   - Customer enters 6-digit PIN
   - Do NOT look at PIN (privacy)
8. **Wait for Approval**:
   - EDC processes (5-15 seconds)
   - Display shows: "Approved" or "Declined"
9. **If Approved**:
   - EDC prints merchant copy and customer copy
   - Hand customer copy to customer
   - In POS system, click **"Payment Confirmed"**
   - Click **"Process Payment"**
   - Confirmation: "Payment successful!"
10. **Print POS Receipt**:
    - Click **"Print Receipt"**
    - Hand to customer: "Here's your receipt. Thank you!"
11. **Complete Order**: Click **"Mark as Completed"**

**If Declined**:
- EDC shows: "Declined" or "Insufficient Funds" or "Contact Bank"
- "I'm sorry, your card was declined. Would you like to try a different card or payment method?"
- Options:
  - Customer tries different card (repeat process)
  - Customer pays cash
  - Customer pays via e-wallet

---

### Method 3: E-Wallet Payment (GoPay, OVO, Dana)

**Steps**:
1. **Find Order** and click **"Pay Now"**
2. **Select Payment Method**: Click **"E-Wallet"**
3. **Select E-Wallet Type**:
   - GoPay
   - OVO
   - Dana
   - ShopeePay
4. Display shows total amount and **QR Code**
5. **Customer Scans QR Code**:
   - Customer opens their e-wallet app (e.g., GoPay)
   - Customer taps "Scan" or "Pay"
   - Customer scans QR code on your screen
6. **Customer Confirms Payment** (in their app):
   - App shows: "Pay Rp 550.000 to Steak Kenangan?"
   - Customer taps "Pay"
   - App may ask for PIN/fingerprint (security)
7. **Wait for Confirmation**:
   - POS system listens for payment notification
   - When received, display changes to: "Payment Received!"
   - ✅ Green checkmark appears
8. **If Payment Successful**:
   - Click **"Process Payment"**
   - Confirmation: "Payment successful!"
9. **Print Receipt**:
   - Click **"Print Receipt"**
   - Hand to customer
10. **Complete Order**: Click **"Mark as Completed"**

**If Payment Times Out** (after 5 minutes):
- QR code expires
- "It looks like the payment timed out. Let me generate a new QR code."
- Click **"Generate New QR"** button
- New QR code displays
- Customer scans new code

**If Customer Says They Paid But System Shows Nothing**:
1. Wait 30 seconds (sometimes delayed)
2. Click **"Refresh"** button
3. If still not received:
   - "Let me verify with the system. Could you show me the payment confirmation in your app?"
   - Customer shows app: "Payment Successful - Rp 550.000 to Steak Kenangan"
4. If customer has proof:
   - Note transaction ID from their app
   - Manually confirm payment: Click **"Manual Confirmation"**
   - Enter transaction ID
   - Manager approval may be required
5. If no proof and system shows nothing:
   - Customer may not have actually paid (they selected merchant but didn't confirm)
   - "It appears the payment wasn't completed. Could you try again?"

---

### Method 4: Bank Transfer (Less Common)

**Used for**:
- Large orders
- Corporate orders
- Pre-payment

**Steps**:
1. **Customer Requests Bank Transfer**:
   - "I'd like to pay via bank transfer."
2. **In POS System**:
   - Select payment method: **"Bank Transfer"**
   - System displays restaurant bank account details:
     - Bank: BCA
     - Account Number: 123-456-7890
     - Account Name: PT Steak Kenangan Indonesia
3. **Provide Details to Customer**:
   - Write on paper or show screen
   - "Please transfer Rp 550.000 to this account. The payment reference is your order ID: ORD-012."
4. **Customer Makes Transfer** (via mobile banking or ATM)
5. **Verify Transfer**:
   - Customer shows proof: Bank app screenshot or ATM receipt
   - Verify:
     - Amount matches
     - Account name matches
     - Transaction completed (not pending)
6. **Confirm Payment in POS**:
   - Click **"Payment Confirmed"**
   - Enter transaction reference number (from proof)
   - Click **"Process Payment"**
7. **Print Receipt**
8. **Complete Order**

**⚠️ Note**: For bank transfers, order may be held until transfer is verified (can take 5-15 minutes for real-time transfers, up to 24 hours for inter-bank).

---

## Order Fulfillment

### Monitoring Order Status

**On Your Dashboard**:
- Orders display in different sections based on status:
  - **Pending**: Kitchen hasn't started yet
  - **Preparing**: Kitchen is cooking
  - **Ready**: Food is done, awaiting pickup
  - **Served** (dine-in): Food delivered to table, awaiting payment
  - **Completed**: Paid and closed

**Your Focus**:
- **"Ready for Pickup"** section (takeaway/delivery)
- **"Awaiting Payment"** section (dine-in)

### Handling Customer Pickup

**Scenario**: Customer returns to pick up takeaway order

**Steps**:
1. **Greet**: "Welcome back! What's your order number or name?"
2. Customer: "Order ORD-012 under Budi" or "Budi"
3. **Find Order**:
   - Check "Ready for Pickup" section
   - Search by order ID or name
4. **Verify Status**:
   - If status is "Ready" (🟢): Food is ready
   - If status is "Preparing" (🔵): Food not yet ready
5. **If Ready**:
   - "Your order is ready! Let me get that for you."
   - Go to kitchen/pickup area
   - Verify order ID on bag/package
   - Bring to counter
   - "Here's your order. Please check to make sure everything is correct."
   - Customer opens bag (optional) and confirms
6. **Payment** (if not paid earlier):
   - "Your total is Rp 825.000. How would you like to pay?"
   - Process payment (see Payment section above)
7. **After Payment**:
   - Hand receipt
   - "Thank you for choosing Steak Kenangan! Enjoy your meal!"
   - Click **"Mark as Completed"**

**If Order Not Ready**:
- "Your order is still being prepared. It should be ready in about 5 more minutes. You're welcome to wait here or we can call you when it's ready."
- Customer choice:
  - Wait: Customer waits at counter or seating area
  - Come Back: Get customer's phone number, call when ready

**If Order Not Found**:
- "Let me look that up for you."
- Search in "All Orders" (not just "Ready")
- Possible reasons:
  - Order was placed under different name (ask for phone number)
  - Order ID was misheard (clarify)
  - Order doesn't exist (customer at wrong restaurant?)
- If truly not found:
  - "I don't see an order under that name. Do you have your order receipt or confirmation?"
  - Customer shows receipt
  - If valid: Investigate (check with manager)
  - If no proof: "I apologize, but I don't have a record of that order. Would you like to place a new order?"

---

## Handling Dine-in Payments

### Scenario: Dine-in Customer Comes to Pay

**Greeting**:
- "Hello! Welcome to the counter. Are you ready to pay?"
- Customer: "Yes, Table A01 please."

**Steps**:
1. **Find Order by Table**:
   - Look at "Awaiting Payment" section on dashboard
   - Find Table A01
   - Order displays with Order ID (e.g., ORD-003) and total
2. **Click "Pay Now"** button
3. **Review Order with Customer** (optional but good practice):
   - "Let me just review your order..."
   - Show screen or read aloud: "Two Rendang Wagyu, one Sate Wagyu, two Nasi Putih, two drinks..."
   - "Your total is Rp 550.000 including 11% tax. Is that correct?"
   - Customer confirms
4. **If Customer Questions Charge**:
   - Click "View Details" to show itemized breakdown
   - Explain: "This is the Rendang Wagyu at Rp 275.000, Sate at Rp 185.000..."
   - If error: "Let me get my manager to review this."
   - Manager can adjust bill (discount, remove item, etc.)
5. **Ask Payment Method**:
   - "How would you like to pay? Cash, card, or e-wallet?"
6. **Process Payment** (see Payment sections above)
7. **Print Receipt**:
   - "Here's your receipt. Thank you for dining with us!"
8. **Complete Order**:
   - Click **"Mark as Completed"**
9. **Update Table Status**:
   - Table should auto-update to "Cleaning" status
   - If not, manually update: Go to Tables → Select A01 → Change Status to "Cleaning"
10. **Notify Server or Cleaning Staff**:
    - "Table A01 is clear for cleaning."

---

## Cash Management

### Opening Cash Drawer

**At Start of Shift**:
1. Count starting cash (float):
   - Manager provides starting cash (e.g., Rp 2.000.000)
   - Count and verify amount
2. **In POS System**:
   - Go to **"Cash Drawer"** section (or click "Open Cash Drawer" button)
   - Enter starting amount: `2000000`
   - Click **"Open Drawer for Shift"**
   - POS logs opening balance
3. Place cash in drawer, organized:
   - Coins in coin tray
   - Bills sorted by denomination:
     - Rp 100.000 notes (leftmost)
     - Rp 50.000 notes
     - Rp 20.000 notes
     - Rp 10.000 notes
     - Rp 5.000 notes
     - Rp 2.000 notes
     - Rp 1.000 notes (rightmost)

### During Shift: Cash Handling

**Receiving Cash**:
1. Count cash customer gives you
2. Announce amount: "Rp 600.000, thank you."
3. Place on top of register (not in drawer yet)
4. Calculate change in POS
5. Count change out loud, hand to customer
6. After customer has change, place their payment in drawer

**Drawer Organization**:
- Keep bills organized by denomination (don't mix)
- Place large bills (Rp 100k) under tray or in back (security)
- Keep small bills (Rp 1k, 2k, 5k) easily accessible (frequent use)

**Making Change**:
- Always count change twice (privately, then aloud to customer)
- If you run low on small bills, request change from manager
- Example: "Manager, I need to break a Rp 100.000 bill into smaller denominations."

**Large Bills** (Rp 500k, Rp 1M):
- Rare in Indonesia, but if received:
- Check for authenticity:
  - Watermark
  - Security thread
  - Feel texture (genuine bills have distinct feel)
- If suspicious, politely: "Let me verify this with my manager."
- Manager uses counterfeit detector pen

### Closing Cash Drawer

**At End of Shift**:
1. **Count Cash in Drawer**:
   - Remove all cash
   - Count by denomination:
     - Rp 100k notes: X bills = Rp X
     - Rp 50k notes: Y bills = Rp Y
     - ... (continue for all denominations)
   - Total cash counted (e.g., Rp 4.750.000)

2. **In POS System**:
   - Go to **"Cash Drawer"** → **"Close Drawer"**
   - Enter total cash counted: `4750000`
   - System calculates expected cash:
     - Starting cash: Rp 2.000.000
     - Cash sales: Rp 2.800.000
     - Expected cash: Rp 4.800.000
   - System shows difference:
     - Counted: Rp 4.750.000
     - Expected: Rp 4.800.000
     - **Shortage**: Rp 50.000 (red text)

3. **If Shortage or Overage**:
   - **Small Difference** (< Rp 10.000): Acceptable rounding error
   - **Larger Difference**: Recount cash carefully
   - If still doesn't match: Report to manager
   - Manager will investigate (review transactions, check for errors)

4. **Prepare Cash Drop**:
   - Remove excess cash (leave only starting float for next shift)
   - Place excess in cash drop bag
   - Label bag: Date, Shift, Cashier Name, Amount
   - Deposit in safe

5. **Complete Close**:
   - Click **"Confirm Close"**
   - POS logs closing balance
   - Print shift report (includes all transactions, totals, variance)

---

## Best Practices

### Customer Service

**Greeting**:
- Make eye contact, smile
- "Welcome to Steak Kenangan!" or "Selamat datang!"
- Use polite language: "Terima kasih" (Thank you)

**Efficiency**:
- Take orders quickly but accurately (don't rush)
- Know menu well (quick recommendations)
- Process payments smoothly (no fumbling)

**Accuracy**:
- Repeat order back to customer
- Count cash carefully (twice)
- Verify card payment amount before processing

**Upselling**:
- "Would you like to add a drink or dessert?"
- "We have a special today: 10% off Kopi Kenangan with any main course."
- "Our Es Teler dessert pairs perfectly with your order."

### Speed & Efficiency

**Target Times**:
- Take order: < 3 minutes
- Process payment: < 2 minutes
- Total transaction: < 5 minutes

**Tips**:
- Learn keyboard shortcuts (if applicable)
- Keep cash drawer organized (faster change-making)
- Anticipate customer needs (have bags ready for takeaway)

### Security

**Cash Drawer**:
- Never leave cash drawer open unattended
- Lock drawer when stepping away (even briefly)
- Don't share drawer with other staff (accountability)

**Card Security**:
- Never write down or ask for customer's PIN
- Don't handle customer's card unnecessarily (let them insert/tap)
- Shred merchant copies at end of shift (don't throw in trash)

**Robbery Prevention** (god forbid):
- If threatened, comply immediately (safety first, money second)
- Do NOT resist or argue
- After incident, notify police and manager immediately
- Do NOT chase

---

## Troubleshooting

### Issue: Payment Terminal Not Working

**Symptoms**:
- EDC machine frozen
- Won't turn on
- Card reader not responding

**Solutions**:
1. **Restart EDC**:
   - Hold power button for 5 seconds
   - Select "Restart" or "Power Off"
   - Wait 30 seconds
   - Power on again
2. **Check Connections**:
   - Verify power cable connected
   - Check internet/phone line (if wired)
   - Ensure battery charged (if wireless)
3. **Use Backup EDC** (if available):
   - Fetch backup terminal
   - Process payment on backup
4. **Alternative Payment**:
   - "I apologize, our card terminal is temporarily down. Can you pay with cash or e-wallet instead?"
5. **Contact Support**:
   - Call EDC provider support (number on back of terminal)
   - Explain issue
   - They may provide remote fix

---

### Issue: Receipt Printer Not Printing

**Symptoms**:
- No receipt prints after payment
- Printer makes noise but no printout
- Printer shows error light

**Solutions**:
1. **Check Paper**:
   - Open printer cover
   - Verify paper roll is loaded
   - If out, replace with new roll
   - Ensure paper feeds correctly (not jammed)
2. **Check Connections**:
   - Verify USB or network cable connected
   - Check power cable
3. **Restart Printer**:
   - Turn off printer
   - Wait 10 seconds
   - Turn on
   - Test print (usually a button on printer)
4. **Reprint from POS**:
   - In POS system, find transaction
   - Click **"Reprint Receipt"**
5. **Manual Receipt** (last resort):
   - Write receipt by hand on blank receipt paper
   - Include: Date, Order ID, Items, Total, Payment Method
   - Hand to customer

---

### Issue: Customer Says They Were Overcharged

**Steps**:
1. **Stay Calm and Polite**:
   - "Let me review your order with you."
2. **Show Itemized Bill**:
   - Pull up order details on screen
   - Show customer each item and price
   - "This is the Rendang Wagyu at Rp 275.000, and this is the Sate at Rp 185.000..."
   - Point out tax: "This includes 11% PPN tax (Rp 50.600)."
3. **If Customer is Correct** (item charged but not received):
   - "You're absolutely right. I apologize for the error."
   - "Let me adjust your bill."
   - Click **"Edit Order"** (if manager rights) or fetch manager
   - Manager removes incorrect item
   - Refund difference (see Refund section)
4. **If Bill is Correct** (customer misunderstood pricing):
   - Politely explain: "The menu price for Rendang Wagyu is Rp 275.000, which includes the meat and sides."
   - Show menu (if available)
   - If customer still disputes, involve manager
5. **Never Argue**:
   - If customer is unhappy, get manager
   - Manager has authority to comp/discount for customer satisfaction

---

### Issue: Customer Requests Refund

**Common Reasons**:
- Food quality issue (cold, wrong doneness, taste)
- Wrong order (kitchen made wrong item)
- Customer allergic reaction concern
- Long wait time (customer left)

**Your Role**:
- "I understand your concern. Let me get my manager for you."
- **Do NOT authorize refunds yourself** (unless explicitly trained and given authority)
- Fetch manager immediately

**Manager Will**:
1. Assess situation
2. Decide resolution:
   - Remake food (no refund)
   - Partial refund
   - Full refund
   - Comp (no charge)
3. If refund approved:
   - **Cash Refund**: Manager takes cash from drawer, hands to customer, logs in POS
   - **Card Refund**: Manager processes refund on EDC (takes 3-7 business days)
   - **E-Wallet Refund**: Manager initiates refund in POS (instant)

**In POS System** (if manager authorizes you):
1. Find transaction
2. Click **"Refund"** button
3. Select refund amount: Partial or Full
4. Enter reason: (dropdown or text field)
5. Manager approval: Enter manager PIN
6. Process refund (method depends on original payment method)
7. Print refund receipt, hand to customer

---

### Issue: System is Slow or Frozen

**Solutions**:
1. **Wait 30 Seconds**:
   - Sometimes system is processing, just slow
2. **Refresh Page**:
   - Press F5 or Ctrl+R
   - System reloads
   - Your data should be saved (check current orders)
3. **Close and Reopen Browser**:
   - Close browser completely
   - Open new window
   - Navigate to site, log in
4. **Restart Computer**:
   - Save all work (if possible)
   - Restart POS terminal
   - Log in again
5. **Use Backup Terminal** (if available):
   - Switch to backup counter terminal
   - Log in
   - Continue working
6. **Paper Backup** (last resort):
   - Write orders on paper
   - Process payments manually (cash only)
   - Enter into system once it's working

---

## Quick Reference

### Daily Routine

**Start of Shift**:
1. Log in to Counter Dashboard
2. Count and verify starting cash
3. Open cash drawer in POS (enter starting balance)
4. Test receipt printer (print test receipt)
5. Test card terminal (process Rp 0 test transaction)
6. Check for any pending orders from previous shift

**During Shift**:
1. Monitor "Ready for Pickup" section (takeaway/delivery)
2. Monitor "Awaiting Payment" section (dine-in)
3. Take new takeaway/delivery orders promptly
4. Process payments accurately
5. Keep cash drawer organized
6. Maintain clean and organized counter area

**End of Shift**:
1. Process all pending payments
2. Count cash in drawer
3. Close cash drawer in POS (enter counted amount)
4. Reconcile any discrepancies with manager
5. Prepare cash drop (excess cash to safe)
6. Print shift report
7. Clean counter area
8. Log out

### Common Actions Cheat Sheet

| Action | How To |
|--------|--------|
| **New Takeaway Order** | Click "+ New Takeaway" → Enter customer info → Add items → Submit |
| **New Delivery Order** | Click "+ New Delivery" → Enter customer info + address → Add items → Submit |
| **Process Cash Payment** | Find order → "Pay Now" → Select "Cash" → Enter amount received → Process |
| **Process Card Payment** | Find order → "Pay Now" → Select "Card" → Process on EDC → Confirm in POS |
| **Process E-Wallet Payment** | Find order → "Pay Now" → Select "E-Wallet" → Show QR code → Wait for confirmation |
| **Mark Order Picked Up** | Find order in "Ready for Pickup" → Click "Mark as Picked Up" |
| **Reprint Receipt** | Find transaction → Click "Reprint Receipt" |
| **Open Cash Drawer** | Click "Open Cash Drawer" button (manual open) |
| **Refund** | Find transaction → "Refund" → Enter manager PIN → Process |

### Emergency Contacts

**On-Site**:
- Manager: [Find in restaurant or use intercom]
- Kitchen: [Chef or lead cook]
- Server Station: [Server team]

**Phone**:
- Restaurant Main: +62 21 5555 1234
- Manager Cell: +62 812 3456 7890
- IT Support: +62 821 1234 5678 (for POS system issues)
- EDC Support: (Check sticker on terminal)

---

## Training Checklist

Complete during your first shifts:

- [ ] Logged in to Counter Dashboard successfully
- [ ] Opened cash drawer (entered starting balance)
- [ ] Created a takeaway order with multiple items
- [ ] Created a delivery order with full address
- [ ] Added special instructions to an order
- [ ] Processed a cash payment (calculated change correctly)
- [ ] Processed a card payment on EDC
- [ ] Processed an e-wallet payment (scanned QR code)
- [ ] Printed a receipt
- [ ] Reprinted a receipt from past transaction
- [ ] Handled customer pickup (verified order, handed food)
- [ ] Processed payment for a dine-in customer (by table)
- [ ] Counted cash at end of shift
- [ ] Closed cash drawer in POS (reconciled balance)
- [ ] Handled a customer question or complaint professionally
- [ ] Used backup terminal or paper (if system was down)

**Trainer Signature**: _______________ **Date**: ___________

---

**END OF COUNTER STAFF GUIDE**

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Document Owner**: Front-of-House Team, Steak Kenangan

**Questions?** Ask your Manager or Trainer, or email training@steakkenangan.com
