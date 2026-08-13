const pool = require('../db');
const { isProduction } = require('../middleware/security');

const ALLOWED_FIELDS = new Set([
  'caste',
  'education',
  'profession',
  'language',
  'city',
  'country',
  'state',
  'color',
  'religion',
  'sect',
  'marital_status',
  'guardian_type',
  'house_type',
  'disability',
]);

const FIELD_LABELS = {
  caste: 'Caste',
  education: 'Education',
  profession: 'Profession',
  language: 'Language',
  city: 'City',
  country: 'Country',
  state: 'State / Province',
  color: 'Color',
  religion: 'Religion',
  sect: 'Sect / Denomination',
  marital_status: 'Marital Status',
  guardian_type: 'Guardian',
  house_type: 'House Type',
  disability: 'Disability',
};

function normalizeFieldKey(value) {
  return String(value || '').trim().toLowerCase();
}

function mapFieldLabelToKey(label) {
  const raw = String(label || '').trim().toLowerCase();
  if (ALLOWED_FIELDS.has(raw)) return raw;
  if (raw.includes('caste')) return 'caste';
  if (raw.includes('education')) return 'education';
  if (raw.includes('profession')) return 'profession';
  if (raw.includes('language')) return 'language';
  if (raw.includes('city')) return 'city';
  if (raw.includes('country')) return 'country';
  if (raw.includes('state') || raw.includes('province') || raw.includes('location')) return 'state';
  return 'caste';
}

async function listPublicOptions(req, res) {
  try {
    const fieldKey = normalizeFieldKey(req.query.field);
    const category = req.query.category?.trim() || null;
    if (fieldKey && !ALLOWED_FIELDS.has(fieldKey)) {
      return res.status(400).json({ success: false, message: 'Invalid field' });
    }

    const params = [];
    let where = 'WHERE is_active = true';
    if (fieldKey) {
      params.push(fieldKey);
      where += ` AND field_key = $${params.length}`;
    }
    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT id, field_key, category, label, sort_order
       FROM dropdown_options
       ${where}
       ORDER BY field_key, sort_order, label`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to load options' : err.message,
    });
  }
}

async function adminListOptions(req, res) {
  try {
    const fieldKey = normalizeFieldKey(req.query.field);
    const params = [];
    let where = '';
    if (fieldKey) {
      if (!ALLOWED_FIELDS.has(fieldKey)) {
        return res.status(400).json({ success: false, message: 'Invalid field' });
      }
      params.push(fieldKey);
      where = `WHERE field_key = $1`;
    }

    let result = await pool.query(
      `SELECT id, field_key, category, label, is_active, sort_order, created_at, updated_at
       FROM dropdown_options
       ${where}
       ORDER BY field_key, sort_order, label`,
      params
    );

    // Auto-seed complete built-in lists if this field (or all) is empty
    if (!result.rows.length) {
      const { seedDropdownOptions } = require('../database/seed-dropdown-options');
      await seedDropdownOptions();
      result = await pool.query(
        `SELECT id, field_key, category, label, is_active, sort_order, created_at, updated_at
         FROM dropdown_options
         ${where}
         ORDER BY field_key, sort_order, label`,
        params
      );
    }

    res.json({
      success: true,
      data: result.rows,
      meta: { fields: [...ALLOWED_FIELDS], field_labels: FIELD_LABELS },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminSeedOptions(req, res) {
  try {
    const { seedDropdownOptions } = require('../database/seed-dropdown-options');
    const result = await seedDropdownOptions();
    res.json({
      success: true,
      data: result,
      message: `Complete list loaded. Added ${result.inserted} missing values.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminCreateOption(req, res) {
  try {
    const fieldKey = normalizeFieldKey(req.body?.field_key);
    const label = String(req.body?.label || '').trim();
    const category = req.body?.category?.trim() || null;
    const sortOrder = Number.isFinite(Number(req.body?.sort_order))
      ? Number(req.body.sort_order)
      : 0;

    if (!ALLOWED_FIELDS.has(fieldKey)) {
      return res.status(400).json({ success: false, message: 'Invalid field' });
    }
    if (!label || label.length < 2) {
      return res.status(400).json({ success: false, message: 'Label is required' });
    }
    if (fieldKey === 'profession' && !category) {
      return res.status(400).json({ success: false, message: 'Category is required for profession' });
    }
    if ((fieldKey === 'city' || fieldKey === 'language' || fieldKey === 'sect') && !category) {
      return res.status(400).json({ success: false, message: 'Category is required for this field' });
    }

    const result = await pool.query(
      `INSERT INTO dropdown_options (field_key, category, label, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [fieldKey, category, label, sortOrder]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Option added' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'This option already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminUpdateOption(req, res) {
  try {
    const { id } = req.params;
    const label = req.body?.label !== undefined ? String(req.body.label).trim() : undefined;
    const category = req.body?.category !== undefined
      ? (req.body.category?.trim() || null)
      : undefined;
    const isActive = req.body?.is_active !== undefined ? !!req.body.is_active : undefined;
    const sortOrder = req.body?.sort_order !== undefined ? Number(req.body.sort_order) : undefined;

    const updates = [];
    const params = [];
    let idx = 1;

    if (label !== undefined) {
      if (!label || label.length < 2) {
        return res.status(400).json({ success: false, message: 'Label is required' });
      }
      updates.push(`label = $${idx++}`);
      params.push(label);
    }
    if (category !== undefined) {
      updates.push(`category = $${idx++}`);
      params.push(category);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      params.push(isActive);
    }
    if (sortOrder !== undefined && Number.isFinite(sortOrder)) {
      updates.push(`sort_order = $${idx++}`);
      params.push(sortOrder);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await pool.query(
      `UPDATE dropdown_options SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Option updated' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'This option already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminDeleteOption(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM dropdown_options WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }
    res.json({ success: true, message: 'Option deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createOptionRequest(req, res) {
  try {
    const fieldKey = mapFieldLabelToKey(req.body?.field_key || req.body?.field_label);
    const category = req.body?.category?.trim() || null;
    const requestedLabel = String(req.body?.requested_label || req.body?.label || '').trim();
    const requesterName = String(req.body?.name || '').trim() || 'Profile User';
    const requesterEmail = String(req.body?.email || '').trim().toLowerCase();

    if (!requestedLabel || requestedLabel.length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter the option you need' });
    }
    if (!requesterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email' });
    }

    const result = await pool.query(
      `INSERT INTO dropdown_option_requests
         (user_id, requester_name, requester_email, field_key, category, requested_label)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user?.id || null, requesterName, requesterEmail, fieldKey, category, requestedLabel]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Your request sent to admin successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to send request' : err.message,
    });
  }
}

async function adminListRequests(req, res) {
  try {
    const status = (req.query.status || 'pending').trim();
    const params = [];
    let where = '';
    if (status && status !== 'all') {
      params.push(status);
      where = `WHERE status = $1`;
    }

    const result = await pool.query(
      `SELECT *
       FROM dropdown_option_requests
       ${where}
       ORDER BY created_at DESC
       LIMIT 100`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminReviewRequest(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const action = String(req.body?.action || '').trim().toLowerCase();
    const adminNotes = req.body?.admin_notes?.trim() || null;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    await client.query('BEGIN');

    const current = await client.query(
      'SELECT * FROM dropdown_option_requests WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!current.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = current.rows[0];
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    let createdOption = null;
    if (action === 'approve') {
      try {
        const inserted = await client.query(
          `INSERT INTO dropdown_options (field_key, category, label)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [request.field_key, request.category, request.requested_label]
        );
        createdOption = inserted.rows[0];
      } catch (insertErr) {
        if (insertErr.code !== '23505') throw insertErr;
        const existing = await client.query(
          `SELECT * FROM dropdown_options
           WHERE field_key = $1
             AND COALESCE(category, '') = COALESCE($2, '')
             AND lower(label) = lower($3)
           LIMIT 1`,
          [request.field_key, request.category, request.requested_label]
        );
        if (existing.rows.length) {
          createdOption = existing.rows[0];
          if (!createdOption.is_active) {
            const reactivated = await client.query(
              `UPDATE dropdown_options SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
              [createdOption.id]
            );
            createdOption = reactivated.rows[0];
          }
        }
      }
    }

    const updated = await client.query(
      `UPDATE dropdown_option_requests
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [action === 'approve' ? 'approved' : 'rejected', adminNotes, req.user.id, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { request: updated.rows[0], option: createdOption },
      message: action === 'approve' ? 'Request approved and option added' : 'Request rejected',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  listPublicOptions,
  adminListOptions,
  adminCreateOption,
  adminUpdateOption,
  adminDeleteOption,
  adminSeedOptions,
  createOptionRequest,
  adminListRequests,
  adminReviewRequest,
  ALLOWED_FIELDS,
  FIELD_LABELS,
};
