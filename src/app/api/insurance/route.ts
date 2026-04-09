import { NextResponse } from 'next/server';
import { getExpiringInsurance, getContractorInsurance } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractor_id');

    if (contractorId) {
      const insurance = getContractorInsurance(parseInt(contractorId, 10));
      return NextResponse.json(insurance || {});
    }

    const expiring = getExpiringInsurance(60);
    return NextResponse.json(expiring);
  } catch (error) {
    console.error('GET /api/insurance error:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance data' }, { status: 500 });
  }
}
