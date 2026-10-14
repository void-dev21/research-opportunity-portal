const STATUSES = ['Open', 'Closed'];

const TEXT_FIELDS = {
  title: 200,
  description: 5000,
  research_area: 100,
  faculty_name: 100,
  department: 100,
  required_skills: 500,
};

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validate a request body.
 * @param {object} body
 * @param {boolean} partial - true for PUT (only supplied fields are checked)
 * @returns {{errors: string[], data: object}}
 */
function validateOpportunity(body, partial = false) {
  const errors = [];
  const data = {};
  body = body && typeof body === 'object' ? body : {};

  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    const v = body[field];
    if (v === undefined || v === null) {
      if (!partial) errors.push(`${field} is required`);
      continue;
    }
    if (typeof v !== 'string' || v.trim() === '') {
      errors.push(`${field} must be a non-empty string`);
    } else if (v.trim().length > max) {
      errors.push(`${field} must be at most ${max} characters`);
    } else {
      data[field] = v.trim();
    }
  }

  const pos = body.available_positions;
  if (pos === undefined || pos === null || pos === '') {
    if (!partial) errors.push('available_positions is required');
  } else {
    const n = Number(pos);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      errors.push('available_positions must be an integer between 1 and 1000');
    } else {
      data.available_positions = n;
    }
  }

  const dl = body.deadline;
  if (dl === undefined || dl === null || dl === '') {
    if (!partial) errors.push('deadline is required');
  } else if (!isValidDate(dl)) {
    errors.push('deadline must be a valid date in YYYY-MM-DD format');
  } else {
    data.deadline = dl;
  }

  const st = body.status;
  if (st === undefined || st === null || st === '') {
    if (!partial) data.status = 'Open';
  } else if (!STATUSES.includes(st)) {
    errors.push("status must be either 'Open' or 'Closed'");
  } else {
    data.status = st;
  }

  if (partial && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push('At least one valid field must be provided to update');
  }

  return { errors, data };
}

module.exports = { validateOpportunity };
