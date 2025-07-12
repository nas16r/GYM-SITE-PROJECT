// Configuration file for FitZone Gym Website

// Supabase configuration
const CONFIG = {
    SUPABASE_URL: 'https://mdmkmeegwzwqgjvucgtf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWttZWVnd3p3cWdqdnVjZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjcyMDYsImV4cCI6MjA2Njc0MzIwNn0.pe_FoXfPasLLpAPH3MpiOlEcUMJ_JMQupi12unOekio',
    
    // Gym plans configuration
    PLANS: {
        basic: {
            name: 'BASIC',
            price: 'RS 2,500',
            features: [
                'Gym Access (6 AM - 10 PM)',
                'Basic Equipment Usage',
                'Locker Facility',
                'Free WiFi'
            ],
            image: '🏋️‍♂️'
        },
        regular: {
            name: 'REGULAR',
            price: 'RS 5,000',
            features: [
                '24/7 Gym Access',
                'All Equipment Access',
                'Locker + Towel Service',
                '2 Group Classes/Week',
                'Basic Nutrition Guide'
            ],
            image: '💪'
        },
        premium: {
            name: 'PREMIUM',
            price: 'RS 8,500',
            features: [
                '24/7 VIP Access',
                'All Premium Equipment',
                'Private Locker + Amenities',
                'Unlimited Group Classes',
                '4 Personal Training Sessions',
                'Custom Nutrition Plan'
            ],
            image: '👑'
        }
    },
    
    // BMI categories
    BMI_CATEGORIES: {
        UNDERWEIGHT: { min: 0, max: 18.5, label: 'Underweight', color: 'text-blue-400' },
        NORMAL: { min: 18.5, max: 25, label: 'Normal', color: 'text-green-400' },
        OVERWEIGHT: { min: 25, max: 30, label: 'Overweight', color: 'text-yellow-400' },
        OBESE: { min: 30, max: 100, label: 'Obese', color: 'text-red-400' }
    },
    
    // Application settings
    SETTINGS: {
        MAX_BMI_HISTORY: 5,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        NOTIFICATION_DURATION: 3000, // 3 seconds
        ANIMATION_DURATION: 300 // 300ms
    }
};

// Initialize Supabase client
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}