const API_BASE_URL = 'http://172.20.10.2:8000';
const RXNORM_API_URL = 'https://rxnav.nlm.nih.gov/REST';

export type RxNormResult = {
  rxcui: string;
  usa_name: string;
};

export type MedicationInput = {
  name: string;
  rxcui: string;
  usa_name: string;
};

export type QuickReferenceResult = {
  status: 'Critical' | 'Warning' | 'Safe' | 'Synergistic';
  severity_index: number;
  description: string;
  mechanism: string;
  evidence_match: boolean;
  recommendation: string;
};

/**
 * Look up a medication name in RxNorm to get the rxcui and standardized USA name.
 * Returns null if no match found.
 */
export async function lookupRxNorm(medicineName: string): Promise<RxNormResult | null> {
  try {
    // First try approximate match
    const response = await fetch(
      `${RXNORM_API_URL}/approximateTerm.json?term=${encodeURIComponent(medicineName)}&maxEntries=1`
    );

    if (!response.ok) {
      throw new Error(`RxNorm API error: ${response.status}`);
    }

    const data = await response.json();
    const candidates = data.approximateGroup?.candidate;

    if (!candidates || candidates.length === 0) {
      // Try drugs endpoint as fallback
      const drugsResponse = await fetch(
        `${RXNORM_API_URL}/drugs.json?name=${encodeURIComponent(medicineName)}`
      );

      if (!drugsResponse.ok) {
        return null;
      }

      const drugsData = await drugsResponse.json();
      const conceptGroup = drugsData.drugGroup?.conceptGroup;

      if (!conceptGroup) return null;

      for (const group of conceptGroup) {
        if (group.conceptProperties && group.conceptProperties.length > 0) {
          const concept = group.conceptProperties[0];
          return {
            rxcui: concept.rxcui,
            usa_name: concept.name,
          };
        }
      }

      return null;
    }

    const firstCandidate = candidates[0];
    return {
      rxcui: firstCandidate.rxcui,
      usa_name: firstCandidate.name || medicineName,
    };
  } catch (error) {
    console.error('RxNorm lookup failed:', error);
    throw error;
  }
}

/**
 * Call the /quickreference endpoint to check drug interactions.
 */
export async function checkQuickReference(
  medication1: MedicationInput,
  medication2: MedicationInput
): Promise<QuickReferenceResult> {
  const response = await fetch(`${API_BASE_URL}/quickreference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      medication1,
      medication2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || `Quick reference failed: ${response.status}`;
    throw new Error(detail);
  }

  return response.json();
}
