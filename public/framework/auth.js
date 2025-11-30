/**
 * Checks for a valid 'uid' or 'token' in localStorage.
 * If not found, redirects the user to the login page and blocks script execution.
 */
function enforceLogin(loginPageUrl = '/html/login.html') {
    const currentUid = localStorage.getItem('uid');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken'); 

    if (!currentUid || !token) {
        console.warn('Unauthorized. Redirecting to login page.');
        
        // This stops the browser from saving the protected page in history
        window.history.replaceState(null, null, loginPageUrl);
        
        // Executes the actual redirection
        window.location.href = loginPageUrl;
        
        throw new Error('Unauthorized access blocked.'); 
    }
}

enforceLogin();