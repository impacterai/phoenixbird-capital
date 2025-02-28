# PhoenixBird Capital Component System

This directory contains reusable components for maintaining a consistent look and feel across the PhoenixBird Capital website.

## Available Components

- `navbar.html` - The site navigation bar
- `footer.html` - The site footer

## How to Use These Components

1. Add component placeholder divs to your HTML:
   ```html
   <!-- For navbar -->
   <div id="navbar-container"></div>
   
   <!-- For footer -->
   <div id="footer-container"></div>
   ```

2. Include the components.js script before the closing body tag:
   ```html
   <script src="js/components.js"></script>
   ```

3. The components will automatically load when the page loads.

## Special Behaviors

- The component system automatically highlights the active navigation item based on the current page.
- On login and signup pages, only the logo is shown in the navbar (no navigation links).
- Authentication-based UI elements (login/logout buttons) are automatically shown or hidden based on login status.

## Implementing on Remaining Pages

The following pages have already been updated to use the component system:
- about.html
- investments.html
- documents.html

The following new pages have been created with the component system already implemented:
- login-new.html (replace login.html with this file)
- signup-new.html (replace signup.html with this file)

To update the remaining pages:
1. Replace the navbar and footer HTML with component containers
2. Add the components.js script reference
3. Test the page to ensure everything displays correctly

## Modifying Components

If you need to update the navbar or footer design:
1. Edit the HTML in the component files (navbar.html or footer.html)
2. The changes will automatically be reflected across all pages that use the component system
