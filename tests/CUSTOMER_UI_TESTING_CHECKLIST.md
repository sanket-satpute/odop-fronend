# =====================================================
# ODOP Customer UI Testing Checklist
# Manual Black Box Testing Guide
# =====================================================

## Test Environment
- **Frontend URL**: http://localhost:4200
- **Backend API**: https://odop-backend.onrender.com/odop
- **Auth API**: https://odop-backend.onrender.com/authenticate

---

## 📝 TEST SUITE 1: CUSTOMER REGISTRATION

### Test Case 1.1: Navigate to Registration
- [ ] Open http://localhost:4200
- [ ] Click "Login" or "Register" button in header
- [ ] Registration dialog/page should appear
- [ ] All form fields should be visible

### Test Case 1.2: Form Validation
- [ ] Try to submit empty form → Validation errors should appear
- [ ] Enter invalid email (e.g., "invalid") → Email validation error
- [ ] Enter weak password → Password requirements message
- [ ] Enter mismatched passwords (if confirm field exists) → Error message
- [ ] Enter invalid phone (less than 10 digits) → Phone validation error

### Test Case 1.3: Successful Registration
Register with these details:
```
Full Name: Test Customer
Email: test.manual@example.com
Password: Test@12345
Phone: 9876543210
Address: 123 Test Street
City: Jaipur
State: Rajasthan
Pin Code: 302001
```
- [ ] Fill all fields with valid data
- [ ] Upload profile picture (if available)
- [ ] Submit form
- [ ] Success message should appear
- [ ] Redirect to login or dashboard

### Test Case 1.4: Profile Picture Upload
- [ ] Click on profile picture upload area
- [ ] Select an image file (JPG/PNG)
- [ ] Preview should display
- [ ] Image should be uploaded with registration

### Test Case 1.5: Duplicate Email Prevention
- [ ] Try registering with same email again
- [ ] System should show "Email already exists" error

---

## 🔐 TEST SUITE 2: CUSTOMER LOGIN

### Test Case 2.1: Login Form Display
- [ ] Navigate to login
- [ ] Email and Password fields visible
- [ ] "Forgot Password" link visible
- [ ] "Register" link visible

### Test Case 2.2: Valid Login
```
Email: test.manual@example.com
Password: Test@12345
```
- [ ] Enter valid credentials
- [ ] Click Login
- [ ] JWT token should be stored (check DevTools → Application → LocalStorage)
- [ ] User should be redirected to dashboard or home
- [ ] Header should show logged-in state (username/avatar)

### Test Case 2.3: Invalid Login
- [ ] Enter wrong password → "Invalid credentials" error
- [ ] Enter non-existent email → "User not found" error
- [ ] Empty fields → Validation errors

### Test Case 2.4: Session Persistence
- [ ] Login successfully
- [ ] Close browser tab
- [ ] Open http://localhost:4200 in new tab
- [ ] User should still be logged in (check LocalStorage)

### Test Case 2.5: Logout
- [ ] Click user menu/avatar
- [ ] Click "Logout"
- [ ] Session should be cleared
- [ ] Redirect to home/login
- [ ] Protected routes should redirect to login

---

## 📊 TEST SUITE 3: CUSTOMER DASHBOARD

### Test Case 3.1: Dashboard Access
- [ ] Login as customer
- [ ] Navigate to Dashboard
- [ ] Should see personalized greeting
- [ ] Profile information displayed correctly

### Test Case 3.2: Dashboard Sections
Verify these sections exist:
- [ ] Profile overview
- [ ] Recent orders
- [ ] Wishlist summary
- [ ] Account settings link
- [ ] Order history link

### Test Case 3.3: Profile Display
- [ ] Full name correct
- [ ] Email correct
- [ ] Phone number correct
- [ ] Address correct
- [ ] Profile picture displayed (if uploaded)

### Test Case 3.4: Profile Edit
- [ ] Click "Edit Profile"
- [ ] Change full name
- [ ] Update address
- [ ] Save changes
- [ ] Verify changes saved
- [ ] Reload page → changes persist

### Test Case 3.5: Password Change
- [ ] Navigate to password change
- [ ] Enter current password
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Submit → Success message
- [ ] Logout and login with new password

---

## 🛍️ TEST SUITE 4: PRODUCTS PAGE

### Test Case 4.1: Products Display
Navigate to Products/Shop page:
- [ ] Products grid loads
- [ ] Product cards show: image, name, price
- [ ] Products count displayed
- [ ] Pagination/infinite scroll works

### Test Case 4.2: Category Filter
- [ ] Categories list visible in sidebar
- [ ] Click on a category
- [ ] Only products from that category shown
- [ ] Category name highlighted
- [ ] Product count updates

### Test Case 4.3: State/Location Filter
- [ ] Select state filter (e.g., Rajasthan)
- [ ] Products from that state shown
- [ ] URL should update with filter params

### Test Case 4.4: Price Filter
- [ ] Price range slider visible
- [ ] Set min price (e.g., ₹500)
- [ ] Set max price (e.g., ₹5000)
- [ ] Products filtered by price range
- [ ] Reset filter → all products shown

### Test Case 4.5: Sorting
Test each sort option:
- [ ] Sort by: Price Low to High
- [ ] Sort by: Price High to Low
- [ ] Sort by: Newest First
- [ ] Sort by: Rating
- [ ] Sort by: Popularity/Best Selling
- [ ] Sort by: Name A-Z

### Test Case 4.6: Search
- [ ] Type product name in search box
- [ ] Results show matching products
- [ ] Search with partial name
- [ ] Search with no results → "No products found"
- [ ] Clear search → all products shown

### Test Case 4.7: GI Tagged Filter
- [ ] Toggle GI Tagged filter
- [ ] Only GI tagged products shown
- [ ] GI badge visible on products

---

## ❤️ TEST SUITE 5: WISHLIST

### Test Case 5.1: Add to Wishlist (Guest)
- [ ] Hover over product card
- [ ] Click heart/wishlist icon
- [ ] Should prompt to login or save to localStorage

### Test Case 5.2: Add to Wishlist (Logged In)
- [ ] Login as customer
- [ ] Click heart icon on product
- [ ] Heart should turn filled/red
- [ ] Toast notification: "Added to wishlist"

### Test Case 5.3: View Wishlist
- [ ] Click wishlist icon in header
- [ ] Navigate to wishlist page
- [ ] All added products displayed
- [ ] Product details visible

### Test Case 5.4: Remove from Wishlist
- [ ] Click remove/heart icon on wishlist item
- [ ] Product removed
- [ ] Toast: "Removed from wishlist"

### Test Case 5.5: Wishlist Persistence
- [ ] Add items to wishlist
- [ ] Logout and login again
- [ ] Wishlist items should persist (if backend-stored)

### Test Case 5.6: Move to Cart
- [ ] Click "Move to Cart" on wishlist item
- [ ] Item added to cart
- [ ] Optional: Item removed from wishlist

---

## 👁️ TEST SUITE 6: QUICK VIEW

### Test Case 6.1: Open Quick View
- [ ] Hover over product card
- [ ] Click "Quick View" button/icon
- [ ] Modal/popup opens with product details

### Test Case 6.2: Quick View Contents
Verify these elements in Quick View:
- [ ] Product images (gallery)
- [ ] Product name
- [ ] Price
- [ ] Description
- [ ] Vendor name/link
- [ ] Quantity selector
- [ ] Add to Cart button
- [ ] Add to Wishlist button
- [ ] View Full Details link

### Test Case 6.3: Quick View Image Gallery
- [ ] Multiple images shown in thumbnails
- [ ] Click thumbnail → main image changes
- [ ] Image zoom on hover (if available)

### Test Case 6.4: Add to Cart from Quick View
- [ ] Set quantity to 2
- [ ] Click "Add to Cart"
- [ ] Success notification
- [ ] Cart count updates in header
- [ ] Close quick view modal

### Test Case 6.5: Navigate to Full Product
- [ ] Click "View Details" in quick view
- [ ] Full product page loads
- [ ] Modal closes

---

## ⚖️ TEST SUITE 7: COMPARE PRODUCTS

### Test Case 7.1: Add to Compare
- [ ] Hover over product
- [ ] Click "Compare" icon
- [ ] Toast: "Added to comparison"
- [ ] Compare icon becomes active

### Test Case 7.2: Compare Bar/Panel
- [ ] Compare bar appears at bottom
- [ ] Shows added products (thumbnails)
- [ ] Shows count: "2 products to compare"
- [ ] "Compare Now" button visible

### Test Case 7.3: Compare Page
Navigate to Compare page:
- [ ] Products displayed side by side
- [ ] Attributes compared:
  - [ ] Name
  - [ ] Price
  - [ ] Rating
  - [ ] Category
  - [ ] Description
  - [ ] Specifications

### Test Case 7.4: Remove from Compare
- [ ] Click remove on comparison item
- [ ] Product removed from comparison
- [ ] Compare bar updates

### Test Case 7.5: Compare Limit
- [ ] Try adding more than 4 products
- [ ] Should show limit message
- [ ] Or replace oldest item

---

## 🛒 TEST SUITE 8: CART & CHECKOUT

### Test Case 8.1: Add to Cart
- [ ] Click "Add to Cart" on product
- [ ] Success notification
- [ ] Cart count increments
- [ ] Cart icon shows badge

### Test Case 8.2: View Cart
- [ ] Click cart icon
- [ ] Cart page/sidebar opens
- [ ] All items displayed
- [ ] Quantity shown
- [ ] Individual prices shown
- [ ] Total calculated

### Test Case 8.3: Update Quantity
- [ ] Increase quantity → Total updates
- [ ] Decrease quantity → Total updates
- [ ] Set to 0 or click remove → Item deleted

### Test Case 8.4: Checkout Process
- [ ] Click "Proceed to Checkout"
- [ ] Shipping address form
- [ ] Fill/select address
- [ ] Payment method selection
- [ ] Order summary shown
- [ ] Place Order → Order confirmation

---

## 🏪 TEST SUITE 9: VENDOR SHOP PAGE

### Test Case 9.1: Navigate to Vendor
- [ ] From product page, click vendor name
- [ ] Vendor shop page loads

### Test Case 9.2: Vendor Info Display
- [ ] Shop name
- [ ] Vendor description/story
- [ ] Location/address
- [ ] Contact information
- [ ] Rating/reviews count

### Test Case 9.3: Vendor Products
- [ ] Products grid loads
- [ ] Only vendor's products shown
- [ ] Filter within vendor products

### Test Case 9.4: Follow Vendor
- [ ] Click "Follow" button
- [ ] Button changes to "Following"
- [ ] (May store in localStorage)

### Test Case 9.5: Get Directions
- [ ] Click "Get Directions" button
- [ ] Google Maps opens in new tab
- [ ] Correct location shown

---

## 🔧 TEST SUITE 10: RESPONSIVE DESIGN

### Test Case 10.1: Mobile Layout (≤576px)
- [ ] Navigation collapses to hamburger menu
- [ ] Product grid: 1 column
- [ ] All forms usable
- [ ] Modals fit screen

### Test Case 10.2: Tablet Layout (577-992px)
- [ ] Product grid: 2-3 columns
- [ ] Sidebar collapsible
- [ ] Touch-friendly buttons

### Test Case 10.3: Desktop Layout (>992px)
- [ ] Full navigation visible
- [ ] Product grid: 3-4 columns
- [ ] Sidebar always visible

---

## 📝 NOTES

### Test Credentials
Created via automated test:
- **Email**: test.customer.20260209192642@example.com
- **Password**: Test@12345

### Known Issues
1. Login returns `jwt` field, not `token`
2. Categories API may return empty
3. Some products missing images array

### Console Errors to Watch
- CORS errors
- 401/403 for protected endpoints
- 500 server errors

---

## ✅ TEST SIGN-OFF

| Suite | Tester | Date | Pass/Fail | Notes |
|-------|--------|------|-----------|-------|
| Registration | | | | |
| Login | | | | |
| Dashboard | | | | |
| Products | | | | |
| Wishlist | | | | |
| Quick View | | | | |
| Compare | | | | |
| Cart | | | | |
| Vendor Shop | | | | |
| Responsive | | | | |

