const BASE_URL = 'https://sv-qa-08-vendor-queue.onrender.com';
let sessionCookie = '';

// Quick fetch wrapper to handle our isolated session cookies automatically
const fetchApi = async (method, path, body = null) => {
  const reqOpts = { method, headers: { 'Content-Type': 'application/json' } };
  
  if (sessionCookie) reqOpts.headers['Cookie'] = sessionCookie;
  if (body) reqOpts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, reqOpts);
  
  // Grab the sid cookie if it's our first time hitting the API
  const setCookie = res.headers.get('set-cookie');
  if (setCookie && !sessionCookie) {
    sessionCookie = setCookie.split(';')[0]; 
  }
  return res;
};

describe('API Regression Tests', () => {
  beforeAll(async () => {
    // Just hitting this to initialize the session cookie
    await fetchApi('GET', '/api/vendors'); 
  });

  beforeEach(async () => {
    // Clean slate for every test
    await fetchApi('POST', '/api/reset'); 
  });

  describe('PATCH /api/requests/:id/assign', () => {
    it('should block assignments to inactive vendors', async () => {
      // v3 is "Old Ledger Associates" which is marked active: false
      const res = await fetchApi('PATCH', '/api/requests/1/assign', { vendorId: 'v3' });
      
      // Fails currently: API lets this through with a 200 OK
      expect(res.status).toBe(400); 
    });
  });

  describe('PATCH /api/requests/:id/transition', () => {
    it('should prevent backward state transitions', async () => {
      // Request 3 is already IN_PROGRESS. We shouldn't be able to kick it back to ASSIGNED.
      const res = await fetchApi('PATCH', '/api/requests/3/transition', { to: 'ASSIGNED' });
      expect(res.status).toBe(400); 
    });
  });

  describe('POST /api/requests', () => {
    it('should reject invalid checkType enums', async () => {
      const res = await fetchApi('POST', '/api/requests', { 
        checkType: 'MEDICAL', // not in our allowed spec
        candidateName: 'John Doe' 
      });
      expect(res.status).toBe(400); 
    });

    it('should catch and reject blank whitespace names', async () => {
      const res = await fetchApi('POST', '/api/requests', { 
        checkType: 'IDENTITY', 
        candidateName: '   ' 
      });
      // Should trim and reject, but currently accepts it
      expect(res.status).toBe(400); 
    });

    it('should throw a 400 if required fields are missing completely', async () => {
      const res = await fetchApi('POST', '/api/requests', {});
      
      // Buggy API currently creates an empty record and returns 201 Created
      expect(res.status).toBe(400); 
    });
  });

  describe('GET /api/requests/summary', () => {
    it('should return aggregate counts that actually match the total requests', async () => {
      const listRes = await fetchApi('GET', '/api/requests');
      const allReqs = await listRes.json();
      
      const summaryRes = await fetchApi('GET', '/api/requests/summary');
      const summary = await summaryRes.json();
      
      const totalInSummary = Object.values(summary).reduce((sum, val) => sum + val, 0);
      
      // This fails right now because the backend double-counts IN_PROGRESS items
      expect(totalInSummary).toBe(allReqs.length); 
    });
  });
});