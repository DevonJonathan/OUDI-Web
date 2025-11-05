// Star rating functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get all rating sections
    const ratingSections = document.querySelectorAll('.rating-section');
    
    ratingSections.forEach(section => {
        const stars = section.querySelectorAll('.star');
        let currentRating = 0;
        
        stars.forEach((star, index) => {
            // Hover effect
            star.addEventListener('mouseenter', function() {
                highlightStars(stars, index + 1);
            });
            
            // Click to rate
            star.addEventListener('click', function() {
                currentRating = index + 1;
                fillStars(stars, currentRating);
                console.log(`Rated ${currentRating} stars`);
            });
        });
        
        // Reset on mouse leave
        section.addEventListener('mouseleave', function() {
            fillStars(stars, currentRating);
        });
    });
    
    function highlightStars(stars, count) {
        stars.forEach((star, index) => {
            if (index < count) {
                star.textContent = '★';
            } else {
                star.textContent = '☆';
            }
        });
    }
    
    function fillStars(stars, count) {
        stars.forEach((star, index) => {
            if (index < count) {
                star.textContent = '★';
                star.classList.add('filled');
            } else {
                star.textContent = '☆';
                star.classList.remove('filled');
            }
        });
    }
    
    // Like button functionality
    const likeBtns = document.querySelectorAll('.like-btn');
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('liked');
            console.log('Post liked/unliked');
        });
    });
    
    // Save button functionality
    const saveBtns = document.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('saved');
            console.log('Post saved/unsaved');
        });
    });
    
    // Menu button functionality
    const menuBtns = document.querySelectorAll('.menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Menu options: Share, Report, Hide');
        });
    });
    
    // Upload button functionality
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadInput = document.getElementById('uploadInput');
    
    uploadBtn.addEventListener('click', function() {
        uploadInput.click();
    });
    
    uploadInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            console.log('File selected:', e.target.files[0].name);
            alert('Upload functionality will be implemented here!');
            // In the future, you can handle the file upload here
        }
    });
    
    // Navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Don't prevent default if it's a link
            if (this.tagName !== 'A') {
                navBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Profile and Friends button click handlers
    const profileLink = document.querySelector('.profile-link');
    const friendsLink = document.querySelector('.friends-link');
    
    profileLink.addEventListener('click', function(e) {
        console.log('Profile clicked - will navigate to profile page');
    });
    
    friendsLink.addEventListener('click', function(e) {
        console.log('Friends clicked - will navigate to friends page');
    });
});