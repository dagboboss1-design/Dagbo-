// DAGBO · Spike trading + pre/post news engines + PRO Bias Calculator

async function renderSpike(c) {
    c.innerHTML = `<div class="p-4"><div class="rounded-3xl bg-darkSurface border border-amber-500/30 p-6 text-center"><div class="text-accentGold text-xs font-bold">⚡ SPIKE TRADER PRO</div><div class="text-slate-400 text-xs mt-2">Loading Calendar...</div></div></div>`;
    let events = await fetchNews();
    let isLive = true;
    if (!events || events.length === 0) { events = fallbackEvents(); isLive = false; }
    const now = Date.now();
    const upcoming = events.filter(e => e.date.getTime() > now - 3600000);

    let h = `<div class="p-4 space-y-3">
        <div class="rounded-3xl bg-gradient-to-br from-amber-500/10 to-darkSurface border border-amber-500/30 p-5">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold uppercase text-accentGold">⚡ SPIKE TRADER PRO</span>
                <span class="text-[10px] ${isLive ? 'bg-accentGreen/20 text-accentGreen' : 'bg-accentRed/20 text-accentRed'} px-2 py-0.5 rounded-full font-bold">${isLive ? '● Live Feed' : '● Offline'}</span>
            </div>
            <p class="text-[10px] text-slate-400">Pre-Bias 30-70% • Trap Detection • Multi-Asset Medians</p>
        </div>`;

    if (upcoming.length === 0) {
        h += `<div class="rounded-3xl bg-darkSurface border border-darkBorder p-6 text-center text-xs text-slate-400">No High impact news scheduled right now.</div>`;
    } else {
        upcoming.forEach(ev => {
            const pred = calcPrediction(ev);
            const bColor = pred.bias === 'BULLISH' ? 'text-accentGreen' : pred.bias === 'BEARISH' ? 'text-accentRed' : 'text-slate-400';
            const impactBadge = ev.impact === 'High' ? 'bg-accentRed/20 text-accentRed' : 'bg-accentGold/20 text-accentGold';
            h += `<div class="rounded-3xl bg-darkSurface border border-darkBorder p-5 space-y-3">
                <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-2 flex-wrap gap-1">
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold ${impactBadge}">${ev.impact.toUpperCase()}</span>
                        <span class="text-xs font-bold text-white">${esc(ev.title)}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${ev.currency}</span>
                    </div>
                    <span class="news-cd text-accentBlue font-mono text-[10px] font-bold" data-time="${ev.date.getTime()}">T-...</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div class="bg-darkBg p-2 rounded-xl border border-darkBorder"><span class="text-[9px] text-slate-500 block">Forecast</span><span class="text-white font-bold">${ev.forecast}</span></div>
                    <div class="bg-darkBg p-2 rounded-xl border border-darkBorder"><span class="text-[9px] text-slate-500 block">Previous</span><span class="text-slate-300 font-bold">${ev.previous}</span></div>
                    <div class="bg-darkBg p-2 rounded-xl border border-darkBorder"><span class="text-[9px] text-slate-500 block">Bias</span><span class="font-bold ${bColor}">${pred.bias}</span></div>
                </div>
                <div class="text-[10px] text-slate-400 bg-darkBg p-2.5 rounded-xl border border-darkBorder leading-snug"><strong class="text-slate-300">What it is:</strong> ${ev.description || 'High impact economic event.'}</div>
                <button onclick="openProBiasModal('${ev.title.replace(/'/g, "\\'")}','${ev.currency}','${ev.forecast}','${ev.previous}',${ev.date.getTime() - now})" class="w-full py-2.5 rounded-xl bg-accentGold/20 border border-accentGold/50 text-accentGold font-bold text-xs hover:bg-accentGold/30 transition">🎯 Calculate Pre-News Bias</button>
            </div>`;
        });
    }
    h += '</div>';
    c.innerHTML = h;
    startNewsCountdown();
}

let spikeTimer = null;
function startNewsCountdown() {
    if (spikeTimer) clearInterval(spikeTimer);
    spikeTimer = setInterval(() => {
        const now = Date.now();
        document.querySelectorAll('.news-cd').forEach(el => {
            const target = parseInt(el.getAttribute('data-time'));
            const diff = target - now;
            if (diff < 0) { el.innerText = 'PASSED'; el.className = 'text-slate-500 font-mono text-[10px] font-bold news-cd'; }
            else {
                const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
                if (h > 0) el.innerText = `T-${h}h ${m}m`;
                else el.innerText = `T-${m}m ${s}s`;
                if (diff < 15 * 60000) el.className = 'text-accentRed animate-pulse font-mono text-[10px] font-bold news-cd';
                else el.className = 'text-accentBlue font-mono text-[10px] font-bold news-cd';
            }
        });
    }, 1000);
}

// --- PRO BIAS CALCULATOR ---
function openProBiasModal(title, cur, forecast, previous, msUntil) {
    const goldPrice = STATE.marketData['GOLD']?.price || 4061.52;
    const dxyPrice = STATE.marketData['DXY']?.price || 104.50;
    const dec = getDecimals('GOLD');
    
    // Auto-fill 30m % change (mock calculation based on sparkline if available)
    const goldSpark = STATE.marketData['GOLD']?.sparkline || [goldPrice];
    const dxySpark = STATE.marketData['DXY']?.sparkline || [dxyPrice];
    const gold30mChange = goldSpark.length > 2 ? (((goldPrice - goldSpark[0]) / goldSpark[0]) * 100).toFixed(2) : '0.00';
    const dxy30mChange = dxySpark.length > 2 ? (((dxyPrice - dxySpark[0]) / dxySpark[0]) * 100).toFixed(2) : '0.00';

    openModal(`<div class="space-y-4">
        <div class="flex justify-between items-center">
            <div><h3 class="font-heading font-bold text-sm text-white">Global Spike PRO</h3><p class="text-[9px] text-slate-400">${cur} · ${title}</p></div>
            <button onclick="closeModal()" class="text-xs text-slate-400">✕</button>
        </div>
        
        <div class="rounded-xl bg-darkBg border border-darkBorder p-3 space-y-1">
            <div class="flex justify-between text-[10px]"><span class="text-slate-400">Live Context:</span><span class="text-white font-bold">30-70% Cap (Pre-News)</span></div>
        </div>

        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[9px] text-slate-400 block mb-1">DXY 30m %</label>
                    <input type="number" id="proDxy" value="${dxy30mChange}" step="0.01" class="w-full bg-darkBg text-white text-xs px-2 py-2 rounded-lg border border-darkBorder">
                    <span class="text-[8px] text-accentGreen mt-1 block">-0.20 weak = BUY Gold</span>
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 block mb-1">Asset 30m %</label>
                    <input type="number" id="proAsset" value="${gold30mChange}" step="0.01" class="w-full bg-darkBg text-white text-xs px-2 py-2 rounded-lg border border-darkBorder">
                    <span class="text-[8px] text-accentGreen mt-1 block">+0.25 up = BUY</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[9px] text-slate-400 block mb-1">Leading (ADP)</label>
                    <select id="proAdp" class="w-full bg-darkBg text-white text-xs px-2 py-2 rounded-lg border border-darkBorder">
                        <option value="neutral">Neutral</option>
                        <option value="bullish">Bullish (Strong)</option>
                        <option value="bearish">Bearish (Weak)</option>
                    </select>
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 block mb-1">Risk VIX</label>
                    <select id="proVix" class="w-full bg-darkBg text-white text-xs px-2 py-2 rounded-lg border border-darkBorder">
                        <option value="neutral">Neutral</option>
                        <option value="risk_on">Risk-On (Good)</option>
                        <option value="risk_off">Risk-Off (Bad)</option>
                    </select>
                </div>
            </div>
        </div>

        <button onclick="calculateProBias()" class="w-full py-3 rounded-xl bg-accentBlue text-white font-bold text-xs shadow-lg">Calculate Pre-Bias</button>

        <div id="proResult" class="hidden rounded-xl bg-darkSurface border-2 border-accentGold p-4 text-center space-y-1">
            <div class="text-[10px] text-slate-400 uppercase tracking-wider">Bias Result</div>
            <div id="proDirection" class="text-lg font-extrabold text-white">WAITING...</div>
            <div id="proConfidence" class="text-xs font-bold text-accentGold">0% Confidence</div>
        </div>

        <button onclick="closeModal(); openChecklist('GOLD', 'BUY', ${goldPrice}, ${goldPrice - 8}, ${goldPrice + 16}, ${finalLot('GOLD', 8)}, '15M')" id="proExecuteBtn" class="hidden w-full py-3 rounded-xl bg-accentGreen text-white font-extrabold text-sm mt-2">🎯 Pre-fill Trade in Checklist</button>
    </div>`);
}

function calculateProBias() {
    const dxy = parseFloat(document.getElementById('proDxy').value) || 0;
    const asset = parseFloat(document.getElementById('proAsset').value) || 0;
    const adp = document.getElementById('proAdp').value;
    const vix = document.getElementById('proVix').value;

    let bias = 'NEUTRAL';
    let confidence = 50;

    // Logic for Pre-News Bias
    if (dxy < 0 && asset > 0) { bias = 'BUY GOLD'; confidence = 65; }
    else if (dxy > 0 && asset < 0) { bias = 'SELL GOLD'; confidence = 65; }
    else if (dxy < 0 && asset < 0) { bias = 'WAIT'; confidence = 40; }
    else if (dxy > 0 && asset > 0) { bias = 'WAIT'; confidence = 40; }

    // ADP Adjustment
    if (adp === 'bullish' && bias === 'BUY GOLD') confidence += 5;
    if (adp === 'bearish' && bias === 'SELL GOLD') confidence += 5;

    // VIX Adjustment
    if (vix === 'risk_on') confidence += 5;
    if (vix === 'risk_off') confidence -= 5;

    // Cap at 30-70% for Pre-News
    confidence = Math.max(30, Math.min(70, confidence));

    const resDiv = document.getElementById('proResult');
    const dirDiv = document.getElementById('proDirection');
    const confDiv = document.getElementById('proConfidence');
    const execBtn = document.getElementById('proExecuteBtn');

    resDiv.classList.remove('hidden');
    dirDiv.innerText = bias;
    confDiv.innerText = `${confidence}% Confidence`;

    if (bias === 'BUY GOLD') {
        dirDiv.className = 'text-lg font-extrabold text-accentGreen';
        execBtn.classList.remove('hidden');
    } else if (bias === 'SELL GOLD') {
        dirDiv.className = 'text-lg font-extrabold text-accentRed';
        // Update button for SELL
        execBtn.classList.remove('hidden');
        const goldPrice = STATE.marketData['GOLD']?.price || 4061.52;
        execBtn.onclick = () => { closeModal(); openChecklist('GOLD', 'SELL', goldPrice, goldPrice + 8, goldPrice - 16, finalLot('GOLD', 8), '15M'); };
    } else {
        dirDiv.className = 'text-lg font-extrabold text-slate-400';
        execBtn.classList.add('hidden');
    }
}

// --- AUTOMATED SIGNALS (Background) ---
async function generatePreSpikeSignal(ev) {
    showToast(`⚡ 15m to ${ev.title}! Calculating Spike...`, 'info');
    vib([500, 200, 500], true);
    speak(`15 minutes to ${ev.title}.`, true);
    const dxy = STATE.marketData['DXY'], gold = STATE.marketData['GOLD'];
    if (dxy && gold && dxy.sparkline && gold.sparkline) {
        const dxyLast30 = dxy.sparkline.slice(-30), goldLast30 = gold.sparkline.slice(-30);
        const dxyChange = dxyLast30.length > 1 ? dxyLast30[dxyLast30.length - 1] - dxyLast30[0] : 0;
        const goldChange = goldLast30.length > 1 ? goldLast30[goldLast30.length - 1] - goldLast30[0] : 0;
        let sigType = 'BUY', reason = 'DXY weakening + Gold momentum up.';
        if (dxyChange > 0 && goldChange < 0) { sigType = 'SELL'; reason = 'DXY strengthening + Gold momentum down.'; }
        else if (dxyChange > 0 && goldChange > 0) { sigType = 'BUY'; reason = 'DXY strong but Gold ignoring. Bullish divergence.'; }
        const price = gold.price, sl = sigType === 'BUY' ? price - 5 : price + 5, tp = sigType === 'BUY' ? price + 10 : price - 10;
        renderSignalCard({ signal: sigType, symbol: 'GOLD', timeframe: '5M', confidence: 78, reasoning: reason, entry: price, stopLoss: sl, takeProfit: tp, strategy: 'DXY 30m Correlation', pattern: 'Spike Pre-Entry', indicators: 'DXY + XAU 30m' }, true);
        return;
    }
}

async function generatePostSpikeSignal(ev) {
    showToast(`🌊 ${ev.title} released! Generating Retest...`, 'info');
    vib([300, 100, 300], true);
    const gold = STATE.marketData['GOLD'];
    if (gold) {
        const price = gold.price;
        renderSignalCard({ signal: 'BUY', symbol: 'GOLD', timeframe: '15M', confidence: 75, reasoning: 'News just released. Wait for price to pull back to the broken level (FVG), then enter in the direction of the news.', entry: price, stopLoss: price - 8, takeProfit: price + 16, strategy: 'FVG Retest', pattern: 'Break & Retest', indicators: 'Volume' }, false, true);
    }
}
