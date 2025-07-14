// Main JavaScript file for FitZone Gym Website

// Global variables
let currentUser = null;
let selectedPlan = null;
let userPlan = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for existing session
    checkExistingSession();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize UI
    updateUIForLoggedOutUser();
}

function checkExistingSession() {
    const savedUser = localStorage.getItem('fitzone_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            userPlan = currentUser.current_plan;
            updateUIForLoggedInUser();
            showUserDashboard();
            loadUserBMIHistory();
        } catch (error) {
            console.error('Error loading saved session:', error);
            localStorage.removeItem('fitzone_user');
        }
    }
}

function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('fixed') && event.target.classList.contains('inset-0')) {
            hideAllModals();
        }
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideAllModals();
        }
    });
}

function hideAllModals() {
    hideLogin();
    hideSignup();
    hidePlanModal();
}

// Authentication functions
function showLogin() {
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('login-email').focus();
}

function hideLogin() {
    document.getElementById('login-modal').classList.add('hidden');
    clearLoginForm();
}

function showSignup() {
    document.getElementById('signup-modal').classList.remove('hidden');
    document.getElementById('signup-name').focus();
}

function hideSignup() {
    document.getElementById('signup-modal').classList.add('hidden');
    clearSignupForm();
}

function clearLoginForm() {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

function clearSignupForm() {
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
}

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    showLoading('Logging in...');
    
    try {
        // Check if user exists in database
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !userData) {
            hideLoading();
            showNotification('User not found. Please sign up first.', 'error');
            setTimeout(() => {
                hideLogin();
                showSignup();
            }, 2000);
            return;
        }
        
        // Simple password validation (in production, use proper hashing)
        if (userData.password !== password) {
            hideLoading();
            showNotification('Invalid password. Please try again.', 'error');
            return;
        }
        
        currentUser = userData;
        userPlan = userData.current_plan;
        
        // Save session
        localStorage.setItem('fitzone_user', JSON.stringify(currentUser));
        
        hideLoading();
        hideLogin();
        updateUIForLoggedInUser();
        showUserDashboard();
        await loadUserBMIHistory();
        
        showNotification(`Welcome back, ${currentUser.name}!`, 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function signup(event) {
    event.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    if (!name || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    showLoading('Creating account...');
    
    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            hideLoading();
            showNotification('User already exists. Please login instead.', 'error');
            setTimeout(() => {
                hideSignup();
                showLogin();
            }, 2000);
            return;
        }
        
        // Create new user
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    email: email,
                    name: name,
                    password: password,
                    current_plan: null,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        currentUser = data;
        userPlan = null;
        
        // Save session
        localStorage.setItem('fitzone_user', JSON.stringify(currentUser));
        
        hideLoading();
        hideSignup();
        updateUIForLoggedInUser();
        showUserDashboard();
        
        showNotification('Account created successfully! Welcome to FitZone!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Signup error:', error);
        showNotification('Signup failed. Please try again.', 'error');
    }
}

function logout() {
    currentUser = null;
    userPlan = null;
    localStorage.removeItem('fitzone_user');
    updateUIForLoggedOutUser();
    hideUserDashboard();
    showNotification('Logged out successfully', 'info');
}

function updateUIForLoggedInUser() {
    document.getElementById('auth-buttons').classList.add('hidden');
    document.getElementById('user-menu').classList.remove('hidden');
    document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}!`;
}

function updateUIForLoggedOutUser() {
    document.getElementById('auth-buttons').classList.remove('hidden');
    document.getElementById('user-menu').classList.add('hidden');
}

function showUserDashboard() {
    // Hide main sections
    document.getElementById('home').style.display = 'none';
    document.getElementById('about').style.display = 'none';
    document.getElementById('pricing').style.display = 'none';
    document.getElementById('bmi').style.display = 'none';
    
    // Show dashboard
    document.getElementById('user-dashboard').classList.remove('hidden');
    updateCurrentPlanDisplay();
}

function hideUserDashboard() {
    // Show main sections
    document.getElementById('home').style.display = 'block';
    document.getElementById('about').style.display = 'block';
    document.getElementById('pricing').style.display = 'block';
    document.getElementById('bmi').style.display = 'block';
    
    // Hide dashboard
    document.getElementById('user-dashboard').classList.add('hidden');
}

// Plan selection and purchase
function selectPlan(plan) {
    if (!currentUser) {
        showNotification('Please login to purchase a plan', 'info');
        showLogin();
        return;
    }
    
    selectedPlan = plan;
    showPlanConfirmation(plan);
}

function showPlanConfirmation(plan) {
    const planData = CONFIG.PLANS[plan];
    const detailsHTML = `
        <div class="text-center mb-6">
            <div class="text-6xl mb-4">${planData.image}</div>
            <h3 class="text-2xl font-bold text-orange-500">${planData.name} PLAN</h3>
            <div class="text-3xl font-bold mt-2">${planData.price}/month</div>
        </div>
        <div class="text-left">
            <h4 class="font-semibold mb-3">Plan Includes:</h4>
            <ul class="space-y-2">
                ${planData.features.map(feature => `<li class="flex items-center"><span class="text-green-500 mr-2">✓</span>${feature}</li>`).join('')}
            </ul>
        </div>
    `;
    
    document.getElementById('plan-details').innerHTML = detailsHTML;
    document.getElementById('plan-modal').classList.remove('hidden');
}

function hidePlanModal() {
    document.getElementById('plan-modal').classList.add('hidden');
}

async function confirmPurchase() {
    showLoading('Processing purchase...');
    
    try {
        // Update user's plan in database
        const { error } = await supabase
            .from('users')
            .update({ 
                current_plan: selectedPlan,
                plan_start_date: new Date().toISOString()
            })
            .eq('email', currentUser.email);
        
        if (error) {
            throw error;
        }
        
        userPlan = selectedPlan;
        currentUser.current_plan = selectedPlan;
        
        // Update saved session
        localStorage.setItem('fitzone_user', JSON.stringify(currentUser));
        
        hideLoading();
        hidePlanModal();
        
        // Show success message
        showNotification(`Congratulations! You have successfully purchased the ${selectedPlan.toUpperCase()} plan. Welcome to FitZone!`, 'success');
        
        updateCurrentPlanDisplay();
        
    } catch (error) {
        hideLoading();
        console.error('Plan purchase error:', error);
        showNotification('Failed to purchase plan. Please try again.', 'error');
    }
}

function updateCurrentPlanDisplay() {
    const currentPlanDiv = document.getElementById('current-plan');
    
    if (!userPlan) {
        currentPlanDiv.innerHTML = '<p class="text-blue-400">No active plan. Choose a plan to get started!</p>';
        return;
    }

    const planData = CONFIG.PLANS[userPlan];
    currentPlanDiv.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 flex items-center justify-between">
            <div class="flex items-center">
                <div class="text-4xl mr-4">${planData.image}</div>
                <div>
                    <h4 class="text-xl font-bold text-orange-500">${planData.name} PLAN</h4>
                    <p class="text-gray-300">${planData.price}/month</p>
                    <p class="text-sm text-green-500">Active</p>
                </div>
            </div>
            <button onclick="cancelPlan()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                Cancel Plan
            </button>
        </div>
    `;
}

async function cancelPlan() {
    if (!confirm('Are you sure you want to cancel your current plan?')) {
        return;
    }
    
    showLoading('Cancelling plan...');
    
    try {
        // Update user's plan in database
        const { error } = await supabase
            .from('users')
            .update({ 
                current_plan: null,
                plan_start_date: null
            })
            .eq('email', currentUser.email);
        
        if (error) {
            throw error;
        }
        
        userPlan = null;
        currentUser.current_plan = null;
        
        // Update saved session
        localStorage.setItem('fitzone_user', JSON.stringify(currentUser));
        
        hideLoading();
        updateCurrentPlanDisplay();
        showNotification('Your plan has been cancelled successfully.', 'info');
        
    } catch (error) {
        hideLoading();
        console.error('Plan cancellation error:', error);
        showNotification('Failed to cancel plan. Please try again.', 'error');
    }
}

// BMI Calculator functions
async function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    
    if (!height || !weight || height <= 0 || weight <= 0) {
        showNotification('Please enter valid height and weight values', 'error');
        return;
    }
    
    const bmi = weight / ((height / 100) ** 2);
    const category = getBMICategory(bmi);
    
    document.getElementById('bmi-result').innerHTML = `
        <div class="text-center">
            <div class="text-3xl font-bold text-orange-500 mb-2">${bmi.toFixed(1)}</div>
            <div class="text-lg font-semibold ${getCategoryColor(category)}">${category}</div>
            <p class="text-sm text-gray-400 mt-2">Your BMI indicates you are ${category.toLowerCase()}</p>
        </div>
    `;
    
    // Save BMI data if user is logged in
    if (currentUser) {
        await saveBMIRecord(height, weight, bmi, category);
        showNotification('BMI calculated and saved to your history', 'success');
    }
}

async function calculateDashboardBMI() {
    const height = parseFloat(document.getElementById('dashboard-height').value);
    const weight = parseFloat(document.getElementById('dashboard-weight').value);
    
    if (!height || !weight || height <= 0 || weight <= 0) {
        showNotification('Please enter valid height and weight values', 'error');
        return;
    }
    
    const bmi = weight / ((height / 100) ** 2);
    const category = getBMICategory(bmi);
    
    document.getElementById('dashboard-bmi-result').innerHTML = `
        <div class="text-center">
            <div class="text-3xl font-bold text-orange-500 mb-2">${bmi.toFixed(1)}</div>
            <div class="text-lg font-semibold ${getCategoryColor(category)}">${category}</div>
            <p class="text-sm text-gray-400 mt-2">Your BMI indicates you are ${category.toLowerCase()}</p>
        </div>
    `;
    
    // Save BMI data
    await saveBMIRecord(height, weight, bmi, category);
    await loadUserBMIHistory();
    showNotification('BMI calculated and saved to your history', 'success');
}

function getBMICategory(bmi) {
    for (const [key, category] of Object.entries(CONFIG.BMI_CATEGORIES)) {
        if (bmi >= category.min && bmi < category.max) {
            return category.label;
        }
    }
    return 'Unknown';
}

function getCategoryColor(category) {
    for (const [key, categoryData] of Object.entries(CONFIG.BMI_CATEGORIES)) {
        if (categoryData.label === category) {
            return categoryData.color;
        }
    }
    return 'text-gray-400';
}

// BMI Database functions
async function saveBMIRecord(height, weight, bmi, category) {
    try {
        const { error } = await supabase
            .from('bmi_records')
            .insert([
                {
                    user_email: currentUser.email,
                    height: height,
                    weight: weight,
                    bmi: parseFloat(bmi.toFixed(1)),
                    category: category,
                    recorded_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            throw error;
        }
        
    } catch (error) {
        console.error('Error saving BMI record:', error);
    }
}

async function loadUserBMIHistory() {
    try {
        const { data, error } = await supabase
            .from('bmi_records')
            .select('*')
            .eq('user_email', currentUser.email)
            .order('recorded_at', { ascending: false })
            .limit(CONFIG.SETTINGS.MAX_BMI_HISTORY);
        
        if (error) {
            throw error;
        }
        
        displayBMIHistory(data);
        
    } catch (error) {
        console.error('Error loading BMI history:', error);
        document.getElementById('bmi-history').innerHTML = '<p class="text-red-400">Failed to load BMI history</p>';
    }
}

function displayBMIHistory(records) {
    const historyContainer = document.getElementById('bmi-history');
    if (!historyContainer) return;
    
    if (!records || records.length === 0) {
        historyContainer.innerHTML = '<p class="text-gray-400">No BMI records yet. Calculate your BMI to start tracking!</p>';
        return;
    }
    
    const historyHTML = records.map(record => {
        const date = new Date(record.recorded_at).toLocaleDateString();
        const time = new Date(record.recorded_at).toLocaleTimeString();
        return `
            <div class="bg-gray-700 rounded-lg p-4 flex justify-between items-center hover:bg-gray-600 transition-colors">
                <div>
                    <div class="text-lg font-semibold text-orange-500">${record.bmi}</div>
                    <div class="text-sm text-gray-400">${date} at ${time}</div>
                </div>
                <div class="text-right">
                    <div class="text-sm ${getCategoryColor(record.category)}">${record.category}</div>
                    <div class="text-xs text-gray-500">${record.height}cm, ${record.weight}kg</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyContainer.innerHTML = historyHTML;
}

// Navigation function for main website sections
function navigateToSection(sectionId) {
    if (currentUser) {
        // Map guest sections to their dashboard counterparts
        const dashboardMap = {
            home: 'home',
            bmi: 'bmi',
            pricing: 'plan', // dashboard-plan not dashboard-pricing
            about: 'home'    // no dashboard-about, fallback to home
        };

        const mappedId = dashboardMap[sectionId];

        const dashboardSection = document.getElementById(`dashboard-${mappedId}`);
        if (dashboardSection) {
            showUserDashboard();
            dashboardSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }

    // Not logged in OR no dashboard section
    hideUserDashboard();
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.warn(`Section with ID '${sectionId}' not found.`);
    }
}



// New navigation function for sections within the user dashboard
function navigateToDashboardSection(dashboardSectionId) {
    // Ensure the user dashboard is visible and main sections are hidden.
    showUserDashboard(); 

    const targetElement = document.getElementById(`dashboard-${dashboardSectionId}`);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.warn(`Dashboard section with ID 'dashboard-${dashboardSectionId}' not found.`);
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, CONFIG.SETTINGS.NOTIFICATION_DURATION);
}

function showLoading(message = 'Loading...') {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center';
    loadingOverlay.innerHTML = `
        <div class="bg-gray-800 rounded-2xl p-8 text-center">
            <div class="spinner"></div>
            <p class="text-white">${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
window.signup = signup;
window.login = login;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.hideLogin = hideLogin;
window.hideSignup = hideSignup;
window.validatePasswordLength = validatePasswordLength;
