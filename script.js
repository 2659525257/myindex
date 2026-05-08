// 书签数据缓存
let bookmarksData = null;

// 当前选中的分类ID
let currentCategoryId = 'all';

// DOM 元素
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const sidebar = document.getElementById('sidebar');
const sidebarNav = document.getElementById('sidebarNav');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    setupSearch();
    setupSidebar();
});

// 加载书签数据
async function loadBookmarks() {
    try {
        showLoading();
        
        // 加载 JSON 数据
        const response = await fetch('bookmarks.json');
        if (!response.ok) {
            throw new Error('无法加载书签数据');
        }
        
        bookmarksData = await response.json();
        renderSidebarCategories(bookmarksData.categories);
        renderBookmarks(bookmarksData.categories);
    } catch (error) {
        console.error('加载书签失败:', error);
        showError('加载书签失败，请刷新页面重试');
    }
}

// 显示加载状态
function showLoading() {
    mainContent.innerHTML = '<div class="loading"></div>';
}

// 显示错误信息
function showError(message) {
    mainContent.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">❌</div>
            <p>${message}</p>
        </div>
    `;
}

// 渲染书签
function renderBookmarks(categories) {
    if (!categories || categories.length === 0) {
        mainContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>暂无书签数据</p>
            </div>
        `;
        return;
    }

    const html = categories.map((category, index) => `
        <section class="category-section" style="animation-delay: ${index * 0.1}s">
            <div class="category-header">
                <span class="category-icon">${category.icon}</span>
                <h2 class="category-name">${escapeHtml(category.name)}</h2>
            </div>
            <div class="bookmarks-grid">
                ${category.bookmarks.map(bookmark => createBookmarkCard(bookmark)).join('')}
            </div>
        </section>
    `).join('');

    mainContent.innerHTML = html;
}

// 创建书签卡片
function createBookmarkCard(bookmark) {
    return `
        <div class="bookmark-card" onclick="openBookmark('${escapeHtml(bookmark.url)}')" role="button" tabindex="0">
            <img 
                class="bookmark-icon" 
                src="${escapeHtml(bookmark.icon)}" 
                alt="${escapeHtml(bookmark.title)}"
                onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'"
            >
            <div class="bookmark-info">
                <h3 class="bookmark-title">${escapeHtml(bookmark.title)}</h3>
                <p class="bookmark-description">${escapeHtml(bookmark.description)}</p>
                <p class="bookmark-url">${escapeHtml(bookmark.url)}</p>
            </div>
        </div>
    `;
}

// 打开书签
function openBookmark(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

// 设置搜索功能
function setupSearch() {
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim().toLowerCase();
            
            if (query === '') {
                // 清空搜索，显示所有书签
                if (bookmarksData) {
                    renderBookmarks(bookmarksData.categories);
                }
            } else {
                // 执行搜索
                searchBookmarks(query);
            }
        }, 300);
    });

    // 支持键盘导航
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            if (bookmarksData) {
                renderBookmarks(bookmarksData.categories);
            }
        }
    });
}

// 搜索书签
function searchBookmarks(query) {
    if (!bookmarksData) return;

    const results = [];
    
    bookmarksData.categories.forEach(category => {
        const matchedBookmarks = category.bookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(query) ||
            bookmark.description.toLowerCase().includes(query) ||
            bookmark.url.toLowerCase().includes(query)
        );

        if (matchedBookmarks.length > 0) {
            results.push({
                ...category,
                bookmarks: matchedBookmarks
            });
        }
    });

    if (results.length === 0) {
        mainContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>未找到匹配 "${escapeHtml(query)}" 的书签</p>
            </div>
        `;
    } else {
        renderBookmarks(results);
    }
}

// HTML 转义函数，防止 XSS 攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

// 为书签卡片添加键盘支持
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('bookmark-card')) {
        const url = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
        openBookmark(url);
    }
});

// 设置侧边栏功能
function setupSidebar() {
    // 汉堡菜单按钮点击事件
    hamburgerBtn.addEventListener('click', toggleSidebar);
    
    // 关闭按钮点击事件
    sidebarCloseBtn.addEventListener('click', closeSidebar);
    
    // 遮罩层点击事件
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // ESC键关闭侧边栏（移动端）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.innerWidth <= 1024 && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// 切换侧边栏显示状态
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

// 关闭侧边栏
function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
}

// 渲染侧边栏分类列表
function renderSidebarCategories(categories) {
    if (!categories || categories.length === 0) return;

    // 计算总书签数
    const totalCount = categories.reduce((sum, cat) => sum + cat.bookmarks.length, 0);
    
    // 创建"全部"分类项
    let html = `
        <div class="category-item ${currentCategoryId === 'all' ? 'active' : ''}" 
             data-category-id="all" 
             onclick="selectCategory('all')">
            <span class="category-item-icon">📚</span>
            <span class="category-item-name">全部书签</span>
            <span class="category-item-count">${totalCount}</span>
        </div>
    `;
    
    // 创建各分类项
    categories.forEach(category => {
        html += `
            <div class="category-item ${currentCategoryId === category.id ? 'active' : ''}" 
                 data-category-id="${category.id}" 
                 onclick="selectCategory('${category.id}')">
                <span class="category-item-icon">${category.icon}</span>
                <span class="category-item-name">${escapeHtml(category.name)}</span>
                <span class="category-item-count">${category.bookmarks.length}</span>
            </div>
        `;
    });
    
    sidebarNav.innerHTML = html;
}

// 选择分类
function selectCategory(categoryId) {
    if (!bookmarksData) return;
    
    currentCategoryId = categoryId;
    
    // 更新分类项的激活状态
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('active', item.dataset.categoryId === categoryId);
    });
    
    // 清空搜索框
    searchInput.value = '';
    
    // 根据选择的分类渲染书签
    if (categoryId === 'all') {
        renderBookmarks(bookmarksData.categories);
    } else {
        const selectedCategory = bookmarksData.categories.find(cat => cat.id === categoryId);
        if (selectedCategory) {
            renderBookmarks([selectedCategory]);
        }
    }
    
    // 移动端：选择分类后关闭侧边栏
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
}
