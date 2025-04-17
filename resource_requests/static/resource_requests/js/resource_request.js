// Add this to your resource_request.js file

jQuery(document).ready(function($) {
    // Initialize datepicker
    $('.datepicker').datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true,
        yearRange: '2020:2030',
        showButtonPanel: true
    }).attr('readonly', 'readonly'); // Prevent manual typing

    // Rate validation on blur
    $('#id_delivery_requests-0-delivery_buy_rate_tag_usd_hr').on('blur', function() {
        validateDeliveryRate();
    });

    // Re-check on guidance rate change
    $('#id_delivery_requests-0-buy_rate_guidance_to_usd_hr').on('blur', function() {
        validateDeliveryRate();
    });

    // Add listeners to fields that affect buy rate calculation
    $('#id_delivery_requests-0-business_type, #id_delivery_requests-0-location, #id_delivery_requests-0-bill_rate_sow_usd_hr').on('change', function() {
        calculateBuyRates();
    });

    // Function to validate delivery rate
    function validateDeliveryRate() {
        var $deliveryInput = $('#id_delivery_requests-0-delivery_buy_rate_tag_usd_hr');
        var deliveryRate = parseFloat($deliveryInput.val()) || 0;
        var guidanceRate = parseFloat($('#id_delivery_requests-0-buy_rate_guidance_to_usd_hr').val()) || 0;
        var $errorMessage = $('#delivery_buy_rate_error');
        
        // Create error message element if it doesn't exist
        if ($errorMessage.length === 0) {
            $errorMessage = $('<div id="delivery_buy_rate_error" class="error-message">Delivery buy rate cannot exceed the maximum guidance rate!</div>');
            $deliveryInput.after($errorMessage);
        }
        
        if (deliveryRate > guidanceRate && guidanceRate > 0) {
            $deliveryInput.addClass('error-field');
            $errorMessage.show();
            return false;
        } else {
            $deliveryInput.removeClass('error-field');
            $errorMessage.hide();
            return true;
        }
    }

    // Function to calculate buy rates
    function calculateBuyRates() {
        // Get the values
        var businessType = $('#id_delivery_requests-0-business_type').val();
        var location = $('#id_delivery_requests-0-location').val();
        var billRate = parseFloat($('#id_delivery_requests-0-bill_rate_sow_usd_hr').val()) || 0;
        
        if(businessType && location && billRate > 0) {
            // Make AJAX call to get the buy rate guidance values
            $.ajax({
                url: '/api/buy-rate-guidance/',
                data: {
                    business_type: businessType,
                    location: location,
                    bill_rate: billRate
                },
                dataType: 'json',
                success: function(data) {
                    // Update the fields
                    $('#id_delivery_requests-0-buy_rate_guidance_from_usd_hr').val(data.from_rate);
                    $('#id_delivery_requests-0-buy_rate_guidance_to_usd_hr').val(data.to_rate);
                    
                    // Trigger validation
                    validateDeliveryRate();
                },
                error: function() {
                    console.error("Failed to get buy rate guidance values");
                }
            });
        }
    }

    // Add validation on form submit
    $('form').on('submit', function(e) {
        if (!validateDeliveryRate()) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: $('#id_delivery_requests-0-delivery_buy_rate_tag_usd_hr').offset().top - 100
            }, 200);
        }
    });

    // Initial calculation when form loads
    setTimeout(calculateBuyRates, 500);
});