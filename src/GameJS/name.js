// 实名认证模块
window.onload = function() {
    // 检查本地存储是否已有认证记录
    const isAuthenticated = localStorage.getItem('hasAuthenticated') === 'true';
    
    if (isAuthenticated) {
        // 已认证用户直接显示开始界面
        document.getElementById('mask').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
    } else {
        // 新用户显示认证界面
        document.getElementById('mask').style.display = 'flex';
        document.getElementById('startScreen').style.display = 'none';
    }
};

async function doValidation() {
    const name = document.getElementById('name').value.trim();
    const idcard = document.getElementById('idcard').value.trim();
    const errorMsg = document.getElementById('errorMsg');

    errorMsg.style.display = 'none';

    // 验证逻辑
    if (!name) return showError('请输入真实姓名');
    if (!/^\d{17}[\dXx]$/.test(idcard)) return showError('身份证格式不正确');

    try {
        const response = await fetch(
            `http://app.nlc.cn/open/online/getSsoIdCard?name=${encodeURIComponent(name)}&idcard=${encodeURIComponent(idcard)}`
        );
        const data = await response.text();

        if (data.includes('成功')) {
            // 认证成功处理
            localStorage.setItem('hasAuthenticated', 'true'); // 存储认证状态
            document.getElementById('mask').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
        } else {
            showError('认证失败:请确认实名信息正确，并且为成年人');
        }
    } catch (error) {
        showError(`网络错误：${error.message}`);
    }
}

function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}