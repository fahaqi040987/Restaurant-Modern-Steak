# Steak Kenangan POS System - Training Schedule

**Version**: 1.0.0
**Last Updated**: 2025-12-27
**Prepared By**: IT Department
**Training Coordinator**: [To be assigned]

---

## Overview

This document outlines the training schedule for the Steak Kenangan POS system deployment. All staff must complete training before going live with the new system.

### Training Objectives

1. Ensure all staff can proficiently use the POS system
2. Reduce errors and support requests during initial deployment
3. Build staff confidence with the new digital workflow
4. Establish clear accountability for each role

### Training Resources

| Resource | Location |
|----------|----------|
| Admin Manual | `docs/training/admin-manual.md` |
| Kitchen Staff Guide | `docs/training/kitchen-staff-guide.md` |
| Server Staff Guide | `docs/training/server-staff-guide.md` |
| Counter Staff Guide | `docs/training/counter-staff-guide.md` |
| System Access | https://steakkenangan.com |

---

## Training Schedule by Role

### Week 1: Management & Admin Training

#### Day 1-2: Administrator Training
**Duration**: 2-3 hours per day
**Attendees**: Restaurant Owner, General Manager, Operations Manager
**Trainer**: IT Department / System Administrator

**Day 1 Topics**:
- [ ] System login and navigation
- [ ] Dashboard overview and metrics
- [ ] User management (creating accounts, role assignment)
- [ ] Order management (viewing, editing, cancelling)
- [ ] Product management (adding, editing products)

**Day 2 Topics**:
- [ ] Inventory management and stock alerts
- [ ] Table management and QR code setup
- [ ] Reports and analytics
- [ ] Contact form management
- [ ] System settings and backup configuration

**Practical Exercises**:
- Create 3 test user accounts (one for each remaining role)
- Add 2 new products to the menu
- Generate a sales report for today
- Configure a low-stock alert threshold

---

### Week 2: Operational Staff Training

#### Day 3: Kitchen Staff Training
**Duration**: 30-45 minutes
**Attendees**: All kitchen staff (Chefs, Line Cooks)
**Trainer**: Manager + IT Support

**Topics**:
- [ ] Kitchen Display System (KDS) login
- [ ] Understanding order cards (status colors, priority)
- [ ] Order workflow: Start → Preparing → Ready
- [ ] Handling special instructions and allergies
- [ ] As-ready service workflow
- [ ] Troubleshooting common issues

**Practical Exercises**:
- Process 5 test orders from pending to ready
- Identify and mark special instructions
- Respond to a simulated "rush hour" scenario (10+ orders)

---

#### Day 4: Server Staff Training
**Duration**: 45-60 minutes
**Attendees**: All servers (Waiters, Waitresses)
**Trainer**: Manager + Counter Lead

**Topics**:
- [ ] Server Dashboard login and navigation
- [ ] Table management (seating, status changes)
- [ ] Creating dine-in orders
- [ ] Adding items and special instructions
- [ ] Checking order status
- [ ] Marking orders as served
- [ ] Handling customer requests and complaints

**Practical Exercises**:
- Complete full customer service workflow:
  1. Seat customers (mark table occupied)
  2. Take order with special instructions
  3. Monitor order status
  4. Serve when ready
  5. Direct to counter for payment
- Handle a simulated customer complaint

---

#### Day 5: Counter Staff Training
**Duration**: 45-60 minutes
**Attendees**: All counter staff (Cashiers)
**Trainer**: Manager + IT Support

**Topics**:
- [ ] Counter Dashboard login and navigation
- [ ] Creating takeaway orders
- [ ] Creating delivery orders
- [ ] Processing cash payments
- [ ] Processing card payments (EDC terminal)
- [ ] Processing e-wallet payments (QR code)
- [ ] Cash drawer management (open, count, close)
- [ ] Handling dine-in payments
- [ ] Refund process (manager approval)

**Practical Exercises**:
- Process 3 takeaway orders with different payment methods
- Process 2 dine-in payments (by table)
- Open and close cash drawer with reconciliation
- Handle a simulated payment decline scenario

---

### Week 3: Integration & Go-Live Preparation

#### Day 6-7: Full System Integration Test
**Duration**: Full shift simulation
**Attendees**: All trained staff (rotating)
**Coordinator**: Manager

**Objectives**:
- Run complete service simulation with all stations active
- Verify communication between:
  - Counter → Kitchen (new orders appear in KDS)
  - Kitchen → Server (ready status visible)
  - Server → Counter (payment processing)
- Identify any workflow gaps or confusion

**Simulation Scenarios**:
1. **Normal Service**: 20 orders over 2 hours
2. **Rush Hour**: 30 orders in 1 hour
3. **Problem Scenarios**:
   - Kitchen Display frozen (use refresh/restart)
   - Card payment declined (switch to alternative)
   - Customer allergy modification
   - Order cancellation (before/after preparation)

---

#### Day 8: Go-Live Day
**Duration**: Full operating day
**Support**: IT on-site for immediate assistance

**Checklist**:
- [ ] All staff logged in successfully
- [ ] Cash drawers opened with correct starting balance
- [ ] Kitchen Display connected and showing orders
- [ ] First live order processed successfully
- [ ] First payment processed successfully
- [ ] Issue log started (track any problems)

**Support Contacts**:
- IT On-Site: [Name, Phone]
- Remote IT Support: +62 821 1234 5678
- Manager: +62 812 3456 7890

---

## Training Materials Checklist

### For Admin Training (T138)
- [ ] Print Admin Manual (`docs/training/admin-manual.md`)
- [ ] Prepare demo admin account (username: `admin`)
- [ ] Prepare sample data (orders, products, users)
- [ ] Configure training environment (or use production with test data)

### For Kitchen Training (T139)
- [ ] Print Kitchen Staff Guide (`docs/training/kitchen-staff-guide.md`)
- [ ] Prepare demo kitchen accounts (username: `kitchen1`)
- [ ] Configure Kitchen Display on tablet/monitor
- [ ] Create 10+ test orders for practice

### For Server Training (T140)
- [ ] Print Server Staff Guide (`docs/training/server-staff-guide.md`)
- [ ] Prepare demo server accounts (username: `server1`, `server2`)
- [ ] Configure tablets for server use
- [ ] Set up practice tables (T01-T05)

### For Counter Training (T141)
- [ ] Print Counter Staff Guide (`docs/training/counter-staff-guide.md`)
- [ ] Prepare demo counter accounts (username: `counter1`, `counter2`)
- [ ] Configure counter terminal
- [ ] Test EDC (card) terminal
- [ ] Prepare starting cash float for practice

---

## Demo Accounts

All demo accounts use password: `admin123`

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | admin | admin123 | Full system access |
| Manager | manager1 | admin123 | Business operations |
| Server | server1 | admin123 | Dine-in orders, tables |
| Server | server2 | admin123 | Dine-in orders, tables |
| Counter | counter1 | admin123 | All orders + payments |
| Counter | counter2 | admin123 | All orders + payments |
| Kitchen | kitchen1 | admin123 | Kitchen display only |

---

## Post-Training Support

### First Week After Go-Live
- IT support available on-site during peak hours (11 AM - 2 PM, 6 PM - 9 PM)
- Dedicated support line for immediate issues
- Daily check-in with each role lead

### Ongoing Support
- Monthly refresher training (optional)
- Updated training materials when features change
- Support email: training@steakkenangan.com
- Support phone: +62 821 1234 5678

---

## Training Sign-Off Sheet

### Admin Training Completed
| Name | Position | Date | Trainer Signature |
|------|----------|------|-------------------|
| | | | |
| | | | |

### Kitchen Training Completed
| Name | Position | Date | Trainer Signature |
|------|----------|------|-------------------|
| | | | |
| | | | |
| | | | |

### Server Training Completed
| Name | Position | Date | Trainer Signature |
|------|----------|------|-------------------|
| | | | |
| | | | |
| | | | |

### Counter Training Completed
| Name | Position | Date | Trainer Signature |
|------|----------|------|-------------------|
| | | | |
| | | | |

---

## Notes

- Training should be conducted in a quiet environment
- Each trainee should have hands-on access to the system
- Trainers should refer to the respective role guides for detailed instructions
- Document any questions or issues that arise during training
- Update training materials based on feedback

---

**Document Owner**: IT Department, Steak Kenangan
**Contact**: training@steakkenangan.com
