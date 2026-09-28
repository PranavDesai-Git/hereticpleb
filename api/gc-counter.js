export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(400).json({ error: "missing path" });
  }
  
  // The GoatCounter .json endpoint heavily caches 404 responses (0 views) for 4 hours
  // and ignores cache-busting query strings. 
  // We fetch the .svg endpoint instead and parse the view count to get live data.
  const gcUrl = `https://hereticpleb.goatcounter.com/counter/${encodeURIComponent(path)}.svg?nocache=${Date.now()}`;
  
  try {
    const gcRes = await fetch(gcUrl);
    if (!gcRes.ok) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json({ count: "0" });
    }
    const svgText = await gcRes.text();
    // Extract <text id="gcvc-views" ...>740</text>
    const match = svgText.match(/id="gcvc-views"[^>]*>([^<]+)<\/text>/);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    if (match && match[1]) {
      return res.status(200).json({ count: match[1] });
    }
    return res.status(200).json({ count: "0" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch view count" });
  }
}
