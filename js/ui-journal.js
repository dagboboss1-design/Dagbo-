// DAGBO · Journal + AI coach + export
async function analyzeJournal() {
    const closed = STATE.trades.filter(t => t.status !== 'OPEN');
    if (closed.length === 0) { showToast('No closed trades to analyze.', 'error'); return; }
    let summary = "Here are my recent closed trades:\n";
    closed.slice(0, 15).forEach(t => { summary += `${t.type} ${t.symbol} (${t.tf}): Entry $${t.entry}, Exit Status: ${t.status}, PnL: $${t.pnl}, Emotion: ${t.emotion}, Note: "${t.note}"\n`; });
    const sys = `Analyze my trading performance based on these recent trades. Identify my weaknesses, my best pairs, and how my emotions (FOMO, Revenge, etc.) affect my PnL. Give me 3 strict rules to improve.`;
    openModal(`<div class="space-y-4 text-center py-8"><div class="text-4xl animate-spin">🧠</div><div class="text-sm text-white font-bold">AI Coach is analyzing your trades...</div></div>`);
    try {
        const reply = await aiCall(sys, summary, true);
        openModal(`<div class="space-y-4"><div class="flex justify-between items-center"><h3 class="font-heading font-bold text-sm text-white">🧠 AI Trade Coach</h3><button onclick="closeModal()" class="text-xs text-slate-400">✕</button></div><div class="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-darkBg p-4 rounded-xl border border-darkBorder max-h-96 overflow-y-auto">${esc(reply).replace(/\n/g, '<br>')}</div><button onclick="closeModal()" class="w-full py-3 rounded-xl bg-accentBlue text-white font-bold text-sm">Close</button></div>`);
    } catch (e) { showToast('AI Offline', 'error'); closeModal(); }
}

function renderJournal(c) {
    const closed = STATE.trades.filter(t => t.status !== 'OPEN');
    const tp = closed.reduce((a, t) => a + t.pnl, 0);
    const wins = closed.filter(t => t.pnl > 0);
    const losses = closed.filter(t => t.pnl < 0);
    const winRate = closed.length ? (wins.length / closed.length) : 0;
    const avgWin = wins.length ? (wins.reduce((a, b) => a + Math.abs(b.pnl), 0) / wins.length) : 0;
    const avgLoss = losses.length ? (losses.reduce((a, b) => a + Math.abs(b.pnl), 0) / losses.length) : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    const profitFactor = avgLoss > 0 ? ((wins.length * avgWin) / (losses.length * avgLoss)) : 0;
    const emoStats = {};
    closed.forEach(t => { if (t.emotion) { if (!emoStats[t.emotion]) emoStats[t.emotion] = { w: 0, l: 0 }; if (t.pnl > 0) emoStats[t.emotion].w++; else emoStats[t.emotion].l++; } });
    const emoHtml = Object.keys(emoStats).map(e => { const s = emoStats[e]; const wr = Math.round((s.w / (s.w + s.l)) * 100); return `<div class="flex justify-between text-[10px] text-slate-400"><span>${e}</span><span class="${wr >= 50 ? 'text-accentGreen' : 'text-accentRed'}">${wr}%</span></div>`; }).join('');
    const totalR = closed.reduce((a, t) => { const risk = Math.abs(t.entry - t.sl) * t.lots * getMultiplier(t.symbol) || 1; return a + (t.pnl / risk); }, 0);
    const proExpectancy = closed.length ? (totalR / closed.length).toFixed(2) : '0.00';
    const emoCount = {};
    closed.forEach(t => { if (t.emotion) emoCount[t.emotion] = (emoCount[t.emotion] || 0) + 1; });
    const topEmotion = Object.entries(emoCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Confident';
    const bestPairMap = {};
    closed.forEach(t => { bestPairMap[t.symbol] = (bestPairMap[t.symbol] || 0) + t.pnl; });
    const bestPair = Object.entries(bestPairMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    c.innerHTML = `<div class="p-4 space-y-4">
        <div class="rounded-3xl bg-darkSurface border border-darkBorder p-5 space-y-3">
            <div class="flex justify-between"><span class="text-xs font-bold uppercase text-slate-400">Performance</span><span class="text-xs font-semibold px-2.5 py-1 rounded-full ${tp >= 0 ? 'bg-accentGreen/20 text-accentGreen' : 'bg-accentRed/20 text-accentRed'}">Net $${fmtPrice(tp)}</span></div>
            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-2 rounded-2xl bg-darkBg border border-darkBorder"><span class="text-[10px] text-slate-400 block">Trades</span><span class="font-bold text-sm text-white">${STATE.trades.length}</span></div>
                <div class="p-2 rounded-2xl bg-darkBg border border-darkBorder"><span class="text-[10px] text-slate-400 block">Win</span><span class="font-bold text-sm text-accentGreen">${closed.length ? Math.round(winRate * 100) : 0}%</span></div>
                <div class="p-2 rounded-2xl bg-darkBg border border-darkBorder"><span class="text-[10px] text-slate-400 block">Exp.</span><span class="font-bold text-sm ${expectancy >= 0 ? 'text-accentGreen' : 'text-accentRed'}">$${fmtPrice(expectancy)}</span></div>
            </div>
            <div class="text-[10px] text-slate-400 text-center border-t border-darkBorder/50 pt-2">Profit Factor: <strong class="${profitFactor >= 1.5 ? 'text-accentGreen' : 'text-accentGold'}">${profitFactor.toFixed(2)}</strong></div>
        </div>
        <button onclick="analyzeJournal()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-accentBlue text-white font-extrabold text-sm shadow-lg">🧠 Ask AI Coach to Analyze</button>
        <div class="rounded-2xl bg-darkSurface border border-darkBorder p-4">
            <div class="grid grid-cols-3 gap-2 text-center"><div class="p-2 rounded-xl bg-darkBg border border-darkBorder"><span class="text-[9px] text-slate-400 block">Total R</span><b class="${totalR >= 0 ? 'text-accentGreen' : 'text-accentRed'}">${totalR.toFixed(1)}R</b></div><div class="p-2 rounded-xl bg-darkBg border border-darkBorder"><span class="text-[9px] text-slate-400 block">Expectancy</span><b>${proExpectancy}R</b></div><div class="p-2 rounded-xl bg-darkBg border border-darkBorder"><span class="text-[9px] text-slate-400 block">Best Pair</span><b>${bestPair}</b></div></div>
            <div class="text-[10px] text-slate-500 text-center pt-2">Top Emotion: <b class="text-white">${topEmotion}</b></div>
        </div>
        <div class="rounded-3xl bg-darkSurface border border-darkBorder p-4 space-y-2"><h3 class="font-heading font-bold text-xs text-slate-400 uppercase">Equity Curve</h3><div id="equityChart" class="w-full h-32"></div></div>
        ${Object.keys(emoStats).length > 0 ? `<div class="rounded-3xl bg-darkSurface border border-darkBorder p-4 space-y-2"><h3 class="font-heading font-bold text-xs text-slate-400 uppercase">Emotion Win Rates</h3><div class="space-y-1">${emoHtml}</div></div>` : ''}
        <div class="flex items-center space-x-2"><h3 class="font-heading font-bold text-xs text-slate-400 uppercase">Trades</h3><button onclick="exportCSV()" class="text-[9px] bg-accentBlue/20 text-accentBlue border border-accentBlue/50 px-2 py-1 rounded font-bold">📥 CSV</button><button onclick="panicCloseAll()" class="text-[9px] bg-accentRed/20 text-accentRed border border-accentRed/50 px-2 py-1 rounded font-bold">🚨 PANIC</button>${STATE.trades.length ? `<button onclick="clearJ()" class="text-[10px] text-accentRed ml-auto">Clear</button>` : ''}</div>
        <div class="space-y-2.5">${STATE.trades.length === 0 ? `<div class="text-center py-12 text-slate-500 text-xs">No trades yet.</div>` : STATE.trades.map(t => `<div class="rounded-2xl bg-darkSurface border border-darkBorder p-4 space-y-2"><div class="flex justify-between items-center"><div class="flex items-center space-x-2"><span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${t.type === 'BUY' ? 'bg-accentGreen/20 text-accentGreen' : 'bg-accentRed/20 text-accentRed'}">${t.type}</span><span class="font-bold text-sm text-white">${t.symbol}</span><span class="text-[10px] text-accentBlue font-mono">${t.rrRatio}</span><span class="text-[10px] text-slate-400">${t.tf || '15M'}</span></div><span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'OPEN' ? 'bg-accentBlue/20 text-accentBlue' : (t.status === 'TP HIT' ? 'bg-accentGreen/20 text-accentGreen' : 'bg-accentRed/20 text-accentRed')}">${t.status}</span></div><div class="grid grid-cols-4 gap-1 text-[10px] text-slate-400"><div>Entry: <strong class="text-white">$${fmtPrice(t.entry)}</strong></div><div>SL: <strong class="text-red-400">$${fmtPrice(t.sl)}</strong></div><div>TP: <strong class="text-green-400">$${fmtPrice(t.tp)}</strong></div><div class="text-right">PnL: <strong class="${t.pnl >= 0 ? 'text-accentGreen' : 'text-accentRed'}">$${fmtPrice(t.pnl)}</strong></div></div>${t.note && t.note !== 'No notes.' ? `<div class="text-[10px] text-slate-500 italic bg-darkBg p-1.5 rounded-lg border border-darkBorder">📝 ${esc(t.note)} ${t.emotion ? `| 🧠 ${t.emotion}` : ''}</div>` : ''}<div class="flex space-x-2 pt-1">${t.status === 'OPEN' ? `<button onclick="closeEarly(${t.id})" class="flex-1 py-1.5 rounded-xl bg-darkBg border border-accentRed/40 text-accentRed text-[10px] font-bold">Close</button>` : ''}<button onclick="shareTrade(${t.id})" class="flex-1 py-1.5 rounded-xl bg-darkBg border border-accentBlue/40 text-accentBlue text-[10px] font-bold">Share</button></div></div>`).join('')}</div></div>`;

    setTimeout(() => {
        const box = document.getElementById('equityChart');
        if (box && window.LightweightCharts) {
            try {
                box.innerHTML = '';
                const chart = LightweightCharts.createChart(box, { layout: { background: { type: 'solid', color: '#121826' }, textColor: '#94A3B8' }, grid: { vertLines: { color: '#1E293B' }, horzLines: { color: '#1E293B' } }, rightPriceScale: { borderColor: '#1E293B' }, timeScale: { borderColor: '#1E293B', visible: false } });
                const s = chart.addLineSeries({ color: '#3B82F6', lineWidth: 2 });
                const _startBal = STATE.propFirm.accountSize || 1000;
                let data = [{ time: '2026-01-01', value: _startBal }];
                let curBal = _startBal;
                closed.slice().reverse().forEach((t, i) => {
                    curBal += t.pnl;
                    data.push({ time: new Date(Date.now() - (closed.length - i) * 86400000).toISOString().split('T')[0], value: curBal });
                });
                s.setData(data);
                chart.timeScale().fitContent();
            } catch (err) {
                console.warn('Equity chart failed:', err);
                box.innerHTML = '<div class="text-[10px] text-slate-500 text-center py-8">Chart unavailable</div>';
            }
        }
    }, 100);
}

function exportCSV() {
    const rows = [['time', 'symbol', 'type', 'tf', 'entry', 'sl', 'tp', 'lots', 'status', 'pnl', 'note']];
    STATE.trades.forEach(t => rows.push([t.time, t.symbol, t.type, t.tf, t.entry, t.sl, t.tp, t.lots, t.status, t.pnl, `"${(t.note || '').replace(/"/g, '""')}"`]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
    a.download = `dagbo-journal-${Date.now()}.csv`;
    a.click();
}

function shareTrade(id) {
    const t = STATE.trades.find(x => x.id === id);
    if (!t) return;
    const txt = `📊 ${t.type} ${t.symbol} (${t.rrRatio})\nEntry $${fmtPrice(t.entry)}\nSL $${fmtPrice(t.sl)}\nTP $${fmtPrice(t.tp)}\nStatus: ${t.status}\nPnL $${fmtPrice(t.pnl)}`;
    if (navigator.share) navigator.share({ title: 'DAGBO', text: txt }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => showToast('Copied', 'success'));
}
