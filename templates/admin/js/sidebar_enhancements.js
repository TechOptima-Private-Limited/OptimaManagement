$(document).ready(function() {
    // Store the state of navigation in localStorage
    function saveNavState() {
        let navState = {};
        $('.app-group').each(function() {
            const appName = $(this).find('.app-title').data('app-name');
            const isExpanded = $(this).find('.sub-options').hasClass('active');
            navState[appName] = isExpanded;
        });
        localStorage.setItem('navState', JSON.stringify(navState));
    }
    
    // Load the state of navigation from localStorage
    function loadNavState() {
        const savedState = localStorage.getItem('navState');
        if (savedState) {
            const navState = JSON.parse(savedState);
            $('.app-group').each(function() {
                const appName = $(this).find('.app-title').data('app-name');
                if (navState[appName]) {
                    $(this).find('.sub-options').addClass('active');
                    $(this).find('.toggle-button').text('−').addClass('minus');
                } else {
                    $(this).find('.sub-options').removeClass('active');
                    $(this).find('.toggle-button').text('+').removeClass('minus');
                }
            });
        }
    }
    
    // 1. Toggle functionality for app groups
    $('.app-title').click(function(e) {
        var $subOptions = $(this).next('.sub-options');
        var $button = $(this).find('.toggle-button');
        
        $subOptions.toggleClass('active');
        $button.text($subOptions.hasClass('active') ? '−' : '+');
        $button.toggleClass('minus', $subOptions.hasClass('active'));
        
        // Save the navigation state
        saveNavState();
    });
    
    // Prevent toggle button from closing when clicked
    $('.toggle-button').click(function(e) {
        e.stopPropagation();
        $(this).closest('.app-title').click();
    });
    
    // 2. Highlight active menu item based on URL path
    const currentPath = window.location.pathname;
    const currentPage = window.location.href;
    
    // Find exact match first
    let activeLink = $('#nav-sidebar a[href="' + currentPage + '"]');
    
    // If no exact match, try to match the pathname
    if (activeLink.length === 0) {
        activeLink = $('#nav-sidebar a[href="' + currentPath + '"]');
    }
    
    // If still no match, try to match by partial URL (for complex URLs with query params)
    if (activeLink.length === 0) {
        $('#nav-sidebar a').each(function() {
            const linkHref = $(this).attr('href');
            if (currentPage.includes(linkHref) && linkHref !== '/' && linkHref !== '#') {
                activeLink = $(this);
                return false; // Break the loop
            }
        });
    }
    
    // Apply active styling
    if (activeLink.length > 0) {
        // Add active class to the link
        activeLink.addClass('active-link');
        
        // Find parent app group and expand it
        const $appGroup = activeLink.closest('.app-group');
        if ($appGroup.length) {
            const $appTitle = $appGroup.find('.app-title');
            const $toggleButton = $appTitle.find('.toggle-button');
            const $subOptions = $appTitle.next('.sub-options');
            
            $appTitle.addClass('active-app');
            $subOptions.addClass('active');
            $toggleButton.text('−').addClass('minus');
            
            // Save this state
            saveNavState();
        }
    }
    
    // 3. Prevent links from closing the sidebar
    $('#nav-sidebar a').click(function(e) {
        // Store current navigation state before navigating
        saveNavState();
        
        // Don't stop propagation completely, but prevent the sidebar from collapsing
        e.stopPropagation();
    });
    
    // 4. Special handling for Resource_Requests section
    // This ensures the Resource_Requests section stays expanded when on resource request pages
    if (currentPath.includes('resource_request') || currentPath.includes('Resource_Request')) {
        const $resourceRequestsApp = $('.app-title[data-app-name="Resource_Requests"]');
        if ($resourceRequestsApp.length) {
            $resourceRequestsApp.next('.sub-options').addClass('active');
            $resourceRequestsApp.find('.toggle-button').text('−').addClass('minus');
            $resourceRequestsApp.addClass('active-app');
            
            // Save this state
            saveNavState();
        }
    }
    
    // Load previously saved state
    loadNavState();
    
    // Ensure active items are always visible (override loadNavState if needed)
    if (activeLink && activeLink.length > 0) {
        const $appGroup = activeLink.closest('.app-group');
        if ($appGroup.length) {
            $appGroup.find('.sub-options').addClass('active');
            $appGroup.find('.toggle-button').text('−').addClass('minus');
        }
    }
});