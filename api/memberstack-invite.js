export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    try {
      // Create member via Memberstack Admin API
      const response = await fetch('https://admin.memberstack.com/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.MEMBERSTACK_SECRET_KEY
        },
        body: JSON.stringify({
          email: email,
          planConnections: [
            { planId: process.env.MEMBERSTACK_FREE_PLAN_ID }
          ],
          sendMemberSignupEmail: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If member already exists, still return success
        if (data.code === 'member_already_exists' || data.message?.includes('already exists')) {
          return res.status(200).json({ success: true, existing: true });
        }
        console.error('Memberstack error:', data);
        return res.status(400).json({ error: data.message || 'Failed to create member' });
      }
      
      return res.status(200).json({ success: true, memberId: data.id });
      
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }