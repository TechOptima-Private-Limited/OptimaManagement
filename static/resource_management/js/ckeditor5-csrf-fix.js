function getCookie(name) {
    if (!document.cookie) return null;
    const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith(name + '='));
    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
}

window.CKEDITOR_5_CONFIG = {
    ckfinder: {
        uploadUrl: '/en/ckeditor5/image_upload/',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    }
};
