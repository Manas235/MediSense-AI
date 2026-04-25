// Application State bindings for frontend
let state = {
    heartRate: 72,
    spo2: 98,
    temperature: 36.6,
    activity: 'Resting',
    status: 'normal',
    baselineHR: 72,
    healthScore: 100,
    hasShownEmergencyModal: false,
    history: {
        time: [],
        heartRate: []
    }
};

const els = {
    hrValue: document.getElementById('hrValue'),
    spo2Value: document.getElementById('spo2Value'),
    tempValue: document.getElementById('tempValue'),
    spo2Progress: document.getElementById('spo2Progress'),
    tempProgress: document.getElementById('tempProgress'),
    activityValue: document.getElementById('activityValue'),
    activityIcon: document.getElementById('activityIcon'),
    trendIndicator: document.getElementById('trendIndicator'),
    systemStatus: document.getElementById('systemStatus'),
    statusText: document.getElementById('statusText'),
    lastUpdated: document.getElementById('lastUpdated'),
    alertContainer: document.getElementById('alertContainer'),
    logsContainer: document.getElementById('logsContainer'),
    baseCurrentHR: document.getElementById('baseCurrentHR'),
    baseRollingHR: document.getElementById('baseRollingHR'),
    baseDeltaHR: document.getElementById('baseDeltaHR'),
    healthScoreDisplay: document.getElementById('healthScoreDisplay'),
    healthScoreBar: document.getElementById('healthScoreBar')
};

// Chart.js Configuration
const ctx = document.getElementById('hrChart').getContext('2d');
let gradient = ctx.createLinearGradient(0, 0, 0, 400);
gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');   
gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

const hrChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Heart Rate (bpm)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#3b82f6',
            pointRadius: 3,
            pointHoverRadius: 6
        },
        {
            label: 'Baseline Avg',
            data: [],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                suggestedMin: 60,
                suggestedMax: 100,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', maxTicksLimit: 10 }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(22, 30, 46, 0.9)',
                titleColor: '#fff',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }
        },
        animation: { duration: 400 }
    }
});

// Initialize historical tracker for the dashboard load
const now = new Date();
state.history.baselineHR = [];
for(let i=15; i>=0; i--) {
    const t = new Date(now.getTime() - i * 3000);
    state.history.time.push(t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}));
    const mockHR = 70 + Math.floor(Math.random() * 10);
    state.history.heartRate.push(mockHR);
    state.history.baselineHR.push(75);
}
hrChart.data.labels = state.history.time;
hrChart.data.datasets[0].data = state.history.heartRate;
hrChart.data.datasets[1].data = state.history.baselineHR;
hrChart.update();

// UI Notifications Engine
function addAlert(message, type = 'warning') {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    
    let icon = 'fa-exclamation-triangle';
    if(type === 'critical') icon = 'fa-skull-crossbones';
    
    alert.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    els.alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => alert.remove(), 300);
    }, 6000);

    addLog(message, type);
}

function addLog(msg, type = 'normal') {
    const log = document.createElement('div');
    log.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    log.innerHTML = `<span style="color:#94a3b8">[${time}]</span> ${msg}`;
    els.logsContainer.prepend(log);
}


/* FULL STACK ARCHITECTURE:
 * NO INTERNAL GENERATION ALGORITHMS. Strict fetching only. 
 */
async function fetchRealTimeData() {
    try {
        const response = await fetch(`/api/health?t=${new Date().getTime()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('API fetch failed');
        
        const liveData = await response.json();
        
        let oldStatus = state.status;

        // Populate standard state securely using 100% backend variables
        state.heartRate = liveData.heartRate;
        state.temperature = liveData.temperature;
        state.spo2 = liveData.spo2;
        state.activity = liveData.activity;
        state.status = liveData.status;
        state.baselineHR = liveData.baselineHR || state.heartRate;
        state.healthScore = liveData.healthScore !== undefined ? liveData.healthScore : 100;
        state.trend = liveData.trend || 'Stable';

        // Front-end notification parsing tied to Server-Side warnings.
        if (state.status !== 'normal' && liveData.issues && liveData.issues.length > 0 && (state.status !== oldStatus || Math.random() < 0.2)) {
            liveData.issues.forEach(iss => addAlert(iss, state.status));
        }
        
        updateUI();
    } catch (e) {
        console.error('Connection to MediSense Node.js API lost.', e);
        // addLog("Node Backend Offline - Awaiting Reconnection", "critical");
    }
}

// GUI Rendering Loop (Executes cleanly regardless of backend ping)
function updateUI() {
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    els.lastUpdated.innerText = `Last updated: ${timeStr}`;

    // HR Binding
    const oldHr = parseInt(els.hrValue.innerText) || state.heartRate;
    els.hrValue.innerText = state.heartRate;
    
    if(state.heartRate > oldHr) {
        els.hrValue.className = 'value update-up';
        setTimeout(()=> els.hrValue.className = 'value', 300);
    } else if (state.heartRate < oldHr) {
        els.hrValue.className = 'value update-down';
        setTimeout(()=> els.hrValue.className = 'value', 300);
    }

    state.history.time.push(timeStr);
    state.history.heartRate.push(state.heartRate);
    state.history.baselineHR.push(state.baselineHR);
    if(state.history.time.length > 20) {
        state.history.time.shift();
        state.history.heartRate.shift();
        state.history.baselineHR.shift();
    }
    hrChart.update();
    
    // Baseline Rendering
    if(els.baseCurrentHR) els.baseCurrentHR.innerText = state.heartRate;
    if(els.baseRollingHR) els.baseRollingHR.innerText = state.baselineHR;
    if(els.baseDeltaHR) {
        let delta = state.heartRate - state.baselineHR;
        let deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
        els.baseDeltaHR.innerText = deltaStr;
        if (delta > 25) els.baseDeltaHR.style.color = 'var(--accent-red)';
        else if (delta > 15) els.baseDeltaHR.style.color = 'var(--accent-yellow)';
        else els.baseDeltaHR.style.color = 'var(--accent-green)';
    }

    // Trend Binding
    if (els.trendIndicator) {
        els.trendIndicator.innerText = `Trend: ${state.trend}`;
        if (state.trend === 'Increasing') els.trendIndicator.style.color = '#ef4444';
        else if (state.trend === 'Decreasing') els.trendIndicator.style.color = '#3b82f6';
        else els.trendIndicator.style.color = 'var(--text-secondary)';
    }

    // SpO2 Binding
    els.spo2Value.innerText = state.spo2;
    els.spo2Progress.style.width = `${state.spo2}%`;
    if(state.spo2 < 92) els.spo2Progress.className = 'progress-bar critical';
    else if(state.spo2 <= 95) els.spo2Progress.className = 'progress-bar warning';
    else els.spo2Progress.className = 'progress-bar';

    // Health Score Binding
    if (els.healthScoreDisplay) {
        els.healthScoreDisplay.innerText = state.healthScore;
        els.healthScoreBar.style.width = `${state.healthScore}%`;
        if (state.healthScore >= 80) {
            els.healthScoreDisplay.style.color = 'var(--accent-green)';
            els.healthScoreBar.className = 'progress-bar'; 
        } else if (state.healthScore >= 50) {
            els.healthScoreDisplay.style.color = 'var(--accent-yellow)';
            els.healthScoreBar.className = 'progress-bar warning'; 
        } else {
            els.healthScoreDisplay.style.color = 'var(--accent-red)';
            els.healthScoreBar.className = 'progress-bar critical'; 
        }
    }

    // Temp Binding
    els.tempValue.innerText = state.temperature;
    let tempPercent = ((state.temperature - 35) / (42 - 35)) * 100;
    els.tempProgress.style.width = `${Math.min(100, Math.max(0, tempPercent))}%`;
    if(state.temperature > 39) els.tempProgress.className = 'progress-bar temp-bar critical';
    else if(state.temperature > 37.5) els.tempProgress.className = 'progress-bar temp-bar warning';
    else els.tempProgress.className = 'progress-bar temp-bar';

    // Activity Binding (Determined entirely by Backend)
    els.activityValue.innerText = state.activity;
    if (state.activity === 'Resting') els.activityIcon.innerHTML = '<i class="fa-solid fa-bed"></i>';
    else if (state.activity === 'Walking') els.activityIcon.innerHTML = '<i class="fa-solid fa-person-walking"></i>';
    else els.activityIcon.innerHTML = '<i class="fa-solid fa-person-running"></i>';

    // Status Engine Binding
    els.systemStatus.className = `system-status ${state.status}`;
    if(state.status === 'normal') {
        els.statusText.innerHTML = 'System Stable';
    } else if(state.status === 'warning') {
        els.statusText.innerHTML = 'Abnormal Condition Detected';
    } else {
        let contactName = localStorage.getItem('emergencyName') || 'Caregiver';
        els.statusText.innerHTML = `Emergency Alert Triggered <span style="font-size:0.85rem; margin-left:12px; color:#fca5a5;"><i class="fa-solid fa-satellite-dish fa-beat"></i> Notifying ${contactName}...</span>`;
        
        // Trigger Emergency Popup Modal if logically not already active
        const modal = document.getElementById('emergencyModal');
        if (modal && !state.hasShownEmergencyModal) {
            let mContact = document.getElementById('modalContactName');
            if (mContact) mContact.innerText = contactName;
            modal.style.display = 'flex';
            state.hasShownEmergencyModal = true;
        }
    }
    
    // Automatically close logic branch if the health fully recovers implicitly
    if (state.status === 'normal' && state.hasShownEmergencyModal) {
        state.hasShownEmergencyModal = false;
        const modal = document.getElementById('emergencyModal');
        if (modal && modal.style.display === 'flex') modal.style.display = 'none';
    }
    
    // Emergency Contacts Binding
    const emergencyCard = document.getElementById('emergencyContactCard');
    if (emergencyCard) {
        if (state.status === 'critical') {
            emergencyCard.style.border = '2px solid var(--accent-red)';
            emergencyCard.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.2)';
        } else {
            emergencyCard.style.border = '1px solid var(--card-border)';
            emergencyCard.style.boxShadow = 'none';
            document.getElementById('notifyStatus').style.display = 'none';
            document.getElementById('notifyBtn').style.display = 'inline-block';
        }
    }
}

// Engage Engine
updateUI();
loadContact();
setInterval(fetchRealTimeData, 2500);

// Quick Health Risk Form Logic (Frontend Standalone)
function toggleConditionDetails() {
    const val = document.getElementById('riskConditions').value;
    const detailsBox = document.getElementById('conditionDetails');
    if (val === 'yes') {
        detailsBox.style.display = 'grid';
    } else {
        detailsBox.style.display = 'none';
    }
}

function submitRisk() {
    // UI Placeholder
}

// LocalStorage Contact Logic
function loadContact() {
    const name = localStorage.getItem('emergencyName');
    const phone = localStorage.getItem('emergencyPhone');
    const display = document.getElementById('contactDisplay');
    const form = document.getElementById('contactFormContainer');
    const actions = document.getElementById('contactActions');

    if (name && phone) {
        form.style.display = 'none';
        display.innerHTML = `
            <div style="display:flex; flex-direction:column;">
                <span style="display: block; font-weight: bold; font-size: 1.1rem;">${name}</span>
                <span style="color: var(--text-secondary);"><i class="fa-solid fa-phone"></i> ${phone}</span>
            </div>
            <button onclick="editContact()" style="background: none; border: none; color: var(--accent-blue); cursor: pointer; text-decoration: underline;">Edit Profile</button>
        `;
        actions.style.display = 'flex';
    } else {
        form.style.display = 'block';
        display.innerHTML = `<span style="color: var(--text-secondary); font-style: italic;">No emergency contact added</span>`;
        actions.style.display = 'none';
    }
}

function saveContact() {
    const name = document.getElementById('contactNameInput').value.trim();
    const phone = document.getElementById('contactPhoneInput').value.trim();
    if (!name || !phone) {
        alert("Please provide both Name and Phone Number.");
        return;
    }
    localStorage.setItem('emergencyName', name);
    localStorage.setItem('emergencyPhone', phone);
    loadContact();
}

function editContact() {
    document.getElementById('contactNameInput').value = localStorage.getItem('emergencyName') || '';
    document.getElementById('contactPhoneInput').value = localStorage.getItem('emergencyPhone') || '';
    document.getElementById('contactFormContainer').style.display = 'block';
}

function notifyEmergency() {
    const phone = localStorage.getItem('emergencyPhone');
    document.getElementById('notifyBtn').style.display = 'none';
    document.getElementById('notifyStatus').style.display = 'inline-block';
    document.getElementById('notifyStatusPhone').innerText = phone;
}

function calculateRisk() {
    const age = parseInt(document.getElementById('riskAge').value) || 0;
    const smoking = document.getElementById('riskSmoking').value;
    const exercise = document.getElementById('riskExercise').value;
    const conditions = document.getElementById('riskConditions').value;
    const sleep = document.getElementById('riskSleep').value;
    
    let score = 0;
    let guidance = [];
    
    if (age > 50) score += 2;
    if (smoking === 'yes') {
        score += 2;
        guidance.push("Quit smoking to significantly lower cardiovascular/respiratory strain.");
    }
    if (exercise === 'low') {
        score += 1;
        guidance.push("Incorporate 30 minutes of daily cardiovascular exercise.");
    }
    if (sleep === 'poor') {
        score += 1;
        guidance.push("Adopt a strict sleep schedule aiming for 7-8 hours nightly.");
    }
    
    if (conditions === 'yes') {
        score += 2; // base penalty for condition
        const specific = document.getElementById('riskSpecificCondition').value;
        const status = document.getElementById('riskConditionStatus').value;
        
        if (status === 'uncontrolled') {
            score += 3;
            guidance.push(`Work actively with your doctor to control your ${specific} condition.`);
        }
        if (specific === 'heart') score += 1;
    }
    
    const resultBox = document.getElementById('riskResult');
    const levelText = document.getElementById('riskLevel');
    const suggestionText = document.getElementById('riskSuggestion');
    
    resultBox.style.display = 'block';
    
    let adviceHtml = '';
    if (guidance.length > 0) {
        adviceHtml = `<ul style="margin-top: 12px; padding-left: 20px; font-size: 0.95rem; color: #e2e8f0;">
            ${guidance.map(tip => `<li style="margin-bottom: 4px;">${tip}</li>`).join('')}
        </ul>`;
    }
    
    if (score >= 4) {
        resultBox.className = 'risk-result high';
        levelText.innerText = 'High Risk';
        suggestionText.innerHTML = `<strong>Immediate Action Required:</strong> Please consult a healthcare professional. Start lowering your risk by taking these actions:${adviceHtml}`;
    } else if (score >= 2) {
        resultBox.className = 'risk-result moderate';
        levelText.innerText = 'Moderate Risk';
        suggestionText.innerHTML = `<strong>Action Required:</strong> You possess measurable risk factors. You can improve your baseline trajectory right now by considering:${adviceHtml}`;
    } else {
        resultBox.className = 'risk-result low';
        levelText.innerText = 'Low Risk';
        suggestionText.innerHTML = `Maintain a healthy lifestyle! Keep up the excellent work.`;
    }
}

async function forceTrend(mode) {
    try {
        const response = await fetch('/api/health/trend_override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode })
        });
        if (response.ok) {
            addLog(`Simulation trajectory successfully shifted to: [${mode}]`, 'warning');
            fetchRealTimeData();
        }
    } catch (e) {
        console.error('Failed to override algorithmic trend', e);
    }
}

// Manual Vitals Override
async function submitOverride() {
    const hrVal = parseInt(document.getElementById('overrideHR').value);
    if (!hrVal) return;
    
    try {
        const response = await fetch('/api/health/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heartRate: hrVal })
        });
        
        if (response.ok) {
            addLog(`Manual graph override: Heart Rate forcefully shifted to ${hrVal} bpm`, 'warning');
            fetchRealTimeData();
        }
    } catch (e) {
        console.error('Failed to send HTTP override', e);
    }
}
