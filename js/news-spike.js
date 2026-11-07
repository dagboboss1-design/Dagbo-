async function fetchNews() {
    const targetUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
    const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
    
    for (let proxy of proxies) {
        try {
            const r = await fetch(proxy + encodeURIComponent(targetUrl));
            if (!r.ok) continue;
            const d = await r.json();
            const now = Date.now();
            
            // Look 1 day into the past so weekend filters don't break it
            const upcoming = d.filter(e => String(e.impact).toLowerCase() === 'high' && new Date(e.date).getTime() > (now - 86400000));
            
            if (upcoming.length > 0) {
                return upcoming.map(e => ({
                    title: e.title,
                    currency: e.country,
                    date: new Date(e.date),
                    impact: e.impact,
                    forecast: e.forecast || '—',
                    previous: e.previous || '—',
                    actual: e.actual || null,
                    description: e.title.includes('CPI') ? 'Inflation data. Higher = Rate Hikes = Currency Up.' :
                        e.title.includes('NFP') ? 'Jobs data. Higher = Strong Economy = Currency Up.' :
                        e.title.includes('Interest Rate') ? 'Central Bank Rate Decision.' :
                        e.title.includes('PPI') ? 'Producer Inflation. Leads CPI.' :
                        e.title.includes('Retail Sales') ? 'Consumer Spending.' : 'High impact indicator.'
                })).sort((a, b) => a.date - b.date);
            }
        } catch (e) {
            console.log('Proxy failed, trying next...');
        }
    }
    return null;
}
