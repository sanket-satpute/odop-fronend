# =====================================================
# ODOP Product Flow E2E Testing Suite
# Deep Testing: Product Details, Cart, Buy Now, Navigation
# =====================================================

$ErrorActionPreference = "Continue"
$Global:TestResults = @()
$Global:PassCount = 0
$Global:FailCount = 0

# Configuration
$API_BASE_URL = "https://odop-backend.onrender.com/odop"
$AUTH_URL = "https://odop-backend.onrender.com/authenticate"
$FRONTEND_URL = "http://localhost:4200"

# Test Customer Data
$TestEmail = "test.customer.20260209192842@example.com"
$TestPassword = "Test@12345"

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

function Write-TestHeader($title) {
    Write-Host "`n$('='*70)" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "$('='*70)" -ForegroundColor Cyan
}

function Write-TestResult($testName, $passed, $message = "") {
    $status = if ($passed) { "PASS" } else { "FAIL" }
    $color = if ($passed) { "Green" } else { "Red" }
    $icon = if ($passed) { "[✓]" } else { "[✗]" }
    
    Write-Host "$icon $testName : $status" -ForegroundColor $color
    if ($message) { Write-Host "    → $message" -ForegroundColor Gray }
    
    $Global:TestResults += @{
        Name = $testName
        Passed = $passed
        Message = $message
        Category = $Global:CurrentCategory
        Timestamp = Get-Date
    }
    
    if ($passed) { $Global:PassCount++ } else { $Global:FailCount++ }
}

function Test-ApiEndpoint($url, $method = "GET", $body = $null, $headers = @{}) {
    try {
        $params = @{
            Uri = $url
            Method = $method
            ContentType = "application/json"
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($body) {
            $params.Body = ($body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response; StatusCode = 200 }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $statusCode }
    }
}

function Get-AuthToken {
    $loginData = @{
        username = $TestEmail
        password = $TestPassword
        role = "customer"
    }
    $result = Test-ApiEndpoint $AUTH_URL "POST" $loginData
    if ($result.Success -and $result.Data.jwt) {
        return $result.Data.jwt
    }
    return $null
}

# =====================================================
# TEST SUITE 1: VIEW DETAILS BUTTON & PRODUCT DATA
# =====================================================

function Test-ViewDetailsAndProductData {
    $Global:CurrentCategory = "View Details & Product Data"
    Write-TestHeader "TEST SUITE 1: VIEW DETAILS BUTTON & PRODUCT DATA"
    
    # Test 1.1: Get all products to pick one for testing
    $productsResult = Test-ApiEndpoint "$API_BASE_URL/product/get_all_products"
    $productsLoaded = $productsResult.Success -and $productsResult.Data.Count -gt 0
    Write-TestResult "Load Products List" $productsLoaded "Products count: $(if ($productsResult.Data) { $productsResult.Data.Count } else { 0 })"
    
    if (-not $productsLoaded) {
        Write-Host "    [SKIP] Cannot continue without products" -ForegroundColor Yellow
        return $null
    }
    
    $Script:TestProduct = $productsResult.Data[0]
    $productId = $Script:TestProduct.productId
    
    # Test 1.2: Get single product by ID (simulates View Details button)
    $productDetailResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$productId"
    $detailsLoaded = $productDetailResult.Success -and $productDetailResult.Data
    Write-TestResult "View Details API (GET by ID)" $detailsLoaded "Product: $($Script:TestProduct.productName)"
    
    if ($detailsLoaded) {
        $product = $productDetailResult.Data
        
        # Test 1.3-1.15: Verify all product fields are from backend (not mock)
        Write-TestResult "Product ID Present" ($null -ne $product.productId) "ID: $($product.productId)"
        Write-TestResult "Product Name Present" ($product.productName -and $product.productName.Length -gt 0) "Name: $($product.productName)"
        Write-TestResult "Product Description Present" ($product.productDescription -and $product.productDescription.Length -gt 0) "Has description"
        Write-TestResult "Product Price Present" ($null -ne $product.price -and $product.price -gt 0) "Price: ₹$($product.price)"
        Write-TestResult "Category ID Present" ($null -ne $product.categoryId) "Category: $($product.categoryId)"
        Write-TestResult "Vendor ID Present" ($null -ne $product.vendorId) "Vendor: $($product.vendorId)"
        Write-TestResult "Product Image URL Present" ($product.productImageURL -and $product.productImageURL.Length -gt 0) "Has image URL"
        Write-TestResult "Stock Status Present" ($product.stockStatus) "Status: $($product.stockStatus)"
        Write-TestResult "Rating Present" ($null -ne $product.rating) "Rating: $($product.rating)"
        Write-TestResult "Origin State Present" ($product.originState) "State: $($product.originState)"
        Write-TestResult "Origin District Present" ($product.originDistrict) "District: $($product.originDistrict)"
        Write-TestResult "GI Tag Info Present" ($null -ne $product.giTagCertified) "GI Certified: $($product.giTagCertified)"
        
        # Check for mock data indicators
        $isMockData = $product.productId -eq "mock-1" -or $product.productName -like "*Mock*" -or $product.productName -like "*Test*"
        Write-TestResult "Data is NOT Mock Data" (-not $isMockData) "Real backend data confirmed"
    }
    
    return $productId
}

# =====================================================
# TEST SUITE 2: ADD TO CART FUNCTIONALITY
# =====================================================

function Test-AddToCartFunctionality {
    param($productId)
    
    $Global:CurrentCategory = "Add to Cart"
    Write-TestHeader "TEST SUITE 2: ADD TO CART FUNCTIONALITY"
    
    # Get auth token
    $token = Get-AuthToken
    if (-not $token) {
        Write-TestResult "Get Auth Token" $false "Could not authenticate"
        return
    }
    Write-TestResult "Customer Authentication" $true "JWT token obtained"
    
    $headers = @{ Authorization = "Bearer $token" }
    
    # Get customer ID from token or API
    $customerResult = Test-ApiEndpoint "$API_BASE_URL/customer/get_all_customers"
    $customer = $customerResult.Data | Where-Object { $_.emailAddress -eq $TestEmail } | Select-Object -First 1
    
    if (-not $customer) {
        Write-TestResult "Get Customer Data" $false "Customer not found"
        return
    }
    
    $customerId = $customer.customerId
    Write-TestResult "Get Customer ID" $true "Customer: $customerId"
    
    # Get cart count before adding
    $cartBeforeResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$customerId" "GET" $null $headers
    $cartCountBefore = if ($cartBeforeResult.Success -and $cartBeforeResult.Data) { 
        if ($cartBeforeResult.Data -is [array]) { $cartBeforeResult.Data.Count } else { 1 }
    } else { 0 }
    Write-TestResult "Get Initial Cart Count" $true "Cart items before: $cartCountBefore"
    
    # Test 2.1: Add product to cart
    $cartData = @{
        customerId = $customerId
        productId = $productId
        vendorId = $Script:TestProduct.vendorId
        quantity = 1
        approval = $false
        time = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $addCartResult = Test-ApiEndpoint "$API_BASE_URL/cart/save_cart" "POST" $cartData $headers
    $addedToCart = $addCartResult.Success
    Write-TestResult "Add to Cart API" $addedToCart $(if ($addedToCart) { "Cart ID: $($addCartResult.Data.cartId)" } else { "Error: $($addCartResult.Error)" })
    
    if ($addedToCart) {
        $Script:CartItemId = $addCartResult.Data.cartId
    }
    
    # Test 2.2: Verify cart count increased
    Start-Sleep -Milliseconds 500  # Wait for DB update
    $cartAfterResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$customerId" "GET" $null $headers
    $cartCountAfter = if ($cartAfterResult.Success -and $cartAfterResult.Data) { 
        if ($cartAfterResult.Data -is [array]) { $cartAfterResult.Data.Count } else { 1 }
    } else { 0 }
    $cartIncreased = $cartCountAfter -gt $cartCountBefore
    Write-TestResult "Cart Count Increased in DB" $cartIncreased "Before: $cartCountBefore, After: $cartCountAfter"
    
    # Test 2.3: Verify cart item has correct data
    if ($cartAfterResult.Success -and $cartAfterResult.Data) {
        $cartItems = if ($cartAfterResult.Data -is [array]) { $cartAfterResult.Data } else { @($cartAfterResult.Data) }
        $addedItem = $cartItems | Where-Object { $_.productId -eq $productId } | Select-Object -First 1
        
        Write-TestResult "Cart Item Has Product ID" ($addedItem.productId -eq $productId) "Product ID matches"
        Write-TestResult "Cart Item Has Customer ID" ($addedItem.customerId -eq $customerId) "Customer ID matches"
        Write-TestResult "Cart Item Has Quantity" ($addedItem.quantity -gt 0) "Quantity: $($addedItem.quantity)"
    }
    
    # Test 2.4: Verify product exists in database cart collection
    $specificCartResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_product_id/$productId" "GET" $null $headers
    Write-TestResult "Product Found in Cart DB" $specificCartResult.Success "Product exists in cart collection"
    
    return @{
        CustomerId = $customerId
        CartItemId = $Script:CartItemId
        Headers = $headers
    }
}

# =====================================================
# TEST SUITE 3: CART REAL-TIME SYNC CHECK
# =====================================================

function Test-CartRealTimeSync {
    param($testData)
    
    $Global:CurrentCategory = "Cart Real-Time Sync"
    Write-TestHeader "TEST SUITE 3: CART REAL-TIME SYNC (API Level)"
    
    if (-not $testData) {
        Write-Host "    [SKIP] No test data available" -ForegroundColor Yellow
        return
    }
    
    $headers = $testData.Headers
    $customerId = $testData.CustomerId
    
    # Test 3.1: Multiple simultaneous cart queries should return same data
    $query1 = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$customerId" "GET" $null $headers
    $query2 = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$customerId" "GET" $null $headers
    
    $count1 = if ($query1.Data -is [array]) { $query1.Data.Count } else { 1 }
    $count2 = if ($query2.Data -is [array]) { $query2.Data.Count } else { 1 }
    
    Write-TestResult "Consistent Cart Data" ($count1 -eq $count2) "Query 1: $count1, Query 2: $count2"
    
    # Test 3.2: Cart endpoint for all carts (admin view)
    $allCartsResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_all_carts" "GET" $null $headers
    Write-TestResult "Get All Carts API" ($allCartsResult.Success -or $allCartsResult.StatusCode -eq 403) "Endpoint responsive"
    
    Write-Host "`n    [INFO] Frontend cart sync relies on:" -ForegroundColor Yellow
    Write-Host "    - UserStateService.cartCount$ observable" -ForegroundColor Yellow
    Write-Host "    - localStorage 'cart_update' events" -ForegroundColor Yellow
    Write-Host "    - Components subscribing to cartCount$" -ForegroundColor Yellow
}

# =====================================================
# TEST SUITE 4: REMOVE FROM CART
# =====================================================

function Test-RemoveFromCart {
    param($testData)
    
    $Global:CurrentCategory = "Remove from Cart"
    Write-TestHeader "TEST SUITE 4: REMOVE FROM CART FUNCTIONALITY"
    
    if (-not $testData -or -not $testData.CartItemId) {
        Write-Host "    [SKIP] No cart item to remove" -ForegroundColor Yellow
        return
    }
    
    $headers = $testData.Headers
    $customerId = $testData.CustomerId
    $cartItemId = $testData.CartItemId
    
    # Get cart count before removal
    $cartBeforeResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$customerId" "GET" $null $headers
    $cartCountBefore = if ($cartBeforeResult.Data -is [array]) { $cartBeforeResult.Data.Count } else { 1 }
    Write-TestResult "Cart Count Before Removal" $true "Items: $cartCountBefore"
    
    # Test 4.1: Remove item from cart
    $removeResult = Test-ApiEndpoint "$API_BASE_URL/cart/delete_by_id/$cartItemId" "DELETE" $null $headers
    Write-TestResult "Remove from Cart API" $removeResult.Success "Cart item deleted"
    
    # Test 4.2: Verify cart count decreased
    Start-Sleep -Milliseconds 500
    $cartAfterResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$customerId" "GET" $null $headers
    $cartCountAfter = 0
    if ($cartAfterResult.Success -and $cartAfterResult.Data) {
        $cartCountAfter = if ($cartAfterResult.Data -is [array]) { $cartAfterResult.Data.Count } else { 1 }
    }
    $cartDecreased = $cartCountAfter -lt $cartCountBefore
    Write-TestResult "Cart Count Decreased in DB" $cartDecreased "Before: $cartCountBefore, After: $cartCountAfter"
    
    # Test 4.3: Verify item no longer exists
    $checkItemResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_id/$cartItemId" "GET" $null $headers
    $itemRemoved = -not $checkItemResult.Success -or $checkItemResult.StatusCode -eq 404 -or $null -eq $checkItemResult.Data
    Write-TestResult "Cart Item Removed from DB" $itemRemoved "Item no longer exists"
}

# =====================================================
# TEST SUITE 5: BUY NOW FLOW
# =====================================================

function Test-BuyNowFlow {
    param($productId)
    
    $Global:CurrentCategory = "Buy Now Flow"
    Write-TestHeader "TEST SUITE 5: BUY NOW FLOW"
    
    # Test 5.1: Product data available for checkout
    $productResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$productId"
    Write-TestResult "Product Data for Checkout" $productResult.Success "Product available"
    
    if ($productResult.Success) {
        $product = $productResult.Data
        
        # Test 5.2: All required checkout fields present
        Write-TestResult "Product Price for Checkout" ($product.price -gt 0) "Price: ₹$($product.price)"
        Write-TestResult "Vendor ID for Checkout" ($null -ne $product.vendorId) "Vendor: $($product.vendorId)"
        Write-TestResult "Stock Available" ($product.stockStatus -eq "In Stock" -or $product.productQuantity -gt 0) "Status: $($product.stockStatus)"
        
        # Test 5.3: Vendor exists for order fulfillment
        $vendorResult = Test-ApiEndpoint "$API_BASE_URL/vendor/get_all_vendors"
        if ($vendorResult.Success) {
            $vendor = $vendorResult.Data | Where-Object { $_.vendorId -eq $product.vendorId } | Select-Object -First 1
            Write-TestResult "Vendor Exists for Fulfillment" ($null -ne $vendor) "Vendor: $($vendor.fullName)"
        }
    }
    
    Write-Host "`n    [INFO] Buy Now navigates to /checkout with:" -ForegroundColor Yellow
    Write-Host "    - queryParams: { buyNow: productId, qty: quantity }" -ForegroundColor Yellow
    Write-Host "    - Checkout component should handle this flow" -ForegroundColor Yellow
}

# =====================================================
# TEST SUITE 6: PREVIOUS/NEXT PRODUCT NAVIGATION
# =====================================================

function Test-PreviousNextNavigation {
    $Global:CurrentCategory = "Previous/Next Navigation"
    Write-TestHeader "TEST SUITE 6: PREVIOUS/NEXT PRODUCT NAVIGATION"
    
    # Get all products
    $productsResult = Test-ApiEndpoint "$API_BASE_URL/product/get_all_products"
    
    if (-not $productsResult.Success -or $productsResult.Data.Count -lt 2) {
        Write-TestResult "Products for Navigation" $false "Need at least 2 products"
        return
    }
    
    $products = $productsResult.Data
    $productCount = $products.Count
    Write-TestResult "Products Available" $true "Total products: $productCount"
    
    # Test 6.1: Can get first product
    $firstProduct = $products[0]
    $firstResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$($firstProduct.productId)"
    Write-TestResult "Get First Product" $firstResult.Success "Product 1: $($firstProduct.productName)"
    
    # Test 6.2: Can get second product (simulates "Next" click)
    $secondProduct = $products[1]
    $secondResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$($secondProduct.productId)"
    Write-TestResult "Get Second Product (Next)" $secondResult.Success "Product 2: $($secondProduct.productName)"
    
    # Test 6.3: Can get last product
    $lastProduct = $products[$productCount - 1]
    $lastResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$($lastProduct.productId)"
    Write-TestResult "Get Last Product" $lastResult.Success "Product $productCount : $($lastProduct.productName)"
    
    # Test 6.4: Products have unique IDs
    $uniqueIds = $products.productId | Select-Object -Unique
    $allUnique = $uniqueIds.Count -eq $productCount
    Write-TestResult "All Products Have Unique IDs" $allUnique "Unique IDs: $($uniqueIds.Count)"
    
    # Test 6.5: Related products by category
    if ($firstProduct.categoryId) {
        $relatedResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_by_category_id/$($firstProduct.categoryId)"
        Write-TestResult "Related Products by Category" $relatedResult.Success "Category products available"
    }
    
    # Test 6.6: Related products by vendor
    if ($firstProduct.vendorId) {
        $vendorProductsResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_by_vendor_id/$($firstProduct.vendorId)"
        Write-TestResult "Related Products by Vendor" $vendorProductsResult.Success "Vendor products available"
    }
    
    Write-Host "`n    [INFO] Previous/Next navigation implementation:" -ForegroundColor Yellow
    Write-Host "    - Requires product index tracking in component" -ForegroundColor Yellow
    Write-Host "    - Or related products array maintained" -ForegroundColor Yellow
}

# =====================================================
# TEST SUITE 7: VENDOR DATA FOR PRODUCT
# =====================================================

function Test-VendorDataForProduct {
    $Global:CurrentCategory = "Vendor Data"
    Write-TestHeader "TEST SUITE 7: VENDOR DATA FOR PRODUCT PAGE"
    
    if (-not $Script:TestProduct) {
        Write-Host "    [SKIP] No test product available" -ForegroundColor Yellow
        return
    }
    
    $vendorId = $Script:TestProduct.vendorId
    
    # Test 7.1: Get vendor details
    $vendorResult = Test-ApiEndpoint "$API_BASE_URL/vendor/get_all_vendors"
    if ($vendorResult.Success) {
        $vendor = $vendorResult.Data | Where-Object { $_.vendorId -eq $vendorId } | Select-Object -First 1
        
        if ($vendor) {
            Write-TestResult "Vendor Found" $true "Vendor: $($vendor.fullName)"
            Write-TestResult "Vendor Name Present" ($vendor.fullName -and $vendor.fullName.Length -gt 0) "Name: $($vendor.fullName)"
            Write-TestResult "Vendor Shop Name Present" ($vendor.shoppeeName) "Shop: $($vendor.shoppeeName)"
            Write-TestResult "Vendor Location Present" ($vendor.locationState -or $vendor.locationDistrict) "Location: $($vendor.locationState)"
            Write-TestResult "Vendor Contact Present" ($vendor.contactNumber) "Contact available"
        } else {
            Write-TestResult "Vendor Found" $false "Vendor ID $vendorId not in list"
        }
    }
}

# =====================================================
# TEST SUITE 8: REVIEWS DATA
# =====================================================

function Test-ReviewsData {
    param($productId)
    
    $Global:CurrentCategory = "Reviews Data"
    Write-TestHeader "TEST SUITE 8: PRODUCT REVIEWS"
    
    # Test 8.1: Get reviews for product
    $reviewsResult = Test-ApiEndpoint "$API_BASE_URL/review/product/$productId"
    Write-TestResult "Get Product Reviews API" ($reviewsResult.Success -or $reviewsResult.StatusCode -eq 404) "Reviews endpoint responsive"
    
    # Test 8.2: Get product rating
    $ratingResult = Test-ApiEndpoint "$API_BASE_URL/review/product/$productId/rating"
    Write-TestResult "Get Product Rating API" ($ratingResult.Success -or $ratingResult.StatusCode -eq 404) "Rating endpoint responsive"
    
    Write-Host "`n    [INFO] Reviews might be empty for new products" -ForegroundColor Yellow
}

# =====================================================
# GENERATE REPORT
# =====================================================

function Generate-DetailedReport {
    Write-TestHeader "DETAILED TEST EXECUTION SUMMARY"
    
    $totalTests = $Global:PassCount + $Global:FailCount
    $passRate = if ($totalTests -gt 0) { [math]::Round(($Global:PassCount / $totalTests) * 100, 1) } else { 0 }
    
    Write-Host "`n  OVERALL RESULTS:" -ForegroundColor White
    Write-Host "  Total Tests: $totalTests" -ForegroundColor White
    Write-Host "  Passed: $($Global:PassCount)" -ForegroundColor Green
    Write-Host "  Failed: $($Global:FailCount)" -ForegroundColor Red
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })
    
    # Group by category
    $categories = $Global:TestResults | Group-Object -Property Category
    
    Write-Host "`n  RESULTS BY CATEGORY:" -ForegroundColor White
    foreach ($cat in $categories) {
        $catPassed = ($cat.Group | Where-Object { $_.Passed }).Count
        $catTotal = $cat.Group.Count
        $catRate = [math]::Round(($catPassed / $catTotal) * 100, 1)
        $catColor = if ($catRate -eq 100) { "Green" } elseif ($catRate -ge 70) { "Yellow" } else { "Red" }
        Write-Host "    $($cat.Name): $catPassed/$catTotal ($catRate%)" -ForegroundColor $catColor
    }
    
    # List failed tests
    $failedTests = $Global:TestResults | Where-Object { -not $_.Passed }
    if ($failedTests.Count -gt 0) {
        Write-Host "`n  FAILED TESTS:" -ForegroundColor Red
        foreach ($test in $failedTests) {
            Write-Host "    [$($test.Category)] $($test.Name): $($test.Message)" -ForegroundColor Red
        }
    }
    
    # Passed tests summary
    Write-Host "`n  PASSED TESTS:" -ForegroundColor Green
    $passedTests = $Global:TestResults | Where-Object { $_.Passed }
    foreach ($test in $passedTests) {
        Write-Host "    [✓] $($test.Name)" -ForegroundColor Green
    }
    
    Write-Host "`n$('='*70)" -ForegroundColor Cyan
    
    # Identified Issues
    Write-Host "`n  IDENTIFIED ISSUES TO FIX:" -ForegroundColor Yellow
    Write-Host "  1. Cart count not syncing to navbar (main-starter doesn't subscribe to cartCount$)" -ForegroundColor Yellow
    Write-Host "  2. Vendor details endpoint needs public access (/get_vendor_id/)" -ForegroundColor Yellow
    Write-Host "  3. Previous/Next navigation may not be implemented in product details" -ForegroundColor Yellow
}

# =====================================================
# MAIN EXECUTION
# =====================================================

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║         ODOP PRODUCT FLOW DEEP E2E TESTING SUITE                    ║" -ForegroundColor Magenta
Write-Host "║         View Details, Add to Cart, Buy Now, Navigation              ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host "`nTest Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "API Base URL: $API_BASE_URL" -ForegroundColor Gray
Write-Host "Test Customer: $TestEmail" -ForegroundColor Gray

# Run all test suites
$productId = Test-ViewDetailsAndProductData
$testData = Test-AddToCartFunctionality -productId $productId
Test-CartRealTimeSync -testData $testData
Test-RemoveFromCart -testData $testData
Test-BuyNowFlow -productId $productId
Test-PreviousNextNavigation
Test-VendorDataForProduct
Test-ReviewsData -productId $productId

# Generate detailed report
Generate-DetailedReport

Write-Host "`nTest Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

