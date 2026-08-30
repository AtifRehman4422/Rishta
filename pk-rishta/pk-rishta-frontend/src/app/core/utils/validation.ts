export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[a-zA-Z\u0600-\u06FF\s.'-]{2,80}$/;
const PK_PHONE_RE = /^(\+92|0)?3[0-9]{2}[\s-]?[0-9]{7}$/;
const INTL_PHONE_RE = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, '');
}

/** Pakistan (+92) or international (+country code) numbers */
export function validatePhone(value: string, required = false): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return required ? 'Phone number is required' : null;
  const normalized = normalizePhone(trimmed);
  if (PK_PHONE_RE.test(normalized) || INTL_PHONE_RE.test(normalized)) return null;
  return 'Enter a valid number (e.g. +92 300 1234567, +1 416 555 0100, +971 50 123 4567)';
}

export function validatePhonePk(value: string, required = false): string | null {
  return validatePhone(value, required);
}

export function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

export function validateRequired(value: unknown, label: string): string | null {
  return isEmpty(value) ? `${label} is required` : null;
}

export function validateEmail(value: string): string | null {
  if (isEmpty(value)) return 'Email is required';
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function validateEmailOptional(value: string): string | null {
  if (isEmpty(value)) return null;
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value: string, minLen = 8): string | null {
  if (isEmpty(value)) return 'Password is required';
  if (value.length < minLen) return `Password must be at least ${minLen} characters`;
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must include letters and numbers';
  }
  return null;
}

export function validateName(value: string, label: string): string | null {
  const req = validateRequired(value, label);
  if (req) return req;
  if (!NAME_RE.test(value.trim())) {
    return `${label} must be 2–80 characters (letters only)`;
  }
  return null;
}

export function validateLocation(
  province: string,
  city: string,
  country?: string,
  isOverseas = false
): FieldErrors {
  const errors: FieldErrors = {};
  setError(errors, 'province', validateProvince(province));
  if (isOverseas) {
    setError(errors, 'country', validateRequired(country, 'Country'));
  } else if (province) {
    setError(errors, 'city', validateCity(city));
  }
  return errors;
}

export function calcAgeFromDob(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function validateDateOfBirth(dob: string, minAge = 18, maxAge = 80): string | null {
  const req = validateRequired(dob, 'Date of birth');
  if (req) return req;
  const age = calcAgeFromDob(dob);
  if (age === null) return 'Enter a valid date of birth';
  if (age < minAge) return `You must be at least ${minAge} years old`;
  if (age > maxAge) return `Age cannot exceed ${maxAge} years`;
  return null;
}

export function validateGender(value: string): string | null {
  if (!value || !['male', 'female'].includes(value)) return 'Please select Man or Woman';
  return null;
}

export function validateProvince(value: string): string | null {
  return validateRequired(value, 'Province');
}

export function validateCity(value: string): string | null {
  return validateRequired(value, 'City');
}

export function validateSelect(value: string, label: string): string | null {
  return validateRequired(value, label);
}

export function validateMinLength(value: string, min: number, label: string): string | null {
  const req = validateRequired(value, label);
  if (req) return req;
  if (value.trim().length < min) return `${label} must be at least ${min} characters`;
  return null;
}

export function validateAgeRange(min?: number | null, max?: number | null): string | null {
  if (min != null && (min < 18 || min > 80)) return 'Minimum age must be between 18 and 80';
  if (max != null && (max < 18 || max > 80)) return 'Maximum age must be between 18 and 80';
  if (min != null && max != null && min > max) return 'Minimum age cannot exceed maximum age';
  return null;
}

export function validateHeightRange(minCm?: number | null, maxCm?: number | null): string | null {
  if (minCm != null && (minCm < 120 || minCm > 230)) return 'Minimum height is out of range';
  if (maxCm != null && (maxCm < 120 || maxCm > 230)) return 'Maximum height is out of range';
  if (minCm != null && maxCm != null && minCm > maxCm) {
    return 'Minimum height cannot exceed maximum height';
  }
  return null;
}

export function validateContacts(
  contacts: { type: string; number: string }[]
): string | null {
  const filled = contacts.filter((c) => c.number.trim());
  if (!filled.length) return 'At least one phone number is required';
  if (!filled.some((c) => c.type === 'phone')) {
    return 'At least one phone number is required (WhatsApp is optional)';
  }
  for (let i = 0; i < filled.length; i++) {
    const err = validatePhone(filled[i].number, true);
    if (err) return `Contact ${i + 1}: ${err}`;
  }
  return null;
}

export function setError(errors: FieldErrors, field: string, message: string | null): void {
  if (message) errors[field] = message;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function firstError(errors: FieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? errors[keys[0]] : null;
}

export interface RegisterFormData {
  email: string;
  password: string;
  phone: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
}

export function validateRegisterForm(data: RegisterFormData): FieldErrors {
  const errors: FieldErrors = {};
  setError(errors, 'full_name', validateName(data.full_name, 'Full name'));
  setError(errors, 'gender', validateGender(data.gender));
  setError(errors, 'date_of_birth', validateDateOfBirth(data.date_of_birth));
  setError(errors, 'email', validateEmail(data.email));
  setError(errors, 'password', validatePassword(data.password));
  setError(errors, 'phone', validatePhone(data.phone, true));
  return errors;
}

export function validateLoginForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  setError(errors, 'email', validateEmail(email));
  if (isEmpty(password)) setError(errors, 'password', 'Password is required');
  return errors;
}

export function validateWeightKg(value?: number | null): string | null {
  if (value == null || Number.isNaN(Number(value))) return 'Please enter your weight';
  const n = Number(value);
  if (n < 30 || n > 200) return 'Enter a valid weight (30–200 kg)';
  return null;
}

export interface MyProfileFormData {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  height_cm?: number;
  weight_kg?: number | null;
  marital_status?: string;
  religion?: string;
  sect?: string;
  city?: string;
  province?: string;
  country?: string;
  education?: string;
  profession?: string;
  hafiz_quran?: string;
  caste?: string;
  color?: string;
  guardian_type?: string;
  guardian_name?: string;
  disabilityChoice?: string;
  pkHouseType?: string;
  pkHouseLocation?: string;
  abroadHouseType?: string;
  abroadHouseLocation?: string;
  about_me?: string;
  family_details?: string;
  familyComplete?: boolean;
  languages?: string[];
  showPakistanResidence?: boolean;
  showAbroadResidence?: boolean;
  abroad_country?: string;
  contacts: { type: string; number: string }[];
  requirements: {
    min_age?: number | null;
    max_age?: number | null;
    min_height_cm?: number | null;
    max_height_cm?: number | null;
    requirements_notes?: string;
  };
  religionHasSects: boolean;
}

export function validateResidence(data: {
  showPakistanResidence?: boolean;
  showAbroadResidence?: boolean;
  province?: string;
  city?: string;
  abroad_country?: string;
  pkHouseType?: string;
  pkHouseLocation?: string;
  abroadHouseType?: string;
  abroadHouseLocation?: string;
  requireHouseDetails?: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  const requireHouse = data.requireHouseDetails !== false;
  const showPk = !!data.showPakistanResidence;
  const showAbroad = !!data.showAbroadResidence;
  if (!showPk && !showAbroad) {
    setError(errors, 'residence', 'Select at least one residence (Pakistan or Abroad)');
    return errors;
  }
  if (showPk) {
    Object.assign(errors, validateLocation(data.province ?? '', data.city ?? '', 'Pakistan', false));
    if (requireHouse) {
      setError(errors, 'pk_house_type', validateSelect(data.pkHouseType ?? '', 'House type'));
      setError(errors, 'pk_house_location', validateMinLength(data.pkHouseLocation ?? '', 5, 'Complete address'));
    }
  }
  if (showAbroad) {
    setError(errors, 'abroad_country', validateRequired(data.abroad_country, 'Country'));
    if (requireHouse) {
      setError(errors, 'abroad_house_type', validateSelect(data.abroadHouseType ?? '', 'Abroad house type'));
      setError(
        errors,
        'abroad_house_location',
        validateMinLength(data.abroadHouseLocation ?? '', 5, 'Abroad complete address'),
      );
    }
  }
  return errors;
}

export function validateOptionalProfileForm(data: MyProfileFormData): FieldErrors {
  const errors: FieldErrors = {};
  // Admin form: only soft checks — allow digits/spaces in names (e.g. Profile 079)
  if (!isEmpty(data.full_name) && String(data.full_name).trim().length < 1) {
    setError(errors, 'full_name', 'Full name is too short');
  }
  if (!isEmpty(data.gender)) {
    setError(errors, 'gender', validateGender(data.gender ?? ''));
  }
  if (!isEmpty(data.date_of_birth)) {
    const age = calcAgeFromDob(data.date_of_birth ?? '');
    if (age === null) setError(errors, 'date_of_birth', 'Enter a valid date of birth');
  }
  setError(errors, 'req_age', validateAgeRange(data.requirements.min_age, data.requirements.max_age));
  setError(errors, 'req_height', validateHeightRange(
    data.requirements.min_height_cm,
    data.requirements.max_height_cm
  ));
  setError(errors, 'email', validateEmailOptional(data.email ?? ''));
  return errors;
}

/** Admin create: gender (Man/Woman) required, everything else optional */
export function validateAdminCreateProfileForm(data: MyProfileFormData): FieldErrors {
  const errors = validateOptionalProfileForm(data);
  setError(errors, 'gender', validateGender(data.gender ?? ''));
  setError(errors, 'email', validateEmail(data.email ?? ''));
  return errors;
}

export function validateMyProfileForm(data: MyProfileFormData): FieldErrors {
  const errors: FieldErrors = {};
  setError(errors, 'full_name', validateName(data.full_name ?? '', 'Full name'));
  setError(errors, 'email', validateEmail(data.email ?? ''));
  setError(errors, 'gender', validateGender(data.gender ?? ''));
  setError(errors, 'date_of_birth', validateDateOfBirth(data.date_of_birth ?? ''));
  if (data.height_cm == null) setError(errors, 'height', 'Please select your height');
  setError(errors, 'weight', validateWeightKg(data.weight_kg));
  setError(errors, 'marital_status', validateSelect(data.marital_status ?? '', 'Marital status'));
  setError(errors, 'color', validateSelect(data.color ?? '', 'Color'));
  setError(errors, 'guardian_type', validateSelect(data.guardian_type ?? '', 'Guardian'));
  if (!isEmpty(data.guardian_type)) {
    setError(errors, 'guardian_name', validateName(data.guardian_name ?? '', 'Guardian name'));
  }
  setError(errors, 'disability', validateSelect(data.disabilityChoice ?? '', 'Disability'));
  setError(errors, 'religion', validateSelect(data.religion ?? '', 'Religion'));
  if (data.religionHasSects && isEmpty(data.sect)) {
    setError(errors, 'sect', 'Please select sect / denomination');
  }
  setError(errors, 'caste', validateSelect(data.caste ?? '', 'Caste'));
  if (!data.languages?.length) {
    setError(errors, 'languages', 'Please select at least one language');
  }
  Object.assign(errors, validateResidence({
    showPakistanResidence: data.showPakistanResidence,
    showAbroadResidence: data.showAbroadResidence,
    province: data.province,
    city: data.city,
    abroad_country: data.abroad_country,
    pkHouseType: data.pkHouseType,
    pkHouseLocation: data.pkHouseLocation,
    abroadHouseType: data.abroadHouseType,
    abroadHouseLocation: data.abroadHouseLocation,
    requireHouseDetails: true,
  }));
  setError(errors, 'education', validateRequired(data.education, 'Education'));
  setError(errors, 'hafiz_quran', validateSelect(data.hafiz_quran ?? '', 'Hafiz-e-Quran'));
  setError(errors, 'profession', validateRequired(data.profession, 'Profession'));
  if (!isEmpty(data.about_me)) {
    setError(errors, 'about_me', validateMinLength(data.about_me ?? '', 20, 'About me'));
  }
  if (!data.familyComplete) {
    setError(errors, 'family_details', 'Please add father and mother details');
  }
  setError(errors, 'contacts', validateContacts(data.contacts));
  if (data.requirements.min_age == null || data.requirements.max_age == null) {
    setError(errors, 'req_age', 'Preferred minimum and maximum age are required');
  } else {
    setError(errors, 'req_age', validateAgeRange(data.requirements.min_age, data.requirements.max_age));
  }
  setError(errors, 'req_height', validateHeightRange(
    data.requirements.min_height_cm,
    data.requirements.max_height_cm
  ));
  if (data.requirements.requirements_notes?.trim()) {
    setError(
      errors,
      'req_notes',
      validateMinLength(data.requirements.requirements_notes, 10, 'Additional requirements')
    );
  }
  return errors;
}

export function validateContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  setError(errors, 'name', validateName(data.name, 'Name'));
  setError(errors, 'email', validateEmail(data.email));
  setError(errors, 'subject', validateRequired(data.subject, 'Subject'));
  setError(errors, 'message', validateMinLength(data.message, 10, 'Message'));
  return errors;
}

export function validateComplaint(description: string, category: string): FieldErrors {
  const errors: FieldErrors = {};
  setError(errors, 'category', validateRequired(category, 'Category'));
  setError(errors, 'description', validateMinLength(description, 20, 'Description'));
  return errors;
}
