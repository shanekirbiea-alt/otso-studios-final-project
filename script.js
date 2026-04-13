/** * OTSO STUDIOS - CORE SCRIPT
 * Integrated with Firebase Firestore & Fail-Safe Preloader
 */

// 1. FAIL-SAFE PRELOADER LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const body = document.body;

    // Function to remove loader
    const removeLoader = () => {
        if (loader && !loader.classList.contains('loaded')) {
            loader.classList.add('loaded');
            body.classList.remove('loading');
        }
    };

    // Trigger 1: Force remove after 2.5 seconds (The Cinematic Timing)
    setTimeout(removeLoader, 2500);

    // Trigger 2: If the whole page happens to finish earlier, allow it to clear
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

// 5. DATABASE: REAL-TIME REVIEWS (REPAIRED)
document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Check if Firebase is actually ready
    if (!window.dbFunctions || !window.db) {
        console.error("Firebase not initialized yet!");
        return;
    }

    const { addDoc, collection, serverTimestamp } = window.dbFunctions;

    const reviewData = {
        name: document.getElementById('reviewerName').value,
        rating: parseInt(document.getElementById('rating').value),
        text: document.getElementById('reviewText').value,
        timestamp: serverTimestamp()
    };

    try {
        console.log("Sending to Firebase...");
        const docRef = await addDoc(collection(window.db, "reviews"), reviewData);
        
        if (docRef.id) {
            console.log("Success! ID:", docRef.id);
            alert("Thank you for your feedback! Your review is now live.");
            this.reset();
        }
    } catch (error) {
        console.error("Error adding review:", error);
        alert("Something went wrong. Please try again!");
    }
});
const initReviews = () => {
    const display = document.getElementById('reviewsDisplay');
    if (!display) return;
    const { collection, onSnapshot, query, orderBy } = window.dbFunctions;
    const q = query(collection(window.db, "reviews"), orderBy("timestamp", "desc"));

onSnapshot(q, (querySnapshot) => {
    // This includesMetadataChanges allows it to show up locally 
    // before the server even finishes the timestamp!
    display.innerHTML = ""; 
    querySnapshot.forEach((doc) => {
        // ... rest of your code ...
    });
}, { includeMetadataChanges: true });
    
    onSnapshot(q, (querySnapshot) => {
        display.innerHTML = ""; 
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const ratingValue = data.rating || 0;
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
        console.error("Listener failed:", error);
    });
};

initReviews();
