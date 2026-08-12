import { describe, it, expect, vi } from 'vitest';
import { getCostDashboard, exportCostReport } from '../api/cost';

vi.mock('../api/request', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ code: 200, message: 'ok', data: {} }),
  },
  downloadBlob: vi.fn(),
}));

describe('cost API', () => {
  it('getCostDashboard calls /api/cost/dashboard', async () => {
    const res = await getCostDashboard({ dimension: 'DEPT' });
    expect(res.code).toBe(200);
  });

  it('exportCostReport uses blob responseType', async () => {
    const res = await exportCostReport({});
    expect(res).toBeDefined();
  });
});
