/**
 * 自动化任务管理 Web UI - 前端应用
 */

// ==================== 全局状态 ====================
let tasks = [];
let outputs = [];
let currentTask = null;
let statusPollingInterval = null;
let selectedCompany = "中移系统集成有限公司"; // 默认公司名称
let showDisabledTasks = false; // 是否显示被禁用的任务
let companies = [];
let currentCompanyData = null;
let batches = [];
let batchPollingIntervals = {};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    
    // 获取初始 hash，如果没有则默认为 #dashboard
    const initialView = window.location.hash.substring(1) || 'dashboard';
    switchView(initialView);
    
    updateCompanySelectors(); // 初始化加载公司列表到下拉框
});

// ==================== 导航 ====================
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            
            // 如果 hash 没变，hashchange 不会触发，手动调用 switchView 实现刷新效果
            if (window.location.hash === `#${view}`) {
            switchView(view);
            } else {
                window.location.hash = view; // 更新 URL hash
            }
        });
    });

    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.substring(1) || 'tasks';
        switchView(view);
    });
}

function switchView(viewName) {
    // 确保 viewName 有效
    if (!viewName) viewName = 'tasks';
    
    // 更新 URL hash (如果是通过 JS 直接调用的 switchView)
    if (window.location.hash !== `#${viewName}`) {
        window.location.hash = viewName;
    }

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
    
    // 切换视图
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}-view`);
    });
    
    // 加载对应数据
    if (viewName === 'dashboard') {
        loadDashboard();
    } else if (viewName === 'tasks') {
        loadTasks();
    } else if (viewName === 'batches') {
        loadBatches();
    } else if (viewName === 'companies') {
        loadCompanies();
    } else if (viewName === 'compare') {
        loadCompareView();
    } else if (viewName === 'manual') {
        initManualEntryView();
    } else if (viewName === 'config') {
        loadConfig();
    }
    
    // 关闭详情悬浮框
    closeTaskDetail();
}

// ==================== 智慧大屏 (Dashboard) ====================
let dashboardTimer = null;

async function loadDashboard() {
    updateDashboardTime();
    if (dashboardTimer) clearInterval(dashboardTimer);
    dashboardTimer = setInterval(updateDashboardTime, 1000);
    
    try {
        // 1. 获取所有公司资质汇总
        const r = await fetch('/api/companies');
        const data = await r.json();
        if (!data.success) return;
        
        const allCompanies = data.companies;
        const mainCompany = allCompanies.find(c => c.name === "中移系统集成有限公司") || { name: "中移系统集成有限公司", certificate_count: 0 };
        const competitors = allCompanies.filter(c => c.name !== "中移系统集成有限公司");
        
        // 2. 更新核心指标
        document.getElementById('main-company-total').textContent = mainCompany.certificate_count;
        document.getElementById('competitor-count').textContent = competitors.length;
        
        // 模拟今日更新数（实际可从后端获取）
        document.getElementById('today-updates').textContent = Math.floor(Math.random() * 5);

        // 3. 渲染等级分布 (模拟数据，实际需遍历资质内容)
        renderLevelChart(mainCompany);

        // 4. 渲染竞争矩阵
        renderMatrix(mainCompany, competitors);

        // 5. 渲染最新动态
        renderActivities(allCompanies);
        
    } catch (e) {
        console.error('加载大屏数据失败:', e);
    }
}

function updateDashboardTime() {
    const el = document.getElementById('dashboard-time');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            weekday: 'long'
        });
    }
}

function renderLevelChart(mainCompany) {
    const container = document.getElementById('level-chart');
    if (!container) return;
    
    const levels = [
        { label: '特级/一级', count: Math.ceil(mainCompany.certificate_count * 0.2) },
        { label: '二级', count: Math.ceil(mainCompany.certificate_count * 0.3) },
        { label: '三级', count: Math.ceil(mainCompany.certificate_count * 0.25) },
        { label: '其他', count: Math.ceil(mainCompany.certificate_count * 0.25) }
    ];
    
    const max = Math.max(...levels.map(l => l.count));
    
    container.innerHTML = levels.map((l, index) => `
        <div class="chart-bar-row">
            <div class="chart-bar-label">${l.label}</div>
            <div class="chart-bar-wrap">
                <div class="chart-bar-fill" style="width: 0%; transition-delay: ${index * 100}ms"></div>
            </div>
            <div class="chart-bar-value">${l.count}</div>
        </div>
    `).join('');

    // 触发动画
    setTimeout(() => {
        const fills = container.querySelectorAll('.chart-bar-fill');
        fills.forEach((fill, i) => {
            fill.style.width = `${(levels[i].count/max*100) || 0}%`;
        });
    }, 50);
}

async function renderMatrix(mainCompany, competitors) {
    const body = document.getElementById('matrix-body');
    if (!body) return;
    
    // 获取详细对比数据（由于 API 限制，这里我们模拟对比结果，实际应循环调用对比接口）
    const matrixRows = competitors.map(comp => {
        const diff = mainCompany.certificate_count - comp.certificate_count;
        return {
            name: comp.name,
            total: comp.certificate_count,
            win: diff > 0 ? diff : 0,
            lose: diff < 0 ? Math.abs(diff) : 0,
            status: diff >= 0 ? '领先' : '追赶中'
        };
    });
    
    body.innerHTML = matrixRows.map((row, index) => `
        <tr>
            <td class="matrix-company-name">${row.name}</td>
            <td>
                ${row.total}
                <div class="matrix-progress-wrap">
                    <div class="matrix-progress-fill" style="width: 0%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms"></div>
                </div>
            </td>
            <td><span class="text-success">${row.win > 0 ? '+' + row.win : '-'}</span></td>
            <td><span class="text-danger">${row.lose > 0 ? '-' + row.lose : '-'}</span></td>
            <td>
                <span class="matrix-tag ${row.status === '领先' ? 'win' : 'lose'}">${row.status}</span>
            </td>
        </tr>
    `).join('');

    // 触发矩阵动画
    setTimeout(() => {
        const fills = body.querySelectorAll('.matrix-progress-fill');
        fills.forEach((fill, i) => {
            fill.style.width = `${Math.min(matrixRows[i].total * 5, 100)}%`;
        });
    }, 50);
}

function renderActivities(companies) {
    const container = document.getElementById('recent-activities');
    if (!container) return;
    
    // 模拟动态数据
    const activities = companies.slice(0, 10).map(c => ({
        company: c.name,
        action: '完成资质库同步',
        time: c.last_updated || '刚刚',
        color: ['#00d2ff', '#10b981', '#f59e0b'][Math.floor(Math.random()*3)]
    }));
    
    container.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${a.color}"></div>
            <div class="activity-content">
                <div><strong>${a.company}</strong> ${a.action}</div>
                <div class="activity-time">${formatDate(a.time)}</div>
            </div>
        </div>
    `).join('');
}

// ==================== 手动录入 ====================
let manualCategories = [];
let manualCompanies = [];

async function initManualEntryView() {
    // 加载补全数据
    try {
        const [catResp, compResp] = await Promise.all([
            fetch('/api/qualifications/categories'),
            fetch('/api/company-names')
        ]);
        
        const catData = await catResp.json();
        const compData = await compResp.json();
        
        if (catData.success) {
            manualCategories = catData.categories;
            // 绑定资质名称自动补全
            setupAutocomplete(document.getElementById('manual-category'), manualCategories);
        }
        
        if (compData.success) {
            manualCompanies = compData.companies;
            // 填充公司下拉框
            const companySelect = document.getElementById('manual-company');
            companySelect.innerHTML = '<option value="">请选择公司</option>';
            manualCompanies.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                companySelect.appendChild(option);
            });
        }
        
    } catch (e) {
        console.error('初始化手动录入失败:', e);
    }
}

// 处理截图上传识别 (已移除)

function setupAutocomplete(input, data) {
    let currentFocus;
    
    input.addEventListener("input", function(e) {
        const val = this.value;
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;
        
        const listDiv = document.createElement("DIV");
        listDiv.setAttribute("id", this.id + "-autocomplete-list");
        listDiv.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(listDiv);
        
        for (let i = 0; i < data.length; i++) {
            if (data[i].toUpperCase().includes(val.toUpperCase())) {
                const itemDiv = document.createElement("DIV");
                const matchIndex = data[i].toUpperCase().indexOf(val.toUpperCase());
                
                itemDiv.innerHTML = data[i].substr(0, matchIndex);
                itemDiv.innerHTML += "<strong>" + data[i].substr(matchIndex, val.length) + "</strong>";
                itemDiv.innerHTML += data[i].substr(matchIndex + val.length);
                
                itemDiv.innerHTML += "<input type='hidden' value='" + data[i] + "'>";
                
                itemDiv.addEventListener("click", function(e) {
                    input.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                listDiv.appendChild(itemDiv);
            }
        }
    });
    
    input.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "-autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { // DOWN
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // UP
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    
    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != input) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

async function submitManualEntry(event) {
    event.preventDefault();
    
    const category = document.getElementById('manual-category').value.trim();
    const company = document.getElementById('manual-company').value.trim();
    const certNo = document.getElementById('manual-cert-no').value.trim();
    const level = document.getElementById('manual-level').value.trim();
    const expiry = document.getElementById('manual-expiry').value;
    
    if (!category || !company || !certNo) {
        showToast('请填写完整必填信息', 'warning');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> 正在保存...';
    
    try {
        const response = await fetch('/api/qualifications/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_name: company,
                category_name: category,
                certificate_no: certNo,
                level: level,
                expiry_date: expiry
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('资质录入成功', 'success');
            document.getElementById('manual-entry-form').reset();
            // 刷新本地补全列表
            if (!manualCategories.includes(category)) manualCategories.push(category);
            if (!manualCompanies.includes(company)) manualCompanies.push(company);
        } else {
            showToast('保存失败: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('网络错误，请稍后重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==================== 任务管理 ====================
async function loadTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('/api/tasks');
        const data = await response.json();
        
        if (data.success) {
            tasks = data.tasks;
            // 初始化时更新计数
            const filteredCount = showDisabledTasks ? tasks.length : tasks.filter(t => !t.disabled).length;
            updateTaskCount(filteredCount, tasks.length);
            renderTasks();
        } else {
            showToast('加载任务失败: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('网络错误: ' + error.message, 'error');
    }
}

function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    
    // 根据开关状态过滤任务
    const filteredTasks = showDisabledTasks 
        ? tasks 
        : tasks.filter(task => !task.disabled);
    
    // 更新任务计数显示
    updateTaskCount(filteredTasks.length, tasks.length);
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-title">暂无任务</div>
                <div class="empty-text">${showDisabledTasks ? '所有任务都被禁用了' : '点击"新建任务"创建第一个自动化任务'}</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="tasks-table-container">
            <table class="tasks-table">
                <thead>
                    <tr>
                        <th>任务名称</th>
                        <th>描述</th>
                        <th>目标网址</th>
                        <th>动作数</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredTasks.map(task => `
                        <tr onclick="showTaskDetail('${task._file}', event)" class="${task.disabled ? 'task-disabled' : ''}">
                            <td class="task-name-cell">
                                ${task.disabled ? '<span style="opacity: 0.5;">🚫</span> ' : ''}
                                ${task.name || task._file}
                            </td>
                            <td class="task-description-cell" title="${task.description || '暂无描述'}">${task.description || '暂无描述'}</td>
                            <td class="task-url-cell" title="${task.url || 'N/A'}">${truncateUrl(task.url)}</td>
                            <td class="task-actions-cell">${task.actions?.length || 0}</td>
                            <td>
                                ${task.disabled 
                                    ? '<span class="task-status disabled">已禁用</span>' 
                                    : `<span class="task-status idle" id="status-${task._file}">就绪</span>`
                                }
                            </td>
                            <td>
                                <div class="task-actions-dropdown" onclick="event.stopPropagation()">
                                    <button class="btn btn-secondary btn-sm dropdown-toggle" onclick="toggleTaskMenu('${task._file}', event)">
                                        <span>操作</span>
                                        <span class="dropdown-arrow">▼</span>
                                    </button>
                                    <div class="dropdown-menu" id="menu-${task._file}">
                                        ${task.disabled 
                                            ? `<a href="#" class="dropdown-item" onclick="toggleTaskStatus('${task._file}', false); closeTaskMenu('${task._file}'); return false;">
                                                <span class="menu-icon">✓</span>
                                                <span>启用任务</span>
                                            </a>`
                                            : `<a href="#" class="dropdown-item" onclick="runTask('${task._file}'); closeTaskMenu('${task._file}'); return false;">
                                                <span class="menu-icon">▶</span>
                                                <span>运行任务</span>
                                            </a>`
                                        }
                                        <a href="#" class="dropdown-item" onclick="editTask('${task._file}'); closeTaskMenu('${task._file}'); return false;">
                                            <span class="menu-icon">✏️</span>
                                            <span>编辑任务</span>
                                        </a>
                                        ${!task.disabled 
                                            ? `<a href="#" class="dropdown-item" onclick="toggleTaskStatus('${task._file}', true); closeTaskMenu('${task._file}'); return false;">
                                                <span class="menu-icon">🚫</span>
                                                <span>禁用任务</span>
                                            </a>`
                                            : ''
                                        }
                                        <a href="#" class="dropdown-item dropdown-item-danger" onclick="deleteTask('${task._file}'); closeTaskMenu('${task._file}'); return false;">
                                            <span class="menu-icon">🗑️</span>
                                            <span>删除任务</span>
                                        </a>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function toggleDisabledTasks(show) {
    showDisabledTasks = show;
    renderTasks();
}

function updateTaskCount(displayedCount, totalCount) {
    const countElement = document.getElementById('task-count');
    if (!countElement) return;
    
    const disabledCount = totalCount - (tasks.filter(t => !t.disabled).length);
    
    if (showDisabledTasks) {
        // 显示所有任务
        if (disabledCount > 0) {
            countElement.textContent = `共 ${totalCount} 个任务（${totalCount - disabledCount} 个启用，${disabledCount} 个禁用）`;
        } else {
            countElement.textContent = `共 ${totalCount} 个任务`;
        }
    } else {
        // 只显示启用的任务
        const enabledCount = totalCount - disabledCount;
        if (disabledCount > 0) {
            countElement.textContent = `显示 ${displayedCount} 个任务（共 ${totalCount} 个，${disabledCount} 个已隐藏）`;
        } else {
            countElement.textContent = `共 ${totalCount} 个任务`;
        }
    }
}

// ==================== 任务操作下拉菜单 ====================
function toggleTaskMenu(filename, event) {
    event.stopPropagation();
    
    // 关闭所有其他菜单
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `menu-${filename}`) {
            menu.classList.remove('show');
        }
    });
    
    // 切换当前菜单
    const menu = document.getElementById(`menu-${filename}`);
    if (menu) {
        menu.classList.toggle('show');
    }
}

function closeTaskMenu(filename) {
    const menu = document.getElementById(`menu-${filename}`);
    if (menu) {
        menu.classList.remove('show');
    }
}

// 点击外部关闭所有菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions-dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });

async function toggleTaskStatus(filename, disabled) {
    try {
        const response = await fetch(`/api/tasks/${filename}/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ disabled })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 更新本地任务状态
            const task = tasks.find(t => t._file === filename);
            if (task) {
                task.disabled = disabled;
            }
            
            showToast(disabled ? '任务已禁用' : '任务已启用', 'success');
            renderTasks();
        } else {
            showToast('操作失败: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('网络错误: ' + error.message, 'error');
    }
}

function truncateUrl(url) {
    if (!url) return 'N/A';
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return url.substring(0, 30) + (url.length > 30 ? '...' : '');
    }
}

// ==================== 任务详情 ====================
let detailPopover = null;
let detailPopoverTimeout = null;

async function showTaskDetail(filename, event) {
    // 如果点击的是按钮，不显示详情
    if (event && (event.target.tagName === 'BUTTON' || event.target.closest('button'))) {
        return;
    }
    
    // 清除之前的定时器
    if (detailPopoverTimeout) {
        clearTimeout(detailPopoverTimeout);
    }
    
    // 创建或获取悬浮框
    if (!detailPopover) {
        detailPopover = document.createElement('div');
        detailPopover.className = 'detail-popover';
        detailPopover.innerHTML = `
            <div class="popover-header">
                <h2 id="popover-title">任务详情</h2>
                <button class="btn-close" onclick="closeTaskDetail()">×</button>
            </div>
            <div class="popover-content" id="popover-content"></div>
        `;
        document.body.appendChild(detailPopover);
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (detailPopover && !detailPopover.contains(e.target) && !e.target.closest('tr[onclick*="showTaskDetail"]')) {
                closeTaskDetail();
            }
        });
    }
    
    const content = document.getElementById('popover-content');
    const title = document.getElementById('popover-title');
    
    // 获取点击位置
    const rect = event ? event.currentTarget.getBoundingClientRect() : { top: 100, left: 100, bottom: 150, right: 200 };
    
    // 计算位置
    const popoverWidth = 500;
    const popoverHeight = 600;
    const margin = 10;
    
    let top = rect.bottom + margin;
    let left = rect.left;
    
    if (top + popoverHeight > window.innerHeight) {
        top = rect.top - popoverHeight - margin;
        if (top < 0) top = margin;
    }
    
    if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
    }
    if (left < margin) left = margin;
    
    detailPopover.style.top = top + 'px';
    detailPopover.style.left = left + 'px';
    detailPopover.style.transform = 'none';
    
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    detailPopover.classList.add('show');
    
    try {
        const response = await fetch(`/api/tasks/${filename}`);
        const data = await response.json();
        
        if (data.success) {
            currentTask = data.task;
            title.textContent = currentTask.name || filename;
            
            content.innerHTML = `
                <div class="form-group">
                    <label class="form-label">任务名称</label>
                    <div class="form-input" style="background: var(--bg-secondary); padding: 8px 12px;">${currentTask.name || 'N/A'}</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">描述</label>
                    <div class="form-input" style="background: var(--bg-secondary); padding: 8px 12px;">${currentTask.description || '暂无描述'}</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">目标网址</label>
                    <div class="form-input" style="background: var(--bg-secondary); padding: 8px 12px; word-break: break-all;">
                        <a href="${currentTask.url}" target="_blank" style="color: var(--accent-blue)">${currentTask.url || 'N/A'}</a>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">动作列表 (${currentTask.actions?.length || 0})</label>
                    <div class="actions-list">
                        ${(currentTask.actions || []).map((action, idx) => `
                            <div class="action-item">
                                <span style="color: var(--text-muted)">${idx + 1}</span>
                                <span class="action-type">${action.type}</span>
                                <span class="action-detail">${getActionDetail(action)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group" id="log-section" style="display: none;">
                    <label class="form-label">执行日志</label>
                    <div class="log-container" id="task-logs"></div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">执行公司</label>
                    <select class="form-select" id="popover-company-select" style="width: 100%;">
                        <!-- 由 updateCompanySelectors 填充 -->
                    </select>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button class="btn btn-success" onclick="runTaskFromPopover('${filename}')">
                        ▶ 运行任务
                    </button>
                    <button class="btn btn-secondary" onclick="editTask('${filename}')">
                        ✏️ 编辑配置
                    </button>
                </div>
            `;
            
            // 填充公司下拉框并设置选中值
            const popoverSelect = document.getElementById('popover-company-select');
            if (popoverSelect) {
                const response = await fetch('/api/company-names');
                const data = await response.json();
                if (data.success) {
                    popoverSelect.innerHTML = data.companies.map(name => 
                        `<option value="${name}" ${name === selectedCompany ? 'selected' : ''}>${name}</option>`
                    ).join('');
                }
            }
            
            checkTaskStatus(filename);
        }
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><div class="empty-title">加载失败</div></div>';
        showToast('加载任务详情失败', 'error');
    }
}

function closeTaskDetail() {
    if (detailPopover) {
        detailPopover.classList.remove('show');
    }
    if (detailPopoverTimeout) {
        clearTimeout(detailPopoverTimeout);
    }
}

function runTaskFromPopover(filename) {
    const companySelect = document.getElementById('popover-company-select');
    if (companySelect) {
        selectedCompany = companySelect.value;
        const mainSelect = document.getElementById('company-select');
        if (mainSelect) {
            mainSelect.value = selectedCompany;
        }
    }
    runTask(filename);
    closeTaskDetail();
}

function getActionDetail(action) {
    switch (action.type) {
        case 'input': return `${action.target} → "${action.value}"`;
        case 'click':
        case 'optional_click': return action.target;
        case 'wait': return `${action.seconds}秒`;
        case 'screenshot': return action.filename;
        case 'screenshot_ocr': return `截图OCR: ${action.filename || 'screenshot_ocr.png'}`;
        case 'extract': return action.target;
        case 'extract_text':
        case 'extract_all_text': return '提取页面所有文字';
        case 'checkbox': return `${action.target} = ${action.checked}`;
        case 'select': return `${action.target} → ${action.value}`;
        case 'submit': return action.target || '提交表单';
        case 'click_and_navigate': return action.target;
        case 'switch_to_new_window': return '切换到新窗口';
        case 'switch_to_latest_tab': return '切换到最新标签页';
        case 'loop_click_extract': return `循环提取: ${action.list_selector || ''}`;
        case 'find_links_extract': return `查找链接: ${action.match_text || ''}`;
        case 'extract_links_by_keyword': return `提取关键字链接: ${action.keyword || ''}`;
        case 'math_captcha': return `算式验证码: ${action.input_selector || ''} → ${action.submit_selector || ''}`;
        case 'image_captcha': return `图片验证码: ${action.input_selector || ''} → ${action.submit_selector || ''}`;
        default: return JSON.stringify(action);
    }
}

function closeDetailPanel() {
    closeTaskDetail();
    currentTask = null;
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        statusPollingInterval = null;
    }
}

// ==================== 批量管理 ====================
async function loadBatches() {
    const container = document.getElementById('batches-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const resp = await fetch('/api/batches');
        const data = await resp.json();
        if (data.success) {
            batches = data.batches || [];
            renderBatches();
        } else {
            if (data.error && data.error.includes('not available')) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <div class="empty-title">批量任务管理器不可用</div>
                        <div class="empty-text">${data.error}</div>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="empty-state"><div class="empty-title">加载失败</div><div class="empty-text">' + (data.error || '未知错误') + '</div></div>';
            }
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state"><div class="empty-title">网络错误</div><div class="empty-text">' + e.message + '</div></div>';
    }
}

function renderBatches() {
    const container = document.getElementById('batches-container');
    if (!container) return;

    if (!batches || batches.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔁</div>
                <div class="empty-title">暂无批次</div>
                <div class="empty-text">点击"新建批次"创建批量运行</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="batches-table-container">
            <table class="tasks-table">
                <thead>
                    <tr>
                        <th>批次名称</th>
                        <th>任务数</th>
                        <th>进度</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${batches.map(b => `
                        <tr>
                            <td>${b.name}</td>
                            <td>${b.progress?.total || 0}</td>
                            <td>${(b.progress?.completed||0)}/${(b.progress?.total||0)} 已完成，失败 ${(b.progress?.failed||0)}</td>
                            <td>${b.status || 'pending'}</td>
                            <td>
                                <div class="task-actions-buttons">
                                    <button class="btn btn-success btn-sm" onclick="startBatch('${b.id}')">▶ 启动</button>
                                    <button class="btn btn-secondary btn-sm" onclick="showBatchDetail('${b.id}')">详情</button>
                                    <button class="btn btn-warning btn-sm" onclick="showScheduleModal('${b.id}')">⏰ 定时</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteBatch('${b.id}')">🗑️ 删除</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showCreateBatchModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    
    // 先异步加载公司列表
    fetch('/api/company-names').then(r => r.json()).then(data => {
        const companyOptions = data.success ? data.companies.map(name => 
            `<option value="${name}">${name}</option>`
        ).join('') : '';

    content.innerHTML = `
        <div class="modal-header"><h2>新建批次</h2><button class="btn-close" onclick="closeModal()">×</button></div>
        <div class="modal-body">
            <div class="form-group">
                    <label class="form-label">批次名称</label>
                <input id="batch-name" class="form-input" />
            </div>
            <div class="form-group">
                    <label class="form-label">执行公司</label>
                <select id="batch-company" class="form-select">
                        ${companyOptions}
                </select>
            </div>
            <div class="form-group">
                    <label class="form-label">选择任务（可多选）</label>
                    <div id="batch-tasks-list" style="max-height:260px; overflow:auto; border:1px solid var(--border-color); padding:8px; background:var(--bg-secondary)">
                        ${tasks.filter(t => !t.disabled).map(t => `
                            <label style="display:block; margin-bottom:6px;">
                                <input type="checkbox" value="${t._file}" /> ${t.name || t._file}
                            </label>
                        `).join('') || '<div class="empty-text">暂无可用任务</div>'}
                    </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="createBatch()">创建并启动</button>
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
        </div>
    `;
        modal.classList.add('open');
    });
}

async function createBatch() {
    const name = document.getElementById('batch-name').value || '';
    const company = document.getElementById('batch-company').value;
    const checkboxes = Array.from(document.querySelectorAll('#batch-tasks-list input[type="checkbox"]'));
    const selected = checkboxes.filter(c => c.checked).map(c => c.value);
    if (selected.length === 0) {
        showToast('请选择至少一个任务', 'error');
        return;
    }

    try {
        const resp = await fetch('/api/batches', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, tasks: selected, company_name: company})
        });
        const data = await resp.json();
        if (data.success) {
            showToast('批次创建成功', 'success');
            closeModal();
            loadBatches();
            startBatch(data.batch.id);
        } else {
            showToast('创建失败: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
    }
}

async function startBatch(batchId) {
    try {
        const resp = await fetch(`/api/batches/${batchId}/start`, {method: 'POST'});
        const data = await resp.json();
        if (data.success) {
            showToast('批次已开始执行', 'success');
            if (batchPollingIntervals[batchId]) clearInterval(batchPollingIntervals[batchId]);
            pollBatch(batchId);
            batchPollingIntervals[batchId] = setInterval(() => pollBatch(batchId), 3000);
            loadBatches();
        } else {
            showToast('启动失败: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
    }
}

async function pollBatch(batchId) {
    try {
        const resp = await fetch(`/api/batches/${batchId}`);
        const data = await resp.json();
        if (data.success) {
            const idx = batches.findIndex(b => b.id === batchId);
            if (idx >= 0) batches[idx] = data.batch;
            renderBatches();
            if (data.batch.status !== 'running' && batchPollingIntervals[batchId]) {
                clearInterval(batchPollingIntervals[batchId]);
                delete batchPollingIntervals[batchId];
            }
        }
    } catch (e) {}
}

async function showBatchDetail(batchId) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    modal.classList.add('open');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const resp = await fetch(`/api/batches/${batchId}`);
        const data = await resp.json();
        if (!data.success) {
            content.innerHTML = '<div class="empty-title">加载失败</div>';
            return;
        }

        const b = data.batch;
        content.innerHTML = `
            <div class="modal-header"><h2>批次详情 - ${b.name}</h2><button class="btn-close" onclick="closeModal()">×</button></div>
            <div class="modal-body">
                <div class="form-group"><label class="form-label">状态</label><div class="form-input">${b.status}</div></div>
                <div class="form-group"><label class="form-label">进度</label><div class="form-input">${(b.progress.completed||0)}/${(b.progress.total||0)} 已完成，失败 ${(b.progress.failed||0)}</div></div>
                <div class="form-group"><label class="form-label">任务列表</label>
                    <div style="max-height:180px; overflow:auto; padding:8px; background:var(--bg-secondary)">
                        ${(b.items||[]).map(it => `<div style="margin-bottom:6px;"><strong>[${it.index}]</strong> ${it.task._file || it.task.name || '任务'} — ${it.status}</div>`).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="startBatch('${b.id}')">▶ 重启</button>
                <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
            </div>
        `;
        if (batchPollingIntervals[b.id]) clearInterval(batchPollingIntervals[b.id]);
        pollBatch(b.id);
        batchPollingIntervals[b.id] = setInterval(() => pollBatch(b.id), 3000);
    } catch (e) {
        content.innerHTML = '<div class="empty-title">网络错误</div>';
    }
}

async function showScheduleModal(batchId) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="modal-header"><h2>定时任务</h2><button class="btn-close" onclick="closeModal()">×</button></div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">间隔（秒）</label>
                <input id="schedule-interval" class="form-input" placeholder="例如 3600" />
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="scheduleBatch('${batchId}')">保存并启用</button>
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
        </div>
    `;
    modal.classList.add('open');
}

async function scheduleBatch(batchId) {
    const interval = parseInt(document.getElementById('schedule-interval').value || '0');
    if (!interval || interval <= 0) {
        showToast('请输入有效的间隔秒数', 'error');
        return;
    }

    try {
        const resp = await fetch(`/api/batches/${batchId}/schedule`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({interval_seconds: interval})
        });
        const data = await resp.json();
        if (data.success) {
            showToast('定时已启用', 'success');
            closeModal();
            loadBatches();
        } else {
            showToast('定时失败: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
    }
}

async function deleteBatch(batchId) {
    if (!confirm('确认删除该批次吗？')) return;
    try {
        const resp = await fetch(`/api/batches/${batchId}`, {method: 'DELETE'});
        const data = await resp.json();
        if (data.success) {
            showToast('已删除', 'success');
            loadBatches();
        } else {
            showToast('删除失败: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
    }
}

// ==================== 公司选择 ====================
function updateCompanyName(companyName) {
    selectedCompany = companyName;
    showToast(`已选择公司: ${companyName}`, 'info');
}

// ==================== 任务执行 ====================
async function runTask(filename) {
    const task = tasks.find(t => t._file === filename);
    if (task && task.disabled) {
        showToast('该任务已被禁用，无法运行', 'error');
        return;
    }
    
    try {
        const companySelect = document.getElementById('company-select');
        const companyName = companySelect ? companySelect.value : selectedCompany;
        
        const response = await fetch(`/api/tasks/${filename}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_name: companyName })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`任务已开始执行 (${companyName})`, 'success');
            const statusEl = document.getElementById(`status-${filename}`);
            if (statusEl) {
                statusEl.textContent = '运行中';
                statusEl.className = 'task-status running';
            }
            startStatusPolling(filename);
        } else {
            showToast(data.error || '启动失败', 'error');
        }
    } catch (error) {
        showToast('网络错误: ' + error.message, 'error');
    }
}

function startStatusPolling(filename) {
    if (statusPollingInterval) clearInterval(statusPollingInterval);
    statusPollingInterval = setInterval(async () => {
        await checkTaskStatus(filename);
    }, 1000);
}

async function checkTaskStatus(filename) {
    try {
        const response = await fetch(`/api/tasks/${filename}/status`);
        const data = await response.json();
        
        if (data.success) {
            const logsEl = document.getElementById('task-logs');
            if (logsEl && data.logs) {
                logsEl.innerHTML = data.logs.map(log => `<div class="log-entry">${log}</div>`).join('');
                logsEl.scrollTop = logsEl.scrollHeight;
            }
            
            const statusEl = document.getElementById(`status-${filename}`);
            if (statusEl) {
                if (data.running) {
                    statusEl.textContent = '运行中';
                    statusEl.className = 'task-status running';
                } else if (data.error) {
                    statusEl.textContent = '失败';
                    statusEl.className = 'task-status failed';
                } else if (data.result) {
                    statusEl.textContent = '完成';
                    statusEl.className = 'task-status success';
                }
            }
            
            if (!data.running && statusPollingInterval) {
                clearInterval(statusPollingInterval);
                statusPollingInterval = null;
                if (data.result) showToast('任务执行完成', 'success');
                else if (data.error) showToast('任务执行失败: ' + data.error, 'error');
            }
        }
    } catch (error) {
        console.error('检查状态失败:', error);
    }
}

// ==================== 任务编辑 ====================
async function editTask(filename) {
    try {
        const response = await fetch(`/api/tasks/${filename}`);
        const data = await response.json();
        if (data.success) showEditModal(data.task, filename);
    } catch (error) {
        showToast('加载任务失败', 'error');
    }
}

function showEditModal(task, filename) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">编辑任务: ${filename}</h3>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="task-editor">
            <div class="form-group">
                <label class="form-label">任务名称</label>
                <input class="form-input" id="edit-task-name" value="${escapeHtml(task.name || '')}">
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea class="form-textarea" id="edit-task-description" rows="2">${escapeHtml(task.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">目标网址</label>
                <input class="form-input" id="edit-task-url" value="${escapeHtml(task.url || '')}">
            </div>
            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <label class="form-label" style="margin: 0;">动作列表</label>
                    <button class="btn btn-primary btn-sm" onclick="addAction()"><span>+</span> 添加动作</button>
                </div>
                <div id="actions-container" class="actions-editor">
                    ${renderActionsEditor(task.actions || [])}
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="saveTask('${filename}')">保存</button>
        </div>
    `;
    modal.classList.add('open');
}

function renderActionsEditor(actions) {
    if (actions.length === 0) return '<div class="empty-actions">暂无动作，点击"添加动作"开始配置</div>';
    return actions.map((action, index) => renderActionItem(action, index, actions.length)).join('');
}

function renderActionItem(action, index, totalActions) {
    const actionTypes = {
        'wait': '等待', 'input': '输入', 'click': '点击', 'optional_click': '可选点击', 'hover': '悬停',
        'checkbox': '复选框', 'select': '选择', 'submit': '提交表单', 'extract': '提取', 'extract_text': '提取页面文字',
        'find_links_extract': '查找链接并提取', 'loop_click_extract': '循环点击提取', 'screenshot': '截图'
    };
    return `
        <div class="action-editor-item" data-index="${index}">
            <div class="action-editor-header">
                <div class="action-editor-number">${index + 1}</div>
                <div class="action-editor-type">${actionTypes[action.type] || action.type}</div>
                <div class="action-editor-actions">
                    <button class="btn-icon" onclick="moveAction(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-icon" onclick="moveAction(${index}, 'down')" ${index === totalActions - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-icon" onclick="removeAction(${index})">×</button>
                </div>
            </div>
            <div class="action-editor-body">${renderActionForm(action, index)}</div>
        </div>
    `;
}

function renderActionForm(action, index) {
    const type = action.type || 'wait';
    let formHtml = `<div class="form-group"><label class="form-label">动作类型</label><select class="form-select" onchange="changeActionType(${index}, this.value)">`;
    const types = ['wait', 'input', 'click', 'optional_click', 'hover', 'checkbox', 'select', 'submit', 'extract', 'extract_text', 'find_links_extract', 'screenshot'];
    types.forEach(t => formHtml += `<option value="${t}" ${type === t ? 'selected' : ''}>${t}</option>`);
    formHtml += `</select></div>`;

    if (type === 'wait') formHtml += `<div class="form-group"><label class="form-label">等待时间（秒）</label><input type="number" class="form-input" id="action-${index}-seconds" value="${action.seconds || 1}" step="0.1"></div>`;
    else if (type === 'input') formHtml += `<div class="form-group"><label class="form-label">目标</label><input class="form-input" id="action-${index}-target" value="${escapeHtml(action.target || '')}"></div><div class="form-group"><label class="form-label">输入值</label><input class="form-input" id="action-${index}-value" value="${escapeHtml(action.value || '')}"></div>`;
    else if (['click', 'optional_click', 'hover', 'extract'].includes(type)) formHtml += `<div class="form-group"><label class="form-label">目标</label><input class="form-input" id="action-${index}-target" value="${escapeHtml(action.target || '')}"></div>`;
    
    formHtml += `<div class="form-group"><label class="form-label">注释</label><input class="form-input" id="action-${index}-comment" value="${escapeHtml(action.comment || '')}"></div>`;
    return formHtml;
}

function addAction() {
    const actions = getCurrentActions();
    actions.push({ type: 'wait', seconds: 1 });
    document.getElementById('actions-container').innerHTML = renderActionsEditor(actions);
}

function removeAction(index) {
    const actions = getCurrentActions();
    actions.splice(index, 1);
    document.getElementById('actions-container').innerHTML = renderActionsEditor(actions);
}

function moveAction(index, direction) {
    const actions = getCurrentActions();
    if (direction === 'up' && index > 0) [actions[index], actions[index - 1]] = [actions[index - 1], actions[index]];
    else if (direction === 'down' && index < actions.length - 1) [actions[index], actions[index + 1]] = [actions[index + 1], actions[index]];
    document.getElementById('actions-container').innerHTML = renderActionsEditor(actions);
}

function changeActionType(index, newType) {
    const actions = getCurrentActions();
    actions[index] = { type: newType };
    document.getElementById('actions-container').innerHTML = renderActionsEditor(actions);
}

function getCurrentActions() {
    const container = document.getElementById('actions-container');
    if (!container) return [];
    const items = container.querySelectorAll('.action-editor-item');
    const actions = [];
    items.forEach((item, index) => {
        const type = item.querySelector('select').value;
        const action = { type };
        if (type === 'wait') action.seconds = parseFloat(document.getElementById(`action-${index}-seconds`)?.value || 1);
        else if (type === 'input') {
            action.target = document.getElementById(`action-${index}-target`)?.value;
            action.value = document.getElementById(`action-${index}-value`)?.value;
        } else if (['click', 'optional_click', 'hover', 'extract'].includes(type)) {
            action.target = document.getElementById(`action-${index}-target`)?.value;
        }
        action.comment = document.getElementById(`action-${index}-comment`)?.value;
        actions.push(action);
    });
    return actions;
}

async function saveTask(filename) {
    const taskData = {
        name: document.getElementById('edit-task-name').value,
        description: document.getElementById('edit-task-description').value,
        url: document.getElementById('edit-task-url').value,
        actions: getCurrentActions()
    };
    try {
        const r = await fetch(`/api/tasks/${filename}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        const data = await r.json();
        if (data.success) { showToast('保存成功', 'success'); closeModal(); loadTasks(); }
        else showToast('保存失败: ' + data.error, 'error');
    } catch (e) { showToast('保存失败: ' + e.message, 'error'); }
}

// ==================== 创建任务 ====================
function showCreateTaskModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="modal-header"><h3 class="modal-title">新建任务</h3><button class="btn-close" onclick="closeModal()">×</button></div>
        <div class="modal-body">
            <div class="form-group"><label class="form-label">文件名</label><input class="form-input" id="new-task-filename" value="new_task.json"></div>
            <div class="form-group"><label class="form-label">名称</label><input class="form-input" id="new-task-name" value="新任务"></div>
            <div class="form-group"><label class="form-label">描述</label><textarea class="form-textarea" id="new-task-description" rows="2"></textarea></div>
            <div class="form-group"><label class="form-label">网址</label><input class="form-input" id="new-task-url" value="https://"></div>
            <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <label class="form-label">动作列表</label>
                    <button class="btn btn-primary btn-sm" onclick="addAction()">+ 添加</button>
            </div>
                <div id="actions-container" class="actions-editor"></div>
            </div>
            </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="createTask()">创建</button>
        </div>
    `;
    modal.classList.add('open');
}

async function createTask() {
    const filename = document.getElementById('new-task-filename').value;
    const taskData = {
        name: document.getElementById('new-task-name').value,
        description: document.getElementById('new-task-description').value,
        url: document.getElementById('new-task-url').value,
        actions: getCurrentActions(),
        _file: filename
    };
    try {
        const r = await fetch('/api/tasks', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        const data = await r.json();
        if (data.success) { showToast('创建成功', 'success'); closeModal(); loadTasks(); }
        else showToast('创建失败: ' + data.error, 'error');
    } catch (e) { showToast('网络错误', 'error'); }
}

async function deleteTask(filename) {
    if (!confirm(`确定删除任务 "${filename}" 吗？`)) return;
    try {
        const r = await fetch(`/api/tasks/${filename}`, { method: 'DELETE' });
        const data = await r.json();
        if (data.success) { showToast('删除成功', 'success'); loadTasks(); }
        else showToast('删除失败: ' + data.error, 'error');
    } catch (e) { showToast('网络错误', 'error'); }
}

// ==================== 公司资质 ====================
async function loadCompanies() {
    const container = document.getElementById('companies-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
        const r = await fetch('/api/companies');
        const data = await r.json();
        if (data.success) { companies = data.companies; renderCompanies(); }
    } catch (e) { showToast('加载公司失败', 'error'); }
}

function renderCompanies() {
    const container = document.getElementById('companies-container');
    if (companies.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-title">暂无公司资质数据</div></div>`;
        return;
    }
    container.innerHTML = `
        <div class="companies-tabs">
            <div class="tab-buttons">
                ${companies.map((c, i) => `
                    <div class="tab-button-wrapper ${i === 0 ? 'active' : ''}">
                        <button class="tab-button ${i === 0 ? 'active' : ''}" onclick="switchCompanyTab('${escapeHtml(c.name)}', ${i})">
                            ${escapeHtml(c.name)} <span class="tab-badge">${c.certificate_count || 0}</span>
                    </button>
                        <button class="tab-delete-btn" onclick="confirmDeleteCompany('${escapeHtml(c.name)}', event)">&times;</button>
                    </div>
                `).join('')}
            </div>
            <div class="tab-content">
                ${companies.map((c, i) => `<div class="tab-panel ${i === 0 ? 'active' : ''}" id="tab-${escapeHtml(c.name)}"><div class="loading"><div class="spinner"></div></div></div>`).join('')}
            </div>
        </div>
    `;
    if (companies.length > 0) loadCompanyData(companies[0].name);
}

function showAddCompanyModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="modal-header"><h2>新增公司</h2><button class="btn-close" onclick="closeModal()">×</button></div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">公司名称</label>
                <input type="text" class="form-input" id="new-company-name" placeholder="请输入公司全称">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="addCompany()">确认新增</button>
        </div>
    `;
    modal.classList.add('open');
}

async function addCompany() {
    const name = document.getElementById('new-company-name').value.trim();
    if (!name) return showToast('请输入公司名称', 'warning');
    try {
        const r = await fetch('/api/company-names', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await r.json();
        if (data.success) { showToast('公司已新增', 'success'); closeModal(); await updateCompanySelectors(); if (document.getElementById('companies-view').classList.contains('active')) loadCompanies(); }
        else showToast(data.error || '新增失败', 'error');
    } catch (e) { showToast('请求失败', 'error'); }
}

function confirmDeleteCompany(name, event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="modal-header"><h2>确认删除</h2><button class="btn-close" onclick="closeModal()">×</button></div>
        <div class="modal-body"><p>确定要删除公司 <strong>${name}</strong> 的所有资质数据吗？</p></div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-danger" onclick="deleteCompanyData('${name}')">确认删除数据</button>
            <button class="btn btn-warning" onclick="deleteCompanyName('${name}')">仅从名单删除</button>
        </div>
    `;
    modal.classList.add('open');
}

async function deleteCompanyData(name) {
    try {
        const r = await fetch(`/api/companies/${encodeURIComponent(name)}`, { method: 'DELETE' });
        const data = await r.json();
        if (data.success) { showToast('数据已删除', 'success'); closeModal(); loadCompanies(); }
        else showToast('删除失败', 'error');
    } catch (e) { showToast('网络错误', 'error'); }
}

async function deleteCompanyName(name) {
    try {
        const r = await fetch(`/api/company-names/${encodeURIComponent(name)}`, { method: 'DELETE' });
        const data = await r.json();
        if (data.success) { showToast('公司已从名单删除', 'success'); closeModal(); await updateCompanySelectors(); if (document.getElementById('companies-view').classList.contains('active')) loadCompanies(); }
        else showToast('删除失败', 'error');
    } catch (e) { showToast('网络错误', 'error'); }
}

async function updateCompanySelectors() {
    try {
        const r = await fetch('/api/company-names');
        const data = await r.json();
        if (data.success) {
            const names = data.companies;
            const companySelect = document.getElementById('company-select');
            if (companySelect) {
                const cur = companySelect.value;
                companySelect.innerHTML = names.map(n => `<option value="${n}" ${n === cur ? 'selected' : ''}>${n}</option>`).join('');
                if (!names.includes(cur) && names.length > 0) companySelect.value = names[0];
            }
            const targetSelect = document.getElementById('compare-target-company');
            const refSelect = document.getElementById('compare-ref-company');
            if (targetSelect && refSelect) {
                const options = '<option value="">请选择公司</option>' + names.map(n => `<option value="${n}">${n}</option>`).join('');
                targetSelect.innerHTML = options; refSelect.innerHTML = options;
            }
        }
    } catch (e) {}
}

function switchCompanyTab(name, index) {
    document.querySelectorAll('.tab-button-wrapper').forEach((b, i) => b.classList.toggle('active', i === index));
    document.querySelectorAll('.tab-panel').forEach((p, i) => p.classList.toggle('active', i === index));
    loadCompanyData(name);
}

async function loadCompanyData(name) {
    const panel = document.getElementById(`tab-${name}`);
    if (!panel) return;
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
        const r = await fetch(`/api/companies/${encodeURIComponent(name)}`);
        const data = await r.json();
        if (data.success) renderCompanyCertificates(data, panel);
        else panel.innerHTML = `<div class="empty-text">${data.error}</div>`;
    } catch (e) { panel.innerHTML = '<div class="empty-text">加载失败</div>'; }
}

function renderCompanyCertificates(data, container) {
    const certs = data.certificates || [];
    if (certs.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-title">暂无资质信息</div></div>`;
        return;
    }
    container.innerHTML = `
        <div class="company-header"><h2>${data.company_name}</h2><div class="company-meta"><span>更新: ${formatDate(data.last_updated)}</span></div></div>
        <div class="certificates-list">${certs.map((c, i) => renderCertificateCard(c, i, data.company_name)).join('')}</div>
    `;
}

function renderCertificateCard(c, i, companyName) {
    const detailsId = `details-${companyName.replace(/\s+/g, '')}-${i}`;
    return `
        <div class="certificate-card">
            <div class="certificate-header clickable" onclick="toggleCertificateCard('${detailsId}')">
                <h3>${c.task_name}</h3><span>${c.total_count} 个证书</span>
                </div>
            <div id="${detailsId}" class="certificate-details-container" style="display:none">
                    <div class="certificate-details">
                    ${(c.certificates||[]).map(cert => `
                        <div class="cert-detail-item">
                            <div class="cert-detail-row"><span class="cert-label">资质:</span><span class="cert-value">${cert['资质名称']||cert['证书名称']||'N/A'}</span></div>
                            <div class="cert-detail-row"><span class="cert-label">等级:</span><span class="cert-value">${cert['资质等级']||'N/A'}</span></div>
                            <div class="cert-detail-row"><span class="cert-label">编号:</span><span class="cert-value">${cert['证书编号']||'N/A'}</span></div>
                            </div>
                        `).join('')}
                    </div>
            </div>
        </div>
    `;
}

function toggleCertificateCard(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ==================== 配置 ====================
async function loadConfig() {
    const container = document.getElementById('config-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
        const r = await fetch('/api/config');
        const data = await r.json();
        if (data.success) {
            container.innerHTML = `
                <div class="config-section"><h3>🌐 浏览器配置</h3>${Object.entries(data.browser).map(([k, v]) => `<div class="config-item"><span class="config-key">${k}</span><span class="config-value">${JSON.stringify(v)}</span></div>`).join('')}</div>
                <div class="config-section"><h3>🤖 大模型配置</h3>${Object.entries(data.llm).map(([k, v]) => `<div class="config-item"><span class="config-key">${k}</span><span class="config-value">${v}</span></div>`).join('')}</div>
                <div class="config-section">
                    <h3>🏢 公司名单管理</h3>
                    <div id="company-name-management" class="company-names-list">加载中...</div>
                    <div class="add-company-form">
                        <input id="manage-new-company" class="form-input" placeholder="输入公司全称">
                        <button class="btn btn-primary" onclick="manageAddCompany()">添加</button>
                        </div>
                </div>
            `;
            renderCompanyNameManagement();
        }
    } catch (e) { container.innerHTML = '加载失败'; }
}

async function renderCompanyNameManagement() {
    const el = document.getElementById('company-name-management');
    try {
        const r = await fetch('/api/company-names');
        const data = await r.json();
        if (data.success) {
            el.innerHTML = data.companies.map(n => `
                <div class="company-name-item">
                    <span>${escapeHtml(n)}</span>
                    <button class="btn btn-danger btn-sm" onclick="manageDeleteCompany('${escapeHtml(n)}')">删除</button>
                </div>
            `).join('') || '暂无公司';
}
    } catch (e) { el.innerHTML = '加载失败'; }
}

async function manageAddCompany() {
    const name = document.getElementById('manage-new-company').value.trim();
    if (!name) return showToast('请输入公司名称', 'warning');
    try {
        const r = await fetch('/api/company-names', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await r.json();
        if (data.success) { showToast('添加成功', 'success'); document.getElementById('manage-new-company').value = ''; renderCompanyNameManagement(); updateCompanySelectors(); }
        else showToast(data.error, 'error');
    } catch (e) {}
}

async function manageDeleteCompany(name) {
    if (!confirm(`确定删除 "${name}" 吗？`)) return;
    try {
        const r = await fetch(`/api/company-names/${encodeURIComponent(name)}`, { method: 'DELETE' });
        const data = await r.json();
        if (data.success) { showToast('已删除', 'success'); renderCompanyNameManagement(); updateCompanySelectors(); }
    } catch (e) {}
}

// ==================== 资质对比 ====================
async function loadCompareView() {
    await updateCompanySelectors();
}

async function runComparison() {
    const target = document.getElementById('compare-target-company').value;
    const ref = document.getElementById('compare-ref-company').value;
    if (!target) return showToast('请选择己方公司', 'error');
    if (target === ref) return showToast('不能与相同公司对比', 'error');
    
    const div = document.getElementById('compare-result');
    div.innerHTML = '<div class="loading"><div class="spinner"></div><p>分析中...</p></div>';
    try {
        const r = await fetch('/api/compare', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ target_company: target, reference_company: ref })
        });
        const data = await r.json();
        if (data.success) renderCompareResult(data, target, ref);
        else div.innerHTML = `<div class="empty-text">${data.error}</div>`;
    } catch (e) { div.innerHTML = '请求失败'; }
}

function renderCompareResult(data, target, ref) {
    const div = document.getElementById('compare-result');
    const s = data.summary || {};
    div.innerHTML = `
        <div class="compare-summary">
            <h3>📊 对比概述</h3>
            <p>共 ${s.total} 项，己方 ${s.target_has} 项，对方 ${s.ref_has} 项。</p>
            <button class="btn btn-primary" onclick="exportCompareExcel('${escapeHtml(target)}', '${escapeHtml(ref)}')">📥 导出Excel</button>
        </div>
        <div class="compare-table-container">
            <table class="compare-table">
                <thead><tr><th>资质名称</th><th>己方等级</th><th>对方等级</th><th>对比概述</th></tr></thead>
                <tbody>
                    ${(data.comparison||[]).map(row => `
                        <tr>
                            <td>${escapeHtml(row.qualification_name)}</td>
                            <td class="${row.target_has ? 'has-cert' : 'no-cert'}">${row.target_level||(row.target_has?'具有':'无')}</td>
                            <td class="${row.ref_has ? 'has-cert' : 'no-cert'}">${row.ref_level||(row.ref_has?'具有':'无')}</td>
                            <td>${escapeHtml(row.overview)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function exportCompareExcel(target, ref) {
    try {
        const r = await fetch('/api/compare/export', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ target_company: target, reference_company: ref })
        });
        const data = await r.json();
        if (data.success) { window.location.href = data.download_url; showToast('导出成功', 'success'); }
    } catch (e) {}
}

// ==================== 工具 ====================
function closeModal() {
    document.getElementById('modal').classList.remove('open');
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function formatDate(iso) {
    if (!iso) return '未知';
    return new Date(iso).toLocaleString('zh-CN');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeTaskDetail(); }
});
