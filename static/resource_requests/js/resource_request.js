// Add this to your resource_request.js file or include directly in your template

jQuery(document).ready(function($) {
    // Debug info
    console.log("Buy rate calculation script loaded");
    
    // Track the fields that affect the calculation
    var $businessType = $('#id_delivery_requests-0-business_type');
    var $location = $('#id_delivery_requests-0-location');
    var $billRate = $('#id_delivery_requests-0-bill_rate_sow_usd_hr');
    var $fromRate = $('#id_delivery_requests-0-buy_rate_guidance_from_usd_hr');
    var $toRate = $('#id_delivery_requests-0-buy_rate_guidance_to_usd_hr');
    var $deliveryRate = $('#id_delivery_requests-0-delivery_buy_rate_tag_usd_hr');
    
    // Log initial values for debugging
    console.log("Initial values:");
    console.log("Business Type:", $businessType.val());
    console.log("Location:", $location.val());
    console.log("Bill Rate:", $billRate.val());
    
    // Add event listeners to all fields that affect the calculation
    $businessType.on('change', calculateBuyRates);
    $location.on('change', calculateBuyRates);
    $billRate.on('input change blur', calculateBuyRates);
    
    // Function to calculate buy rates
    function calculateBuyRates() {
        // Get current values
        var businessType = $businessType.val();
        var location = $location.val();
        var billRate = parseFloat($billRate.val()) || 0;
        
        console.log("Calculating buy rates with:", businessType, location, billRate);
        
        // Check if we have all the required values
        if (!businessType || businessType === '-------' || !location || location === '-------' || billRate <= 0) {
            console.log("Missing required values for calculation");
            return;
        }
        
        // Make AJAX call to get the buy rate guidance values
        console.log("Making AJAX request to get buy rate guidance");
        $.ajax({
            url: '/api/buy-rate-guidance/',
            data: {
                business_type: businessType,
                location: location,
                bill_rate: billRate
            },
            dataType: 'json',
            success: function(data) {
                console.log("Received data:", data);
                
                // Update the fields
                $fromRate.val(data.from_rate);
                $toRate.val(data.to_rate);
                
                // Trigger validation
                validateDeliveryRate();
                
                console.log("Buy rate fields updated");
            },
            error: function(xhr, status, error) {
                console.error("AJAX error:", status, error);
                console.error("Response:", xhr.responseText);
            }
        });
    }
    
    // Rate validation function
    function validateDeliveryRate() {
        var deliveryRate = parseFloat($deliveryRate.val()) || 0;
        var guidanceRate = parseFloat($toRate.val()) || 0;
        var $errorMessage = $('#delivery_buy_rate_error');
        
        // Create error message element if it doesn't exist
        if ($errorMessage.length === 0) {
            $errorMessage = $('<div id="delivery_buy_rate_error" class="error-message">Delivery buy rate cannot exceed the maximum guidance rate!</div>');
            $deliveryRate.after($errorMessage);
        }
        
        if (deliveryRate > guidanceRate && guidanceRate > 0) {
            $deliveryRate.addClass('error-field');
            $errorMessage.show();
            return false;
        } else {
            $deliveryRate.removeClass('error-field');
            $errorMessage.hide();
            return true;
        }
    }
    
    // Calculate on page load (with a delay to ensure all fields are loaded)
    setTimeout(function() {
        console.log("Initial calculation attempt");
        calculateBuyRates();
    }, 1000);
    
    // Add form submission validation
    $('form').on('submit', function(e) {
        if (!validateDeliveryRate()) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: $deliveryRate.offset().top - 100
            }, 200);
        }
    });
});