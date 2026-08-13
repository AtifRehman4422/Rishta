const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'pk_rishta_db', user: 'postgres', password: 'postgres' });

const REQUIRED = [
  'first_name', 'last_name', 'gender', 'date_of_birth',
  'height_cm', 'weight_kg', 'marital_status', 'color',
  'guardian_type', 'guardian_name', 'disability',
  'religion', 'sect', 'caste', 'languages',
  'city', 'province', 'education', 'profession',
  'about_me', 'family_details',
];

(async () => {
  const { rows } = await pool.query(`
    SELECT q.*, u.email
    FROM (
      SELECT p.*,
             EXISTS (
               SELECT 1 FROM profile_contacts pc
               WHERE pc.profile_id = p.id AND pc.contact_type = 'phone' AND trim(pc.number) <> ''
             ) AS has_phone_contact,
             pp.min_age AS preferred_min_age,
             pp.max_age AS preferred_max_age
      FROM profiles p
      LEFT JOIN partner_preferences pp ON pp.profile_id = p.id
      WHERE p.is_profile_complete = true
    ) q
    JOIN users u ON u.id = q.user_id
    ORDER BY u.email`);

  let complete = 0;
  for (const p of rows) {
    const hasRequired = REQUIRED.every((f) => {
      const v = p[f];
      return v !== null && v !== undefined && String(v).trim() !== '';
    });
    const hasPAK = !!(p.house_own_location?.trim?.() || p.house_rent_location?.trim?.());
    const overseas = p.province === 'Overseas';
    const hasRes = overseas
      ? !!(p.abroad_country?.trim?.() && (p.abroad_house_own_location?.trim?.() || p.abroad_house_rent_location?.trim?.()))
      : hasPAK;
    const hasAge = p.preferred_min_age != null && p.preferred_max_age != null;
    const isComplete = hasRequired && hasRes && p.has_phone_contact === true && hasAge;

    if (!isComplete) {
      const missing = REQUIRED.filter((f) => {
        const v = p[f];
        return v === null || v === undefined || String(v).trim() === '';
      });
      console.log(`INCOMPLETE recompute: ${p.email} | req:${!hasRequired}${missing.length ? ' missing=' + missing.join(',') : ''} | res:${!hasRes} | phone:${!p.has_phone_contact} | partnerAge:${!hasAge}`);
    } else {
      complete++;
    }
  }
  console.log(`\nTotal stored-complete: ${rows.length}, recompute-complete: ${complete}`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
