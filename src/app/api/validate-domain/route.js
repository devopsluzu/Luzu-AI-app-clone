export default async function handler(req, res) {
    if (req.method === "POST") {
      const { domain } = req.body;
  
      try {
        // Example using a DNS lookup API (replace with your preferred service)
        const response = await fetch(`https://api.some-dns-service.com/check?domain=${domain}`);
        const data = await response.json();
  
        if (data.exists) {
          res.status(200).json({ isValid: true });
        } else {
          res.status(400).json({ isValid: false });
        }
      } catch (error) {
        res.status(500).json({ error: "Error validating domain" });
      }
    } else {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  