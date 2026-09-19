const pool = require('../db');

const ADDRESS_FIELDS = [
  'house_own_location',
  'house_rent_location',
  'abroad_house_own_location',
  'abroad_house_rent_location',
];

function deriveHouseTypes(profile) {
  if (!profile) return;
  const own = String(profile.house_own_location || '').trim();
  const rent = String(profile.house_rent_location || '').trim();
  profile.pk_house_type = own ? 'own' : rent ? 'rent' : null;

  const abroadOwn = String(profile.abroad_house_own_location || '').trim();
  const abroadRent = String(profile.abroad_house_rent_location || '').trim();
  profile.abroad_house_type = abroadOwn ? 'own' : abroadRent ? 'rent' : null;
}

function hideCompleteAddress(profile) {
  if (!profile) return profile;
  for (const field of ADDRESS_FIELDS) {
    delete profile[field];
  }
  return profile;
}

async function applyAddressPrivacy(profile, { viewerUserId, isAdmin, isOwn }) {
  deriveHouseTypes(profile);

  if (isAdmin || isOwn) {
    profile.address_visible = true;
    profile.i_shared_address = isOwn;
    profile.they_shared_address = isOwn;
    return profile;
  }

  const viewer = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [viewerUserId]);
  const viewerId = viewer.rows[0]?.id;
  if (!viewerId) {
    profile.address_visible = false;
    profile.i_shared_address = false;
    profile.they_shared_address = false;
    hideCompleteAddress(profile);
    return profile;
  }

  const result = await pool.query(
    `SELECT
       EXISTS (
         SELECT 1 FROM address_disclosures
         WHERE discloser_profile_id = $1 AND viewer_profile_id = $2
       ) AS they_shared,
       EXISTS (
         SELECT 1 FROM address_disclosures
         WHERE discloser_profile_id = $2 AND viewer_profile_id = $1
       ) AS i_shared`,
    [profile.id, viewerId]
  );

  const theyShared = !!result.rows[0]?.they_shared;
  const iShared = !!result.rows[0]?.i_shared;
  profile.they_shared_address = theyShared;
  profile.i_shared_address = iShared;
  profile.address_visible = theyShared;
  if (!theyShared) hideCompleteAddress(profile);
  return profile;
}

module.exports = {
  ADDRESS_FIELDS,
  deriveHouseTypes,
  hideCompleteAddress,
  applyAddressPrivacy,
};
