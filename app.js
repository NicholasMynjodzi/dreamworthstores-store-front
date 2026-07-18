// ============================================================
// DREAMWORTH STORES — PUBLIC STOREFRONT INTEGRATION SCRIPT
// ============================================================
const SUPABASE_URL = 'https://zonvswvskxkibefzbzoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbnZzd3Zza3hraWJlZnpiem95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODI1ODksImV4cCI6MjA5NzI1ODU4OX0.qsfZoVqgqhS3u4wbu3LNA2W9CKnp9iRwh3bDW3yOiaw';

var sb = null;
var storeWhatsApp = "+260970000000"; // Fallback phone
var allProducts = [];
var cart = [];
var selectedCategory = 'all';

function initStoreSupabase() {
    try {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Storefront dynamically linked to cloud storage.');
    } catch (err) {
        console.error('❌ Storefront Supabase link failed:', err);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initStoreSupabase();
    loadCartFromMemory();
    
    // Fetch critical settings and dynamic database collections
    fetchStorefrontSettings();
    fetchStorefrontProducts();

    // --------------------------------------------------------
    // 1. DYNAMIC FILTER, SEARCH & SORT TRIGGERS
    // --------------------------------------------------------
    var filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            selectedCategory = btn.getAttribute('data-category');
            renderFilteredProducts();
        });
    });

    // Real-time Search input handler
    var searchInput = document.getElementById('storefront-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderFilteredProducts();
        });
    }

    // Sort select handler
    var sortSelect = document.getElementById('storefront-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            renderFilteredProducts();
        });
    }

    // --------------------------------------------------------
    // 2. CONTACT INBOX PIPELINE
    // --------------------------------------------------------
    var contactForm = document.getElementById('public-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('contact-name').value.trim();
            var email = document.getElementById('contact-email').value.trim();
            var message = document.getElementById('contact-message').value.trim();
            var sendBtn = document.getElementById('send-msg-btn');

            if (!sb) {
                alert('❌ Transmission offline. Please try again later.');
                return;
            }

            sendBtn.innerText = 'Sending Securely...';
            sendBtn.disabled = true;

            // Inserts into contacts table with a default 'New' status
            sb.from('contacts').insert([{ name: name, email: email, message: message, status: 'New' }])
                .then(function (result) {
                    if (result.error) throw result.error;

                    alert('📩 Message sent! Our team will review your inquiry shortly.');
                    contactForm.reset();
                })
                .catch(function (err) {
                    alert('❌ Error transacting message: ' + err.message);
                })
                .finally(function () {
                    sendBtn.innerText = 'Send Secure Message';
                    sendBtn.disabled = false;
                });
        });
    }
});

// --------------------------------------------------------
// 3. STEP 5: VISUAL SKELETON SHIMMER LOADERS
// --------------------------------------------------------
function renderSkeletonLoaders() {
    var grid = document.getElementById('public-products-grid');
    grid.innerHTML = '';
    
    for (var i = 0; i < 4; i++) {
        var skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-image-placeholder shimmer"></div>
            <div class="skeleton-info-placeholder">
                <div class="skeleton-line title shimmer"></div>
                <div class="skeleton-line desc shimmer"></div>
                <div class="skeleton-line desc short shimmer"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-line price shimmer"></div>
                    <div class="skeleton-btn-placeholder shimmer"></div>
                </div>
            </div>
        `;
        grid.appendChild(skeleton);
    }
}

// --------------------------------------------------------
// 4. DATABASE TRANSACTIONS & RENDER ENGINE
// --------------------------------------------------------
function fetchStorefrontProducts() {
    renderSkeletonLoaders(); // Trigger skeleton cards instantly!

    if (!sb) return;

    sb.from('products').select('*').order('id', { ascending: false })
        .then(function (result) {
            if (result.error) throw result.error;

            allProducts = result.data || [];
            renderFilteredProducts();
        })
        .catch(function (err) {
            var grid = document.getElementById('public-products-grid');
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:#ff4a4a;">Failed to load storefront elements: ' + err.message + '</div>';
        });
}

// STEP 3: LIVE SEARCH, FILTER & SORT ENGINE
function renderFilteredProducts() {
    var grid = document.getElementById('public-products-grid');
    grid.innerHTML = '';

    var filtered = allProducts;

    // Filter by Category
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(function (prod) {
            return prod.category === selectedCategory;
        });
    }

    // Filter by Search Query
    var searchVal = document.getElementById('storefront-search').value.toLowerCase().trim();
    if (searchVal !== '') {
        filtered = filtered.filter(function (prod) {
            return prod.name.toLowerCase().includes(searchVal) || 
                   prod.description.toLowerCase().includes(searchVal) ||
                   prod.category.toLowerCase().includes(searchVal);
        });
    }

    // Sort Results
    var sortVal = document.getElementById('storefront-sort');
    if (sortVal) {
        var sortValue = sortVal.value;
        if (sortValue === 'low-high') {
            filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sortValue === 'high-low') {
            filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        }
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px;color:#8a8f98; font-size: 14px;">No luxury catalog matches found.</div>';
        return;
    }

    filtered.forEach(function (product) {
        var card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrapper">
                <img src="${product.image_url}" class="product-image" alt="${product.name}" onerror="this.src='https://placehold.co/400x400/14161a/ffffff?text=📦'">
                <span class="product-category-tag">${product.category}</span>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-action-row">
                    <span class="product-price">${product.price} ZMW</span>
                    <button onclick="addProductToCart(${product.id})" class="buy-btn">Add to Cart</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function fetchStorefrontSettings() {
    if (!sb) return;

    sb.from('settings').select('*').eq('id', 1).maybeSingle()
        .then(function (result) {
            if (result.error) throw result.error;

            var data = result.data;
            if (data) {
                if (data.whatsapp) {
                    storeWhatsApp = data.whatsapp;
                }

                var channelsContainer = document.querySelector('.social-channels');
                if (channelsContainer) {
                    channelsContainer.innerHTML = '';
                    
                    var contactsToRender = [
                        { label: 'WhatsApp', value: data.whatsapp, link: 'https://wa.me/' + (data.whatsapp || '').replace(/[^0-9]/g, "") },
                        { label: 'Instagram', value: data.instagram, link: data.instagram },
                        { label: 'TikTok', value: data.tiktok, link: data.tiktok },
                        { label: 'Facebook', value: data.facebook, link: data.facebook },
                        { label: 'Support Line', value: data.phone, link: 'tel:' + data.phone },
                        { label: 'Support Email', value: data.email, link: 'mailto:' + data.email }
                    ];

                    contactsToRender.forEach(function (item) {
                        if (item.value) {
                            var linkElement = document.createElement('a');
                            linkElement.href = item.link;
                            linkElement.target = '_blank';
                            linkElement.className = 'social-link-node';
                            linkElement.innerHTML = `<strong>${item.label}:</strong> <span>${item.value}</span>`;
                            channelsContainer.appendChild(linkElement);
                        }
                    });
                }
            }
        })
        .catch(function (err) {
            console.error('⚠️ Could not load custom storefront settings:', err.message);
        });
}

// --------------------------------------------------------
// 5. SHOPPING CART ENGINE
// --------------------------------------------------------
function toggleCartDrawer(open) {
    var drawer = document.getElementById('cart-drawer');
    var overlay = document.getElementById('cart-drawer-overlay');
    if (open) {
        drawer.classList.add('open');
        overlay.classList.add('open');
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
}

function addProductToCart(productId) {
    var product = allProducts.find(p => p.id === productId);
    if (!product) return;

    var existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image_url: product.image_url,
            quantity: 1
        });
    }
    saveCartAndSync();
    
    // PEACE FIX: Commented out so it adds silently without opening the drawer!
    // toggleCartDrawer(true);
}

function updateItemQuantity(productId, delta) {
    var item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCartAndSync();
}

function saveCartAndSync() {
    localStorage.setItem('dreamworth_cart_v2', JSON.stringify(cart));
    renderCartContents();
}

function loadCartFromMemory() {
    var savedCart = localStorage.getItem('dreamworth_cart_v2');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    renderCartContents();
}

function renderCartContents() {
    var container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    var totalItemCount = 0;
    var totalPrice = 0;

    // Safety handling for missing header badge element
    var headerBadge = document.getElementById('cart-badge-count');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-state">
                <i data-lucide="shopping-bag" style="width: 48px; height: 48px; stroke-width: 1; color: var(--text-muted); margin-bottom: 12px;"></i>
                <p>Your premium collection is currently empty.</p>
            </div>
        `;
        lucide.createIcons();
        if (headerBadge) headerBadge.innerText = "0";
        document.getElementById('floating-cart-count').innerText = "0";
        document.getElementById('cart-total-price').innerText = "0 ZMW";
        return;
    }

    cart.forEach(function (item) {
        totalItemCount += item.quantity;
        totalPrice += (item.price * item.quantity);

        var cartItemRow = document.createElement('div');
        cartItemRow.className = 'cart-item-row';
        cartItemRow.innerHTML = `
            <img src="${item.image_url}" class="cart-item-thumb" onerror="this.src='https://placehold.co/100x100/14161a/ffffff?text=📦'">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-unit-price">${item.price} ZMW</p>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateItemQuantity(${item.id}, -1)">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateItemQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
        container.appendChild(cartItemRow);
    });

    if (headerBadge) headerBadge.innerText = totalItemCount;
    document.getElementById('floating-cart-count').innerText = totalItemCount;
    document.getElementById('cart-total-price').innerText = totalPrice.toFixed(2) + " ZMW";
    lucide.createIcons();
}

// DYNAMIC WHATSAPP CART CHECKOUT
function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        alert("Select at least one luxury aesthetic to checkout.");
        return;
    }

    var messageLines = [
        "✨ *NEW ORDER - DREAMWORTH STORES* ✨",
        "---------------------------------------"
    ];

    var totalCost = 0;
    cart.forEach(function (item) {
        var cost = item.price * item.quantity;
        totalCost += cost;
        messageLines.push(`• *${item.name}* x${item.quantity} (${cost.toFixed(2)} ZMW)`);
    });

    messageLines.push("---------------------------------------");
    messageLines.push(`*Estimated Total:* ${totalCost.toFixed(2)} ZMW`);
    messageLines.push("\nIs this collection ready for confirmation?");

    var formattedMsg = encodeURIComponent(messageLines.join("\n"));
    var cleanPhone = storeWhatsApp.replace(/[^0-9]/g, "");
    
    var waUrl = "https://wa.me/" + cleanPhone + "?text=" + formattedMsg;
    window.open(waUrl, '_blank');
}
