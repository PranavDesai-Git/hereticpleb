export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "missing path" });
  
  const gcUrl = `https://hereticpleb.goatcounter.com/counter/${encodeURIComponent(path)}.json`;
  
  try {
    const gcRes = await fetch(gcUrl);
    if (!gcRes.ok) {
      return res.status(200).json({ count: "0" });
    }
    const data = await gcRes.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch view count" });
  }
}
