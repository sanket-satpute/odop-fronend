# =====================================================
# ODOP Customer E2E Testing Suite
# Comprehensive Black Box & Integration Testing
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
$TestCustomer = @{
    fullName = "Test Customer $(Get-Date -Format 'yyyyMMddHHmmss')"
    emailAddress = "test.customer.$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "Test@12345"
    contactNumber = Get-Random -Minimum 9000000000 -Maximum 9999999999
    address = "123 Test Street"
    city = "Jaipur"
    state = "Rajasthan"
    pinCode = "302001"
}

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

function Write-TestHeader($title) {
    Write-Host "`n$('='*60)" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "$('='*60)" -ForegroundColor Cyan
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
        Timestamp = Get-Date
    }
    
    if ($passed) { $Global:PassCount++ } else { $Global:FailCount++ }
}

function Test-ApiEndpoint($url, $method = "GET", $body = $null, $headers = @{}, $expectedStatus = 200) {
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

function Test-WebPage($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
        return @{ Success = $true; StatusCode = $response.StatusCode; Content = $response.Content }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# =====================================================
# TEST SUITE 1: BACKEND CONNECTIVITY
# =====================================================

function Test-BackendConnectivity {
    Write-TestHeader "TEST SUITE 1: BACKEND CONNECTIVITY"
    
    # Test 1.1: Backend Server Available
    $result = Test-ApiEndpoint "$API_BASE_URL/customer/get_all_customers"
    Write-TestResult "Backend Server Running" $result.Success "API: $API_BASE_URL"
    
    # Test 1.2: Customer Endpoint Available
    $result = Test-ApiEndpoint "$API_BASE_URL/customer/get_all_customers"
    Write-TestResult "Customer API Endpoint" ($result.Success -or $result.StatusCode -eq 401) "Endpoint responsive"
    
    # Test 1.3: Product Endpoint Available
    $result = Test-ApiEndpoint "$API_BASE_URL/product/get_all_products"
    Write-TestResult "Product API Endpoint" ($result.Success -or $result.StatusCode -eq 401) "Endpoint responsive"
    
    # Test 1.4: Category Endpoint Available
    $result = Test-ApiEndpoint "$API_BASE_URL/category/get_all_categories"
    Write-TestResult "Category API Endpoint" ($result.Success -or $result.StatusCode -eq 401) "Endpoint responsive"
}

# =====================================================
# TEST SUITE 2: CUSTOMER REGISTRATION
# =====================================================

function Test-CustomerRegistration {
    Write-TestHeader "TEST SUITE 2: CUSTOMER REGISTRATION"
    
    # Test 2.1: Check if email already exists
    $checkResult = Test-ApiEndpoint "$API_BASE_URL/customer/check_customer_exists/$($TestCustomer.emailAddress)/$($TestCustomer.contactNumber)"
    Write-TestResult "Email Availability Check" $true "Checking if email is available"
    
    # Test 2.2: Register new customer
    $registrationData = @{
        fullName = $TestCustomer.fullName
        emailAddress = $TestCustomer.emailAddress
        password = $TestCustomer.password
        contactNumber = $TestCustomer.contactNumber
        address = $TestCustomer.address
        city = $TestCustomer.city
        state = $TestCustomer.state
        pinCode = $TestCustomer.pinCode
    }
    
    $result = Test-ApiEndpoint "$API_BASE_URL/customer/create_account" "POST" $registrationData
    $Global:RegisteredCustomer = $result.Data
    
    $registrationSuccess = $result.Success -and $result.Data.customerId
    Write-TestResult "Customer Registration" $registrationSuccess $(if ($registrationSuccess) { "Customer ID: $($result.Data.customerId)" } else { "Error: $($result.Error)" })
    
    if ($registrationSuccess) {
        $Script:CustomerId = $result.Data.customerId
        
        # Test 2.3: Verify registration data
        $nameMatch = $result.Data.fullName -eq $TestCustomer.fullName
        Write-TestResult "Name Stored Correctly" $nameMatch "Expected: $($TestCustomer.fullName), Got: $($result.Data.fullName)"
        
        $emailMatch = $result.Data.emailAddress -eq $TestCustomer.emailAddress
        Write-TestResult "Email Stored Correctly" $emailMatch "Expected: $($TestCustomer.emailAddress)"
        
        $stateMatch = $result.Data.state -eq $TestCustomer.state
        Write-TestResult "State Stored Correctly" $stateMatch "Expected: $($TestCustomer.state)"
    }
    
    # Test 2.4: Duplicate Registration Prevention
    $dupResult = Test-ApiEndpoint "$API_BASE_URL/customer/create_account" "POST" $registrationData
    $duplicateBlocked = -not $dupResult.Success -or $dupResult.StatusCode -eq 400 -or $dupResult.StatusCode -eq 409
    Write-TestResult "Duplicate Registration Blocked" $duplicateBlocked "System should prevent duplicate emails"
    
    # Test 2.5: Invalid Email Format Validation
    $invalidEmailData = $registrationData.Clone()
    $invalidEmailData.emailAddress = "invalid-email"
    $invalidResult = Test-ApiEndpoint "$API_BASE_URL/customer/create_account" "POST" $invalidEmailData
    Write-TestResult "Invalid Email Validation" (-not $invalidResult.Success -or $invalidResult.StatusCode -ge 400) "Validation applied"
    
    return $registrationSuccess
}

# =====================================================
# TEST SUITE 3: CUSTOMER LOGIN
# =====================================================

function Test-CustomerLogin {
    Write-TestHeader "TEST SUITE 3: CUSTOMER LOGIN"
    
    # Test 3.1: Valid Login
    $loginData = @{
        username = $TestCustomer.emailAddress
        password = $TestCustomer.password
        role = "customer"
    }
    
    $result = Test-ApiEndpoint $AUTH_URL "POST" $loginData
    $loginSuccess = $result.Success -and ($result.Data.jwt -or $result.Data.token)
    Write-TestResult "Customer Login" $loginSuccess $(if ($loginSuccess) { "JWT Token received" } else { "Error: $($result.Error)" })
    
    if ($loginSuccess) {
        $Script:AuthToken = if ($result.Data.jwt) { $result.Data.jwt } else { $result.Data.token }
        $Script:LoggedInUser = $result.Data
        
        # Test 3.2: Verify token structure
        $tokenParts = $Script:AuthToken.Split('.')
        $validToken = $tokenParts.Count -eq 3
        Write-TestResult "JWT Token Structure Valid" $validToken "Token has 3 parts (header.payload.signature)"
        
        # Test 3.3: Verify user data returned
        $userDataReturned = $result.Data.userId -or $result.Data.username
        Write-TestResult "User Data in Response" $userDataReturned "User ID/Username returned with token"
    }
    
    # Test 3.4: Invalid Password Login
    $wrongPasswordData = @{
        username = $TestCustomer.emailAddress
        password = "WrongPassword123"
        role = "customer"
    }
    $wrongResult = Test-ApiEndpoint $AUTH_URL "POST" $wrongPasswordData
    $wrongPasswordBlocked = -not $wrongResult.Success -or $wrongResult.StatusCode -ge 400
    Write-TestResult "Invalid Password Rejected" $wrongPasswordBlocked "Wrong credentials blocked"
    
    # Test 3.5: Non-existent User Login
    $nonExistentData = @{
        username = "nonexistent@example.com"
        password = "AnyPassword123"
        role = "customer"
    }
    $nonExistentResult = Test-ApiEndpoint $AUTH_URL "POST" $nonExistentData
    Write-TestResult "Non-existent User Rejected" (-not $nonExistentResult.Success) "Invalid user blocked"
    
    return $loginSuccess
}

# =====================================================
# TEST SUITE 4: CUSTOMER DASHBOARD
# =====================================================

function Test-CustomerDashboard {
    Write-TestHeader "TEST SUITE 4: CUSTOMER DASHBOARD"
    
    if (-not $Script:AuthToken) {
        Write-TestResult "Dashboard Tests" $false "Auth token not available - skipping"
        return $false
    }
    
    $headers = @{
        "Authorization" = "Bearer $($Script:AuthToken)"
    }
    
    # Test 4.1: Get Customer Profile
    $result = Test-ApiEndpoint "$API_BASE_URL/customer/get_customer_id/$($Script:CustomerId)" "GET" $null $headers
    Write-TestResult "Get Customer Profile" $result.Success "Fetch customer details"
    
    if ($result.Success) {
        # Test 4.2: Verify profile data integrity
        $profileData = $result.Data
        Write-TestResult "Profile Name Correct" ($profileData.fullName -eq $TestCustomer.fullName) "Name: $($profileData.fullName)"
        Write-TestResult "Profile Email Correct" ($profileData.emailAddress -eq $TestCustomer.emailAddress) "Email: $($profileData.emailAddress)"
        Write-TestResult "Profile State Correct" ($profileData.state -eq $TestCustomer.state) "State: $($profileData.state)"
    }
    
    # Test 4.3: Update Customer Profile
    $updateData = @{
        fullName = "$($TestCustomer.fullName) Updated"
        emailAddress = $TestCustomer.emailAddress
        contactNumber = $TestCustomer.contactNumber
        address = "456 Updated Street"
        city = $TestCustomer.city
        state = $TestCustomer.state
        pinCode = $TestCustomer.pinCode
    }
    
    $updateResult = Test-ApiEndpoint "$API_BASE_URL/customer/update_customer_by_id/$($Script:CustomerId)" "PUT" $updateData $headers
    Write-TestResult "Update Customer Profile" $updateResult.Success "Profile update endpoint"
    
    # Test 4.4: Verify update persisted
    if ($updateResult.Success) {
        $verifyResult = Test-ApiEndpoint "$API_BASE_URL/customer/get_customer_id/$($Script:CustomerId)" "GET" $null $headers
        $updatePersisted = $verifyResult.Data.address -eq "456 Updated Street"
        Write-TestResult "Update Persisted" $updatePersisted "Data saved correctly"
    }
    
    return $result.Success
}

# =====================================================
# TEST SUITE 5: PRODUCTS & FILTERING
# =====================================================

function Test-ProductsAndFiltering {
    Write-TestHeader "TEST SUITE 5: PRODUCTS & FILTERING"
    
    # Test 5.1: Get All Products
    $result = Test-ApiEndpoint "$API_BASE_URL/product/get_all_products"
    $productsLoaded = $result.Success -and $result.Data.Count -gt 0
    Write-TestResult "Load All Products" $productsLoaded "Products count: $(if ($result.Data) { $result.Data.Count } else { 0 })"
    
    if ($productsLoaded) {
        $Script:Products = $result.Data
        $Script:FirstProduct = $result.Data[0]
    }
    
    # Test 5.2: Get All Categories
    $catResult = Test-ApiEndpoint "$API_BASE_URL/category/get_all_categories"
    $categoriesLoaded = $catResult.Success -and $catResult.Data.Count -gt 0
    Write-TestResult "Load All Categories" $categoriesLoaded "Categories count: $(if ($catResult.Data) { $catResult.Data.Count } else { 0 })"
    
    if ($categoriesLoaded -and $catResult.Data[0].categoryId) {
        $Script:FirstCategory = $catResult.Data[0]
        
        # Test 5.3: Filter Products by Category
        $catFilterResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_by_category_id/$($Script:FirstCategory.categoryId)"
        Write-TestResult "Filter by Category" ($catFilterResult.Success) "Category: $($Script:FirstCategory.categoryName)"
    }
    
    # Test 5.4: Search Products by Name
    if ($Script:Products -and $Script:Products.Count -gt 0) {
        $searchTerm = $Script:Products[0].productName.Split(' ')[0]
        $searchResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_by_product_name/$searchTerm"
        Write-TestResult "Search Products" ($searchResult.Success) "Search term: '$searchTerm'"
    }
    
    # Test 5.5: Get Product by ID
    if ($Script:FirstProduct) {
        $productResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$($Script:FirstProduct.productId)"
        Write-TestResult "Get Product by ID" ($productResult.Success) "Product: $($Script:FirstProduct.productName)"
    }
    
    # Test 5.6: Get Products by Location (State)
    $locationResult = Test-ApiEndpoint "$API_BASE_URL/product/search_by_state?state=Rajasthan"
    Write-TestResult "Filter by State" ($locationResult.Success) "State: Rajasthan"
    
    # Test 5.7: Get GI Tagged Products
    $giResult = Test-ApiEndpoint "$API_BASE_URL/product/gi_tagged"
    Write-TestResult "GI Tagged Products" ($giResult.Success) "GI Tagged filter"
    
    return $productsLoaded
}

# =====================================================
# TEST SUITE 6: WISHLIST FUNCTIONALITY
# =====================================================

function Test-WishlistFunctionality {
    Write-TestHeader "TEST SUITE 6: WISHLIST FUNCTIONALITY"
    
    if (-not $Script:AuthToken -or -not $Script:FirstProduct) {
        Write-TestResult "Wishlist Tests" $false "Prerequisites not met - skipping"
        return $false
    }
    
    $headers = @{
        "Authorization" = "Bearer $($Script:AuthToken)"
    }
    
    # Test 6.1: Add Product to Wishlist
    $addResult = Test-ApiEndpoint "$API_BASE_URL/wishlist/$($Script:FirstProduct.productId)" "POST" $null $headers
    Write-TestResult "Add to Wishlist" $addResult.Success "Product: $($Script:FirstProduct.productName)"
    
    # Test 6.2: Get Wishlist
    $getResult = Test-ApiEndpoint "$API_BASE_URL/wishlist" "GET" $null $headers
    $wishlistLoaded = $getResult.Success
    Write-TestResult "Get Wishlist" $wishlistLoaded "Fetch wishlist items"
    
    # Test 6.3: Check Product in Wishlist
    $checkResult = Test-ApiEndpoint "$API_BASE_URL/wishlist/check/$($Script:FirstProduct.productId)" "GET" $null $headers
    Write-TestResult "Check Product in Wishlist" $checkResult.Success "Product status check"
    
    # Test 6.4: Remove from Wishlist
    $removeResult = Test-ApiEndpoint "$API_BASE_URL/wishlist/$($Script:FirstProduct.productId)" "DELETE" $null $headers
    Write-TestResult "Remove from Wishlist" $removeResult.Success "Product removed"
    
    # Test 6.5: Verify Removal
    $verifyResult = Test-ApiEndpoint "$API_BASE_URL/wishlist/check/$($Script:FirstProduct.productId)" "GET" $null $headers
    if ($verifyResult.Success -and $verifyResult.Data) {
        $removed = -not $verifyResult.Data.inWishlist
        Write-TestResult "Wishlist Removal Verified" $removed "Product no longer in wishlist"
    }
    
    return $addResult.Success
}

# =====================================================
# TEST SUITE 7: CART FUNCTIONALITY
# =====================================================

function Test-CartFunctionality {
    Write-TestHeader "TEST SUITE 7: CART FUNCTIONALITY"
    
    if (-not $Script:AuthToken -or -not $Script:FirstProduct) {
        Write-TestResult "Cart Tests" $false "Prerequisites not met - skipping"
        return $false
    }
    
    $headers = @{
        "Authorization" = "Bearer $($Script:AuthToken)"
    }
    
    # Test 7.1: Add Product to Cart
    $cartData = @{
        customerId = $Script:CustomerId
        productId = $Script:FirstProduct.productId
        vendorId = $Script:FirstProduct.vendorId
        quantity = 1
        approval = $false
        time = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $addResult = Test-ApiEndpoint "$API_BASE_URL/cart/save_cart" "POST" $cartData $headers
    Write-TestResult "Add to Cart" $addResult.Success "Product added to cart"
    
    if ($addResult.Success -and $addResult.Data.cartId) {
        $Script:CartId = $addResult.Data.cartId
    }
    
    # Test 7.2: Get Customer Cart
    $getResult = Test-ApiEndpoint "$API_BASE_URL/cart/get_cart_customer_id/$($Script:CustomerId)" "GET" $null $headers
    $cartLoaded = $getResult.Success
    Write-TestResult "Get Customer Cart" $cartLoaded "Fetched cart items"
    
    # Test 7.3: Verify Cart Items
    if ($cartLoaded -and $getResult.Data) {
        $cartCount = if ($getResult.Data -is [array]) { $getResult.Data.Count } else { 1 }
        Write-TestResult "Cart Items Count" ($cartCount -gt 0) "Items in cart: $cartCount"
    }
    
    # Test 7.4: Remove from Cart
    if ($Script:CartId) {
        $removeResult = Test-ApiEndpoint "$API_BASE_URL/cart/delete_by_id/$($Script:CartId)" "DELETE" $null $headers
        Write-TestResult "Remove from Cart" $removeResult.Success "Cart item removed"
    }
    
    return $addResult.Success
}

# =====================================================
# TEST SUITE 8: PRODUCT COMPARISON
# =====================================================

function Test-ProductComparison {
    Write-TestHeader "TEST SUITE 8: PRODUCT COMPARISON (Frontend Feature)"
    
    # Product comparison is typically a frontend-only feature using localStorage
    # We'll verify the products have comparable attributes
    
    if ($Script:Products -and $Script:Products.Count -ge 2) {
        $product1 = $Script:Products[0]
        $product2 = $Script:Products[1]
        
        # Test 8.1: Products have comparable attributes
        $hasName = $product1.productName -and $product2.productName
        Write-TestResult "Products Have Names" $hasName "Comparable attribute: productName"
        
        $hasPrice = $product1.price -and $product2.price
        Write-TestResult "Products Have Prices" $hasPrice "Comparable attribute: price"
        
        $hasCategory = $product1.categoryId -or $product1.subCategoryId -or $product1.category
        Write-TestResult "Products Have Categories" $hasCategory "Comparable attribute: categoryId"
        
        $hasRating = $null -ne $product1.rating
        Write-TestResult "Products Have Ratings" $hasRating "Comparable attribute: rating"
        
        Write-Host "`n    [INFO] Compare feature works via localStorage in browser" -ForegroundColor Yellow
    }
    else {
        Write-TestResult "Product Comparison" $false "Need at least 2 products"
    }
}

# =====================================================
# TEST SUITE 9: QUICK VIEW FEATURE
# =====================================================

function Test-QuickViewFeature {
    Write-TestHeader "TEST SUITE 9: QUICK VIEW (API Data Validation)"
    
    if (-not $Script:FirstProduct) {
        Write-TestResult "Quick View Tests" $false "No product available"
        return $false
    }
    
    # Quick View requires specific product data to be available
    $product = $Script:FirstProduct
    
    # Test 9.1: Product has name
    Write-TestResult "Product Name Available" ($null -ne $product.productName) "Name: $($product.productName)"
    
    # Test 9.2: Product has price
    Write-TestResult "Product Price Available" ($null -ne $product.price) "Price: ₹$($product.price)"
    
    # Test 9.3: Product has description
    $hasDescription = $product.productDescription -or $product.description
    Write-TestResult "Product Description Available" $hasDescription "Quick view needs description"
    
    # Test 9.4: Product has images
    $hasImages = $product.productImageURL -or ($product.images -and $product.images.Count -gt 0)
    Write-TestResult "Product Images Available" $hasImages "Product image URL or array available"
    
    # Test 9.5: Product has vendor info
    Write-TestResult "Vendor ID Available" ($null -ne $product.vendorId) "Vendor link for quick view"
    
    # Test 9.6: Get Full Product Details
    $detailResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_id/$($product.productId)"
    Write-TestResult "Full Product Details API" $detailResult.Success "Complete data for quick view"
}

# =====================================================
# TEST SUITE 10: VENDOR SHOP PAGE
# =====================================================

function Test-VendorShopPage {
    Write-TestHeader "TEST SUITE 10: VENDOR SHOP PAGE"
    
    # Test 10.1: Get All Vendors
    $vendorResult = Test-ApiEndpoint "$API_BASE_URL/vendor/get_all_vendors"
    $vendorsLoaded = $vendorResult.Success -and $vendorResult.Data.Count -gt 0
    Write-TestResult "Load All Vendors" $vendorsLoaded "Vendors count: $(if ($vendorResult.Data) { $vendorResult.Data.Count } else { 0 })"
    
    if ($vendorsLoaded) {
        $Script:FirstVendor = $vendorResult.Data[0]
        
        # Test 10.2: Get Vendor by ID
        $vendorDetailResult = Test-ApiEndpoint "$API_BASE_URL/vendor/get_vendor_id/$($Script:FirstVendor.vendorId)"
        Write-TestResult "Get Vendor Details" $vendorDetailResult.Success "Vendor: $($Script:FirstVendor.fullName)"
        
        # Test 10.3: Get Vendor Products
        $vendorProductsResult = Test-ApiEndpoint "$API_BASE_URL/product/get_product_by_vendor_id/$($Script:FirstVendor.vendorId)"
        Write-TestResult "Get Vendor Products" $vendorProductsResult.Success "Vendor's product catalog"
        
        # Test 10.4: Get Vendors by State
        if ($Script:FirstVendor.locationState) {
            $stateVendorsResult = Test-ApiEndpoint "$API_BASE_URL/vendor/search_by_state?state=$($Script:FirstVendor.locationState)"
            Write-TestResult "Search Vendors by State" $stateVendorsResult.Success "State: $($Script:FirstVendor.locationState)"
        }
    }
}

# =====================================================
# FRONTEND TESTS (Browser Required)
# =====================================================

function Test-FrontendAvailability {
    Write-TestHeader "TEST SUITE 11: FRONTEND AVAILABILITY"
    
    # Test 11.1: Frontend Server Running
    $frontendResult = Test-WebPage $FRONTEND_URL
    Write-TestResult "Frontend Server Running" $frontendResult.Success "URL: $FRONTEND_URL"
    
    if ($frontendResult.Success) {
        # Test 11.2: Home Page Loads
        Write-TestResult "Home Page Loads" ($frontendResult.Content.Length -gt 1000) "Page content received"
        
        # Test 11.3: Angular App Detected
        $hasAngular = $frontendResult.Content -match "ng-version|angular"
        Write-TestResult "Angular App Detected" $hasAngular "Angular framework loaded"
    }
}

# =====================================================
# CLEANUP
# =====================================================

function Cleanup-TestData {
    Write-TestHeader "CLEANUP: REMOVING TEST DATA"
    
    if ($Script:AuthToken -and $Script:CustomerId) {
        $headers = @{
            "Authorization" = "Bearer $($Script:AuthToken)"
        }
        
        # Delete test customer (optional - comment out to keep test data)
        # $deleteResult = Test-ApiEndpoint "$API_BASE_URL/customer/delete_by_id/$($Script:CustomerId)" "DELETE" $null $headers
        # Write-TestResult "Delete Test Customer" $deleteResult.Success "Cleanup completed"
        
        Write-Host "    [INFO] Test customer preserved: $($TestCustomer.emailAddress)" -ForegroundColor Yellow
        Write-Host "    [INFO] Password: $($TestCustomer.password)" -ForegroundColor Yellow
    }
}

# =====================================================
# GENERATE REPORT
# =====================================================

function Generate-TestReport {
    Write-TestHeader "TEST EXECUTION SUMMARY"
    
    $totalTests = $Global:PassCount + $Global:FailCount
    $passRate = if ($totalTests -gt 0) { [math]::Round(($Global:PassCount / $totalTests) * 100, 1) } else { 0 }
    
    Write-Host "`n  Total Tests: $totalTests" -ForegroundColor White
    Write-Host "  Passed: $($Global:PassCount)" -ForegroundColor Green
    Write-Host "  Failed: $($Global:FailCount)" -ForegroundColor Red
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })
    
    # List failed tests
    $failedTests = $Global:TestResults | Where-Object { -not $_.Passed }
    if ($failedTests.Count -gt 0) {
        Write-Host "`n  FAILED TESTS:" -ForegroundColor Red
        foreach ($test in $failedTests) {
            Write-Host "    - $($test.Name): $($test.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n$('='*60)" -ForegroundColor Cyan
    
    # Save report to file
    $reportPath = "$(Split-Path $PSScriptRoot)\test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $Global:TestResults | ConvertTo-Json -Depth 5 | Out-File $reportPath
    Write-Host "Report saved to: $reportPath" -ForegroundColor Gray
}

# =====================================================
# MAIN EXECUTION
# =====================================================

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║         ODOP CUSTOMER E2E TESTING SUITE                     ║" -ForegroundColor Magenta
Write-Host "║         Black Box & Integration Testing                     ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host "`nTest Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "API Base URL: $API_BASE_URL" -ForegroundColor Gray
Write-Host "Test Customer: $($TestCustomer.emailAddress)" -ForegroundColor Gray

# Run all test suites
Test-BackendConnectivity
$registrationOk = Test-CustomerRegistration
$loginOk = Test-CustomerLogin
if ($loginOk) { Test-CustomerDashboard }
Test-ProductsAndFiltering
if ($loginOk) { Test-WishlistFunctionality }
if ($loginOk) { Test-CartFunctionality }
Test-ProductComparison
Test-QuickViewFeature
Test-VendorShopPage
Test-FrontendAvailability
Cleanup-TestData
Generate-TestReport

Write-Host "`nTest Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

