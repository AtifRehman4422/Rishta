function normalizeProfileLocation(body) {
  if (!body || typeof body !== 'object') return { data: body };

  const province = body.province;
  if (province === undefined) return { data: body };

  if (province === 'Overseas') {
    const country = body.country?.trim();
    if (!country) {
      return { error: 'Country is required for overseas location' };
    }
    return { data: { ...body, country } };
  }

  return { data: { ...body, country: 'Pakistan' } };
}

function includesOverseasProvince(province) {
  if (!province?.trim?.()) return false;
  const value = String(province).trim();
  if (value === 'Overseas') return true;
  return value.split(',').some((part) => part.trim() === 'Overseas');
}

function normalizePartnerPreferencesLocation(prefs) {
  if (!prefs || typeof prefs !== 'object') return prefs;

  if (includesOverseasProvince(prefs.province)) {
    return prefs;
  }
  if (prefs.province !== undefined && prefs.province !== null && String(prefs.province).trim() !== '') {
    return { ...prefs, country: 'Pakistan' };
  }
  return prefs;
}

module.exports = { normalizeProfileLocation, normalizePartnerPreferencesLocation };
