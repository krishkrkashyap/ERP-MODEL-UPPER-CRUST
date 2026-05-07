from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    # Launch browser in headed mode (so we can see what's happening)
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    print("Navigating to frontend at http://localhost:3000...")
    page.goto('http://localhost:3000')
    
    print("Waiting for page to load...")
    page.wait_for_load_state('networkidle')
    
    print("Taking screenshot of initial state...")
    page.screenshot(path='/tmp/initial_page.png', full_page=True)
    print("Screenshot saved to /tmp/initial_page.png")
    
    # Check if the page loaded correctly
    print(f"Page title: {page.title()}")
    
    # Try to find and click "Orders" link
    print("\nLooking for 'Orders' link...")
    try:
        # Wait for the link to be visible
        page.wait_for_selector('a:text("Orders")', timeout=5000)
        print("Found 'Orders' link, clicking...")
        page.click('a:text("Orders")')
        
        print("Waiting for Orders page to load...")
        page.wait_for_load_state('networkidle', timeout=10000)
        
        print("Taking screenshot of Orders page...")
        page.screenshot(path='/tmp/orders_page.png', full_page=True)
        print("Screenshot saved to /tmp/orders_page.png")
        
        # Check for errors in console
        print(f"Page URL after clicking Orders: {page.url()}")
        
    except Exception as e:
        print(f"Error clicking Orders: {e}")
        print("Taking screenshot of current state...")
        page.screenshot(path='/tmp/error_state.png', full_page=True)
    
    # Try "Inventory" link
    print("\nLooking for 'Inventory' link...")
    try:
        page.goto('http://localhost:3000/inventory')
        print("Navigating directly to /inventory...")
        
        page.wait_for_load_state('networkidle', timeout=10000)
        
        print("Taking screenshot of Inventory page...")
        page.screenshot(path='/tmp/inventory_page.png', full_page=True)
        print("Screenshot saved to /tmp/inventory_page.png")
        
        print(f"Page URL: {page.url()}")
        
    except Exception as e:
        print(f"Error loading Inventory: {e}")
        page.screenshot(path='/tmp/inventory_error.png', full_page=True)
    
    print("\nCollecting console messages...")
    # Get console messages (this requires context manager in async mode)
    # For now, let's just check if page has any error indicators
    errors = page.locator('text=/error/i').all()
    print(f"Found {len(errors)} elements with 'error' text")
    
    browser.close()
    print("\nTest complete!")
