const svg = `<text id="gcvc-views" x="50%" y="48">14</text>`; const match = svg.match(/id="gcvc-views"[^>]*>([\\d,]+)<\\/text>/); console.log(match ? match[1] : "no match")
