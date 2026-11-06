// DAGBO · Spike trading + pre/post news engines
async function renderSpike(c) {
    c.innerHTML = `<div class="p-4"><div class="rounded-3xl bg-darkSurface border border-amber-500/30 p-6 text-center"><div class="text-accentGold text-xs font-bold">⚡ SPIKE TRADER</div><div class="text-slate-400 text-xs mt-2">Loading Calendar...</div></div></div>`;
    let events = await fetchNews();
    let isLive = true;
    if (!events || events.length === 0) { events = fallbackEvents(); isLive = false; }
    const now = Date.now();
    const upcoming = events.filter(e => e.date.getTime() > now - 3600000);

    let h = `<div class="p-4 space-y-3">
        <div class="rounded-3xl bg-gradient-to-br from-amber-500/10 to-darkSurface border border-amber-500/30 p-5">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold uppercase text-accentGold">⚡ SPIKE TRADER</span>
                <span class="text-[10px] ${isLive ? 'bg-accentGreen/20 text-accentGreen' : 'bg-accentRed/20 text-accentRed'} px-2 py-0.5 rounded-full font-bold">${isLive ? '● Live Feed' : '● Offline'}</span>
            </div>
            <p class="text-[10px] text-slate-400">15m Pre-News Setup • Post-News Retest Engine</p>
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
                <button onclick="openSpikePlan('${ev.title.replace(/'/g, "\\'")}','${ev.currency}','${ev.forecast}','${ev.previous}',${ev.date.getTime() - now})" class="w-full py-2.5 rounded-xl bg-accentGold/20 border border-accentGold/50 text-accentGold font-bold text-xs hover:bg-accentGold/30 transition">🎯 Spike Trading Plan</button>
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
    const sys = `You are DAGBO Spike AI. News in 15 mins: ${ev.title}. Output ONLY JSON: {"signal":"BUY","symbol":"GOLD","confidence":85,"reasoning":"...","entry":4061,"stopLoss":4051,"takeProfit":4081,"strategy":"DXY","pattern":"FVG","indicators":"RSI"}`;
    try { const reply = await aiCall(sys, 'Generate Spike Signal.', false); const sig = JSON.parse(reply.match(/\{[\s\S]*\}/)[0]); renderSignalCard(sig, true); } catch (e) { showToast('Could not calculate spike.', 'error'); }
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

function openSpikePlan(title, cur, forecast, previous, msUntil) {
    const gold = STATE.marketData['GOLD']?.price || 4061.52;
    const dec = getDecimals('GOLD');
    const _fNum = parseFloat(String(forecast).replace(/[^0-9.\-]/g, '')) || 0;
    const _pNum = parseFloat(String(previous).replace(/[^0-9.\-]/g, '')) || 0;
    const dir = (_fNum === 0 && _pNum === 0) ? 'BUY' : (_fNum >= _pNum ? 'BUY' : 'SELL');
    const sl = dir === 'BUY' ? gold - 8 : gold + 8;
    const tp = dir === 'BUY' ? gold + 16 : gold - 16;
    openModal(`<div class="space-y-4"><div class="flex justify-between items-center"><h3 class="font-heading font-bold text-sm text-white">Spike Plan</h3><button onclick="closeModal()" class="text-xs text-slate-400">✕</button></div>
        <div class="rounded-2xl bg-darkBg border border-accentGold/30 p-4"><div class="text-[11px] text-slate-400">${cur} · ${title}</div><div class="text-sm font-bold text-white mt-1">Bias: ${dir} Gold</div></div>
        <div class="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div class="bg-darkBg p-2 rounded-xl border border-darkBorder"><span class="text-slate-400 text-[9px]">Entry</span><div class="font-bold text-white">$${fmtPrice(gold, dec)}</div></div>
            <div class="bg-darkBg p-2 rounded-xl border border-darkBorder"><span class="text-slate-400 text-[9px]">SL</span><div class="font-bold text-accentRed">$${fmtPrice(sl, dec)}</div></div>
            <div class="bg-darkBg p-2 rounded-xl border border-darkBorder"><span class="text-slate-400 text-[9px]">TP</span><div class="font-bold text-accentGreen">$${fmtPrice(tp, dec)}</div></div>
        </div>
        <div class="space-y-2 text-[11px]">
            <div class="rounded-xl bg-darkSurface border border-darkBorder p-3"><div class="text-accentRed font-bold mb-1">During Spike (0-5 mins)</div><div class="text-slate-300">Do NOT chase. Wait for the wick to form. The app is watching DXY vs Gold 30m correlation.</div></div>
            <div class="rounded-xl bg-accentGreen/10 border border-accentGreen/30 p-3"><div class="text-accentGreen font-bold mb-1">The Retest (5-15 mins)</div><div class="text-slate-300">Wait for price to pull back. Enter ${dir} with SL beyond the spike wick and TP at 1:2 RR.</div></div>
        </div>
        <button onclick="closeModal(); openChecklist('GOLD', '${dir}', ${gold}, ${sl}, ${tp}, ${finalLot('GOLD', 8)}, '15M')" class="w-full py-3 rounded-xl bg-accentGold text-black font-extrabold text-sm">🎯 Pre-fill Trade in Checklist</button></div>`);
}
