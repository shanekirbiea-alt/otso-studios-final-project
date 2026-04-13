/** * OTSO STUDIOS - CORE SCRIPT
 * Integrated with Firebase Firestore & Fail-Safe Preloader
 */

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

// 5. DATABASE: REAL-TIME REVIEWS (UPGRADED)
document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
        const docRef = await addDoc(collection(window.db, "reviews"), reviewData);
        if (docRef.id) {
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

    const { collection, onSnapshot } = window.dbFunctions;
    
    // 1. SIMPLE COLLECTION REFERENCE
    // Removing 'query' and 'orderBy' here stops Firebase from crashing if an index isn't set up.
    const colRef = collection(window.db, "reviews");

    onSnapshot(colRef, (querySnapshot) => {
        console.log("Data received from Firebase!"); // Check your F12 console for this
        display.innerHTML = ""; 

        // 2. CONVERT TO ARRAY
        const reviewsArray = [];
        querySnapshot.forEach((doc) => {
            reviewsArray.push({ id: doc.id, ...doc.data() });
        });

        // 3. MANUAL SORT (Newest First)
        // This handles the "null" timestamp issue that happens right when you click post.
        reviewsArray.sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || Date.now();
            const timeB = b.timestamp?.toMillis() || Date.now();
            return timeB - timeA;
        });

        // 4. RENDER TO PAGE
        reviewsArray.forEach((data) => {
            const ratingValue = data.rating || 0;
            const stars = '★'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue);
            
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="stars">${stars}</div>
                <p>"${data.text || ''}"</p>
                <cite>— ${data.name ? data.name.toUpperCase() : 'ANONYMOUS'}</cite>
            `;
            display.appendChild(reviewCard);
        });
    }, (error) => {
        // This will tell us EXACTLY why it's failing
        console.error("Firebase Listener Error:", error);
        alert("Display Error: Check console (F12) for details.");
    });
};

initReviews();
