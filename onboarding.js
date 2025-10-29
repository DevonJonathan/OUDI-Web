document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.onboarding-slide');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const progressIndicator = document.getElementById('progressIndicator');
    
    // Select both sliders and their value displays
    const heightSlider = document.getElementById('heightSlider');
    const heightValueDisplay = document.getElementById('heightValue');
    const weightSlider = document.getElementById('weightSlider');
    const weightValueDisplay = document.getElementById('weightValue');
    const otherStyleCheckbox = document.getElementById('otherStyleCheckbox');
    const otherStyleInput = document.getElementById('otherStyleInput');

    let currentSlide = 0;

    // Function to calculate and update the value bubble position next to the thumb
    function updateBubblePosition(slider, valueDisplay) {
        if (!slider || !valueDisplay) return;

        const min = slider.min ? Number(slider.min) : 0;
        const max = slider.max ? Number(slider.max) : 100;
        const value = Number(slider.value);
        
        // Calculate the percentage of the value relative to the min/max range
        const range = max - min;
        const percent = ((value - min) / range);

        // Slider track length is 300px (defined in CSS: .vertical-slider width)
        const trackLength = 300; 
        
        // Calculate the vertical position: 
        // 1. We use (1 - percent) because the slider is rotated 270deg, meaning the top of the track (0%) 
        //    is at the bottom of the visible vertical track, and max (100%) is at the top.
        // 2. We are measuring the distance from the top of the 300px vertical track.
        const topPosition = (1 - percent) * trackLength;

        // Apply the calculated position to the Y-axis (top property)
        valueDisplay.style.top = `${topPosition}px`;
        
        // Update the displayed text
        if (slider.id === 'heightSlider') {
            valueDisplay.textContent = `${value} cm`;
        } else if (slider.id === 'weightSlider') {
            valueDisplay.textContent = `${value} kg`;
        }
    }

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        currentSlide = index;
        updateNavigation();
        
        // Initial positioning for the active slider when the slide is shown
        if (currentSlide === 1) {
            // Delay running the position update slightly to ensure the slider element is fully rendered/active
            setTimeout(() => updateBubblePosition(heightSlider, heightValueDisplay), 0);
        } else if (currentSlide === 2) {
            setTimeout(() => updateBubblePosition(weightSlider, weightValueDisplay), 0);
        }
    }

    function updateNavigation() {
        prevButton.disabled = currentSlide === 0;
        nextButton.textContent = currentSlide === slides.length - 1 ? '✓' : '→';
        progressIndicator.textContent = `${currentSlide + 1}/${slides.length}`;
    }

    // --- Event Listeners ---
    prevButton.addEventListener('click', () => {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) {
            showSlide(currentSlide + 1);
        } else {
            // "Finish" action: Save data, mark onboarding complete, and redirect
            console.log('Onboarding complete!');
            localStorage.setItem('ou_di_onboarding_complete', 'true');
            window.location.href = 'dashboard.html';
        }
    });

    // Update slider values and bubble positions on input
    if (heightSlider) {
        heightSlider.addEventListener('input', () => updateBubblePosition(heightSlider, heightValueDisplay));
        heightSlider.addEventListener('change', () => updateBubblePosition(heightSlider, heightValueDisplay));
    }

    if (weightSlider) {
        weightSlider.addEventListener('input', () => updateBubblePosition(weightSlider, weightValueDisplay));
        weightSlider.addEventListener('change', () => updateBubblePosition(weightSlider, weightValueDisplay));
    }

    // Handle "Other" checkbox and input
    if (otherStyleCheckbox && otherStyleInput) {
        otherStyleCheckbox.addEventListener('change', function() {
            otherStyleInput.disabled = !this.checked;
            if (!this.checked) {
                otherStyleInput.value = '';
            }
        });
    }

    // Initialize the first slide
    showSlide(0);
});
