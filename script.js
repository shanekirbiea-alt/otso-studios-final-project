/**
 * OTSO STUDIOS - PRODUCTION-READY CORE SCRIPT
 * Firebase Firestore Integration + Smooth Interactions
 * Fail-safe error handling & performance optimized
 */

class OtsoStudiosApp {
    constructor() {
        this.loader = null;
        this.body = document.body;
        this.reviewsDisplay = document.getElementById('reviewsDisplay');
        this.init();
    }

    init() {
        this.setupPreloader();
        this.setupSmoothScroll();
        this.setupFAQ();
        this.waitForFirebase().then(() => {
            this.setupForms();
            this.initReviews();
        }).catch(error => {
            console.error('Firebase failed to initialize:', error);
        });
    }

    // 1. FAIL-SAFE PRELOADER (2000ms minimum, respects network)
    setupPreloader() {
        this.loader = document.getElementById('loader');
        
        const removeLoader = () => {
            if (this.loader && !this.loader.classList.contains('loaded')) {
                this.loader.classList.add('loaded');
                this.body.classList.remove('loading');
                document.documentElement.style.scrollBehavior = 'smooth';
            }
        };

        // Minimum 2s display + network complete
        const minLoadTime = 2000;
        const startTime = Date.now();
        
        window.addEventListener('load', () => {
            const elapsed = Date.now() - startTime;
            const delay = Math.max(0, minLoadTime - elapsed);
            setTimeout(removeLoader, delay);
        });

        // Failsafe timeout
        setTimeout(removeLoader, minLoadTime + 1000);
    }

    // 2. SMOOTH SCROLLING FOR ALL ANCHOR LINKS
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    const navbarHeight = 80;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 3. FIXED FAQ ACCORDION (No conflicts, works perfectly)
setupFAQ() {
    // Remove any existing listeners first
    document.querySelectorAll('details').forEach(detail => {
        detail.removeEventListener('toggle', this.handleFAQToggle);
    });
    
    const details = document.querySelectorAll('details');
    
    details.forEach(detail => {
        detail.addEventListener('toggle', this.handleFAQToggle);
    });
}

handleFAQToggle = (event) => {
    const detail = event.target;
    
    // Close all other details
    document.querySelectorAll('details').forEach(otherDetail => {
        if (otherDetail !== detail && otherDetail.open) {
            otherDetail.open = false;
        }
    });
}

    // 4. WAIT FOR FIREBASE (Robust initialization)
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10s timeout
            const startTime = Date.now();
            
            const checkFirebase = () => {
                if (window.db && window.dbFunctions) {
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Firebase timeout'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
        });
    }

    // 5. FORM HANDLERS WITH VALIDATION & FEEDBACK
    setupForms() {
        this.setupBookingForm();
        this.setupReviewForm();
    }

    setupBookingForm() {
        const form = document.getElementById('bookingForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = this.getFormData({
                name: 'name',
                email: 'email',
                date: 'eventDate',
                type: 'eventType',
                message: 'message'
            });

            if (!this.validateBookingForm(formData)) return;

            try {
                await this.saveToFirestore('inquiries', formData);
                this.showSuccess('Thank you! Your inquiry has been received.', form);
                form.reset();
            } catch (error) {
                console.error('Booking error:', error);
                this.showError('Failed to send inquiry. Please try again.');
            }
        });
    }

    setupReviewForm() {
        const form = document.getElementById('reviewForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = this.getFormData({
                name: 'reviewerName',
                rating: 'rating',
                text: 'reviewText'
            });

            if (!this.validateReviewForm(formData)) return;

            try {
                await this.saveToFirestore('reviews', formData);
                this.showSuccess('Thank you! Your review is now live.', form);
                form.reset();
            } catch (error) {
                console.error('Review error:', error);
                this.showError('Failed to post review. Please try again.');
            }
        });
    }

    // 6. FORM DATA HELPER
    getFormData(fields) {
        const data = {};
        Object.entries(fields).forEach(([key, id]) => {
            const element = document.getElementById(id);
            data[key] = element ? element.value.trim() : '';
        });
        data.timestamp = window.dbFunctions.serverTimestamp();
        return data;
    }

    // 7. FORM VALIDATION
    validateBookingForm(data) {
        if (!data.name || !data.email || !data.date || !data.type) {
            this.showError('Please fill in all required fields.');
            return false;
        }
        if (!this.isValidEmail(data.email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }
        return true;
    }

    validateReviewForm(data) {
        if (!data.name || !data.text || data.rating === '') {
            this.showError('Name, rating, and review text are required.');
            return false;
        }
        return true;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // 8. FIRESTORE SAVE HELPER
    async saveToFirestore(collectionName, data) {
        const { addDoc, collection } = window.dbFunctions;
        const colRef = collection(window.db, collectionName);
        await addDoc(colRef, data);
    }

    // 9. REAL-TIME REVIEWS SYSTEM
    initReviews() {
        if (!this.reviewsDisplay || !window.db || !window.dbFunctions.onSnapshot) {
            console.warn('Reviews init failed: Missing elements or Firebase');
            return;
        }

        const { collection, onSnapshot } = window.dbFunctions;
        const colRef = collection(window.db, 'reviews');

        // Unsubscribe function for cleanup
        let unsubscribe = null;

        unsubscribe = onSnapshot(colRef, (snapshot) => {
            console.log('🔥 Reviews snapshot received:', snapshot.size, 'reviews');
            this.renderReviews(snapshot);
        }, (error) => {
            console.error('❌ Reviews listener error:', error);
            this.reviewsDisplay.innerHTML = `
                <div class="review-card" style="text-align: center; color: #999;">
                    <p>Reviews temporarily unavailable</p>
                </div>
            `;
        });

        // Store unsubscribe for cleanup
        window.reviewsUnsubscribe = unsubscribe;
    }

    renderReviews(snapshot) {
        const reviews = [];
        
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp (newest first), handle null timestamps gracefully
        reviews.sort((a, b) => {
            const timeA = a.timestamp?.toMillis?.() || 0;
            const timeB = b.timestamp?.toMillis?.() || 0;
            return timeB - timeA;
        });

        this.reviewsDisplay.innerHTML = '';

        reviews.slice(0, 12).forEach((review, index) => { // Limit to 12 most recent
            const stars = this.generateStars(review.rating || 0);
            const card = this.createReviewCard(stars, review.text, review.name, index);
            this.reviewsDisplay.appendChild(card);
        });

        // Animate new cards
        this.animateReviewCards();
    }

    generateStars(rating) {
        const filled = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? '½' : '';
        return '★'.repeat(filled) + half + '☆'.repeat(5 - filled - (half ? 1 : 0));
    }

    createReviewCard(stars, text, name, delay = 0) {
        const card = document.createElement('div');
        card.className = 'review-card fade-in-up';
        card.style.animationDelay = `${delay * 0.1}s`;
        
        card.innerHTML = `
            <div class="stars">${stars}</div>
            <p>"${this.escapeHtml(text || 'Great experience!')}"</p>
            <cite>— ${this.escapeHtml(name || 'Anonymous').toUpperCase()}</cite>
        `;
        return card;
    }

    // 10. UI FEEDBACK HELPERS
    showSuccess(message, form = null) {
        const successMsg = this.createToast('✅ ' + message, 'success');
        document.body.appendChild(successMsg);
        
        if (form) {
            form.querySelector('button[type="submit"]').textContent = 'Sent!';
            setTimeout(() => {
                form.querySelector('button[type="submit"]').textContent = 'Submit Inquiry';
            }, 2000);
        }
    }

    showError(message) {
        const errorMsg = this.createToast('❌ ' + message, 'error');
        document.body.appendChild(errorMsg);
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            padding: 1rem 1.5rem; border-radius: 8px; 
            color: white; font-weight: 600; z-index: 10000;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transform: translateX(400px); opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
        
        return toast;
    }

    // 11. SECURITY & PERFORMANCE
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    animateReviewCards() {
        const cards = this.reviewsDisplay.querySelectorAll('.review-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    // 12. CLEANUP ON PAGE UNLOAD
    destroy() {
        if (window.reviewsUnsubscribe) {
            window.reviewsUnsubscribe();
        }
    }
}

// 13. INITIALIZE APP WHEN DOM READY
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new OtsoStudiosApp());
} else {
    new OtsoStudiosApp();
}

// 14. CLEANUP ON PAGE UNLOAD
window.addEventListener('beforeunload', () => {
    if (window.otsoApp) {
        window.otsoApp.destroy();
    }
});
