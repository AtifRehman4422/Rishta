const pool = require('../db');

/** Removes the old Google Play review test account. */
const PLAY_REVIEW_EMAIL = 'test@gmail.com';

async function removePlayReviewer() {
  const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [PLAY_REVIEW_EMAIL]);
  if (!existing.rows.length) {
    console.log(`No user found for ${PLAY_REVIEW_EMAIL}`);
    return { removed: false };
  }

  const userId = existing.rows[0].id;
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  console.log(`Removed user ${PLAY_REVIEW_EMAIL} (${userId})`);
  return { removed: true, userId };
}

if (require.main === module) {
  removePlayReviewer()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to remove play reviewer:', err.message);
      process.exit(1);
    });
}

module.exports = { removePlayReviewer, PLAY_REVIEW_EMAIL };
