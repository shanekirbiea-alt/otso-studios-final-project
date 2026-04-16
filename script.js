// 1. FAIL-SAFE PRELOADER LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const body = document.body;

    const removeLoader = () => {
        if (loader && !loader.classList.contains('loaded')) {
            loader.classList.add('loaded');
            body.classList.remove('loading');
        }
    };

    
  setTimeout(removeLoader, 2500);

    window.addEventListener('load', removeLoader);
});

// 2. SMOOTH SCROLLING
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// 3. FAQ ACCORDION BEHAVIOR
const details = document.querySelectorAll("details");
details.forEach((targetDetail) => {
    targetDetail.addEventListener("click", () => {
        details.forEach((detail) => {
            if (detail !== targetDetail) {
                detail.removeAttribute("open");
            }
        });
    });
});

// 4. DATABASE: BOOKING INQUIRIES
document.getElementById('bookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const { addDoc, collection, serverTimestamp } = window.dbFunctions;

    const inquiryData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        date: document.getElementById('eventDate').value,
        type: document.getElementById('eventType').value,
        message: document.getElementById('message').value,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(window.db, "inquiries"), inquiryData);
        alert(`Thank you, ${inquiryData.name}! Your inquiry has been saved.`);
        this.reset();
    } catch (error) {
        console.error("Database Error:", error);
        alert("Failed to save inquiry.");
    }
});

// 5. DATABASE: REAL-TIME REVIEWS
const initReviews = () => {
    const display = document.getElementById('reviewsDisplay');
    if (!display) return;

    // We pull the tools from the window object where the Firebase script put them
    const { collection, onSnapshot, query, orderBy } = window.dbFunctions;
    
    // Create the query to get reviews sorted by newest first
    const q = query(collection(window.db, "reviews"), orderBy("timestamp", "desc"));

    // This listener stays active and updates the page instantly when a new review is added
    onSnapshot(q, (querySnapshot) => {
        display.innerHTML = ""; // Clear the grid before rebuilding it
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const ratingValue = data.rating || 0;
            
            // Logic to draw the stars based on the number selected
            const stars = '★'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue);
            
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="stars">${stars}</div>
                <p>"${data.text || ''}"</p>
                <cite>— ${data.name || 'Anonymous'}</cite>
            `;
            display.appendChild(reviewCard);
        });
    }, (error) => {
        console.error("Firebase Listener Error:", error);
    });
};

// CRITICAL FIX: This waits for the Firebase Module to load before running initReviews
const checkDB = setInterval(() => {
    if (window.db && window.dbFunctions) {
        initReviews();
        clearInterval(checkDB);
        console.log("Firebase connected: Reviews initialized.");
    }
}, 100);

// Review Form Submission Logic
document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const { addDoc, collection, serverTimestamp } = window.dbFunctions;

    const reviewData = {
        name: document.getElementById('reviewerName').value,
        rating: parseInt(document.getElementById('rating').value),
        text: document.getElementById('reviewText').value,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(window.db, "reviews"), reviewData);
        alert("Thank you for your feedback!");
        this.reset();
    } catch (error) {
        console.error("Error adding review:", error);
        alert("Failed to post review. Please try again.");
    }
});

initReviews();
