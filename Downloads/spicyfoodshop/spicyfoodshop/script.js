// SpicyFoodShop - menu data
const foodData = [
    { id: 1,  name: "Margherita Pizza",         price: 299, category: "pizza",    image: "img/food/p1.jpg",            description: "Classic pizza with tomato sauce, mozzarella, and basil" },
    { id: 2,  name: "Pepperoni Pizza",          price: 349, category: "pizza",    image: "img/food/p1.jpg",            description: "Pizza topped with pepperoni and mozzarella cheese" },
    { id: 3,  name: "Cheeseburger",             price: 199, category: "burger",   image: "img/food/b1.jpg",            description: "Juicy beef burger with cheese, lettuce, and tomato" },
    { id: 4,  name: "Chicken Burger",           price: 229, category: "burger",   image: "img/category/burger.jpg",    description: "Grilled chicken breast with special sauce" },
    { id: 5,  name: "Club Sandwich",            price: 179, category: "sandwich", image: "img/food/s1.jpg",            description: "Triple-decker sandwich with turkey, bacon, and vegetables" },
    { id: 6,  name: "Veggie Sandwich",          price: 149, category: "sandwich", image: "img/category/sandwich.jpg",  description: "Fresh vegetables with hummus and sprouts" },
    { id: 7,  name: "BBQ Chicken Pizza",        price: 379, category: "pizza",    image: "img/food/p1.jpg",            description: "Smoky BBQ sauce, grilled chicken, red onion, and mozzarella" },
    { id: 8,  name: "Veggie Supreme Pizza",     price: 329, category: "pizza",    image: "img/food/p1.jpg",            description: "Bell peppers, olives, mushrooms, onions, and fresh tomatoes" },
    { id: 9,  name: "Bacon Double Burger",      price: 299, category: "burger",   image: "img/category/burger.jpg",    description: "Two beef patties with crispy bacon, cheddar, and smoky sauce" },
    { id: 10, name: "Veggie Burger",            price: 179, category: "burger",   image: "img/food/b1.jpg",            description: "Crispy vegetable patty with lettuce, tomato, and garlic mayo" },
    { id: 11, name: "Grilled Chicken Sandwich", price: 199, category: "sandwich", image: "img/category/sandwich.jpg",  description: "Grilled chicken, avocado, lettuce, and honey mustard on toasted bread" },
    { id: 12, name: "Paneer Tikka Sandwich",    price: 169, category: "sandwich", image: "img/food/s1.jpg",            description: "Spiced paneer tikka with onions, peppers, and mint chutney" }
];

// Dishes shown on the home page (one per category)
const featuredIds = [1, 3, 5];

let cart = [];
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function formatRupees(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ---------- Storage ---------- */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem('cart'));
        cart = Array.isArray(saved) ? saved : [];
    } catch (e) {
        cart = [];
    }
}

/* ---------- Food cards ---------- */
function foodCardHtml(food) {
    return `
        <img src="${food.image}" alt="${escapeHtml(food.name)}">
        <div class="food-info">
            <h3>${escapeHtml(food.name)}</h3>
            <p>${escapeHtml(food.description)}</p>
            <div class="food-buy">
                <span class="price">${formatRupees(food.price)}</span>
                <button class="add-to-cart" data-id="${food.id}" aria-label="Add ${escapeHtml(food.name)} to cart">Add to cart</button>
            </div>
        </div>`;
}

function renderFoods(container, foods) {
    container.innerHTML = '';
    foods.forEach(food => {
        const card = document.createElement('div');
        card.className = 'food-card';
        card.innerHTML = foodCardHtml(food);
        container.appendChild(card);
    });
    container.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => addToCart(parseInt(button.dataset.id, 10)));
    });
}

function displayFeaturedFoods() {
    const featured = $('featuredFoods');
    if (!featured) return;
    renderFoods(featured, featuredIds.map(id => foodData.find(f => f.id === id)).filter(Boolean));
}

function displayMenuFoods(category = 'all') {
    const menu = $('menuFoods');
    if (!menu) return;
    const foods = category === 'all' ? foodData : foodData.filter(f => f.category === category);
    renderFoods(menu, foods);
}

function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    if (!buttons.length) return;

    const select = (category) => {
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));
        displayMenuFoods(category);
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            select(button.dataset.category);
            history.replaceState(null, '', button.dataset.category === 'all' ? 'menu.html' : '#' + button.dataset.category);
        });
    });

    // Support links like menu.html#pizza
    const hash = window.location.hash.replace('#', '');
    const valid = Array.from(buttons).some(b => b.dataset.category === hash);
    select(valid ? hash : 'all');
}

/* ---------- Cart ---------- */
function showToast(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function addToCart(foodId) {
    const food = foodData.find(item => item.id === foodId);
    if (!food) return;

    const existing = cart.find(item => item.id === foodId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: food.id, name: food.name, price: food.price, image: food.image, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    showToast(`${food.name} added to cart`);
}

function removeFromCart(foodId) {
    cart = cart.filter(item => item.id !== foodId);
    saveCart();
    updateCartUI();
}

function updateQuantity(foodId, change) {
    const item = cart.find(i => i.id === foodId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(foodId);
    } else {
        saveCart();
        updateCartUI();
    }
}

function cartTotalValue() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartUI() {
    const count = document.querySelector('.cart-count');
    const items = $('cartItems');
    const total = $('cartTotal');

    count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        items.innerHTML = '<p class="empty-cart-message">Your cart is empty. Add a dish from the menu to get started.</p>';
        total.textContent = '0';
        return;
    }

    items.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <p class="item-price">${formatRupees(item.price)} each</p>
            </div>
            <p class="item-total">${formatRupees(item.price * item.quantity)}</p>
            <div class="item-quantity">
                <button class="quantity-btn minus" data-id="${item.id}" aria-label="Decrease quantity of ${escapeHtml(item.name)}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}" aria-label="Increase quantity of ${escapeHtml(item.name)}">+</button>
            </div>
            <button class="remove-item" data-id="${item.id}">Remove</button>`;
        items.appendChild(row);
    });

    total.textContent = cartTotalValue().toLocaleString('en-IN', { maximumFractionDigits: 2 });

    items.querySelectorAll('.minus').forEach(b => b.addEventListener('click', () => updateQuantity(parseInt(b.dataset.id, 10), -1)));
    items.querySelectorAll('.plus').forEach(b => b.addEventListener('click', () => updateQuantity(parseInt(b.dataset.id, 10), 1)));
    items.querySelectorAll('.remove-item').forEach(b => b.addEventListener('click', () => removeFromCart(parseInt(b.dataset.id, 10))));
}

function openCart() {
    $('cartModal').style.display = 'flex';
    $('closeCart').focus();
}

function closeCartModal() {
    $('cartModal').style.display = 'none';
}

/* ---------- Checkout and bill ---------- */
function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty. Add a dish first.');
        return;
    }

    const order = {
        items: [...cart],
        total: cartTotalValue(),
        timestamp: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    cart = [];
    saveCart();
    updateCartUI();
    closeCartModal();
    generateBillPreview(order);
}

function centerLine(text, width = 37) {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
}

function buildBill(order) {
    const rule = '-------------------------------------';
    const double = '=====================================';
    let bill = `\n${double}\n${centerLine('SPICYFOODSHOP')}\n${centerLine('ORDER RECEIPT & BILL')}\n${double}\n\n`;
    bill += `Date: ${new Date(order.timestamp).toLocaleString()}\n\nItems:\n${rule}\n`;
    order.items.forEach(item => {
        bill += `${item.name}\n  Price: ${formatRupees(item.price)} x ${item.quantity} = ${formatRupees(item.price * item.quantity)}\n${rule}\n`;
    });
    bill += `\nTotal amount: ${formatRupees(order.total)}\n\n${double}\n${centerLine('Thank you for your order!')}\n${centerLine('Visit us again at SpicyFoodShop')}\n${double}\n`;
    return bill;
}

function generateBillPreview(order) {
    showBillPreview(buildBill(order), order);
}

function showBillPreview(billContent, order) {
    let modal = $('billModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'billModal';
    modal.className = 'cart-modal bill-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'billTitle');
    modal.innerHTML = `
        <div class="cart-content">
            <div class="cart-header">
                <h2 id="billTitle">Order placed</h2>
                <button class="close-btn" id="closeBill" aria-label="Close bill">&times;</button>
            </div>
            <div class="cart-body">
                <div id="billPreview"></div>
                <div class="bill-actions">
                    <button class="btn-secondary" id="downloadTxt">Download TXT</button>
                    <button class="btn-secondary" id="downloadPdf">Print or save PDF</button>
                    <button class="btn-primary" id="closeBillBtn">Done</button>
                </div>
                <p style="height:16px"></p>
            </div>
        </div>`;
    document.body.appendChild(modal);
    $('billPreview').textContent = billContent;

    const close = () => modal.remove();
    $('closeBill').addEventListener('click', close);
    $('closeBillBtn').addEventListener('click', close);
    $('downloadTxt').addEventListener('click', () => downloadBillAsTxt(billContent, order));
    $('downloadPdf').addEventListener('click', () => downloadBillAsPdf(billContent));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    modal.style.display = 'flex';
    $('closeBillBtn').focus();
}

function downloadBillAsTxt(billContent, order) {
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spicyfoodshop-bill-${new Date(order.timestamp).getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadBillAsPdf(billContent) {
    // Opens a print-friendly page; choose "Save as PDF" in the print dialog
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Allow pop-ups to print or save the bill as PDF.');
        return;
    }
    const doc = printWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>SpicyFoodShop bill</title><style>body{font-family:monospace;margin:20px}pre{white-space:pre-wrap}</style></head><body><pre></pre></body></html>');
    doc.close();
    doc.querySelector('pre').textContent = billContent;
    printWindow.focus();
    printWindow.print();
}

/* ---------- Contact form ---------- */
function setupContactForm() {
    const form = $('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        messages.push({
            name: $('name').value,
            email: $('email').value,
            message: $('message').value,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        form.reset();
        showToast('Message sent. We will get back to you soon.');
    });
}

/* ---------- Init (runs on every page) ---------- */
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    displayFeaturedFoods();
    setupFilterButtons();
    setupContactForm();
    updateCartUI();

    $('cartLink').addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    $('closeCart').addEventListener('click', closeCartModal);
    $('checkoutBtn').addEventListener('click', checkout);
    $('cartModal').addEventListener('click', (e) => { if (e.target === $('cartModal')) closeCartModal(); });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closeCartModal();
        const bill = $('billModal');
        if (bill) bill.remove();
    });
});
