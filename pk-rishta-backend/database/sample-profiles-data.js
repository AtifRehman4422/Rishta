/** Shared sample profile data — contacts, partner preferences, and full profile fields */
const SAMPLE_PROFILES = [
  {
    email: 'ahmed.khan@example.com',
    password: 'User@123',
    first_name: 'Ahmed',
    last_name: 'Khan',
    gender: 'male',
    date_of_birth: '1992-05-15',
    height_cm: 178,
    marital_status: 'never_married',
    religion: 'Islam',
    sect: 'Sunni',
    caste: 'Rajput',
    mother_tongue: 'Punjabi',
    city: 'Lahore',
    province: 'Punjab',
    education: 'Masters in Computer Science',
    profession: 'Software Engineer',
    income_range: '150000-300000',
    about_me:
      'Assalam o Alaikum. I am a practicing Muslim looking for a compatible life partner who values family and faith.',
    family_details:
      'Joint family of 5 in Lahore. Father is a retired government officer; mother is a homemaker. One younger sister, married.',
    contacts: [
      { type: 'phone', number: '+92 300 1112233' },
      { type: 'whatsapp', number: '+92 321 1112233' },
    ],
    partner_preferences: {
      min_age: 22,
      max_age: 28,
      min_height_cm: 155,
      max_height_cm: 168,
      religion: 'Islam',
      sect: 'Sunni',
      province: 'Punjab',
      city: 'Lahore',
      education: 'Bachelors',
      profession: null,
      marital_status: 'never_married',
      requirements_notes:
        'Practicing Muslimah with good family values. Prefer someone educated and willing to live in a joint family setup.',
    },
  },
  {
    email: 'zainab.hussain@example.com',
    password: 'User@123',
    first_name: 'Zainab',
    last_name: 'Hussain',
    gender: 'female',
    date_of_birth: '1994-01-25',
    height_cm: 165,
    marital_status: 'never_married',
    religion: 'Islam',
    sect: 'Sunni',
    caste: 'Afridi',
    mother_tongue: 'Pashto',
    city: 'Peshawar',
    province: 'KPK',
    education: 'Masters in English Literature',
    profession: 'Lecturer',
    income_range: '80000-150000',
    about_me:
      'Educated Pashtun girl seeking a partner who respects culture, religion, and family values.',
    family_details:
      'Traditional Pashtun family in Peshawar. Father is a retired army officer; mother is a homemaker.',
    contacts: [
      { type: 'phone', number: '+92 300 6789012' },
      { type: 'whatsapp', number: '+92 321 6789012' },
    ],
    partner_preferences: {
      min_age: 28,
      max_age: 38,
      min_height_cm: 172,
      max_height_cm: 190,
      religion: 'Islam',
      sect: 'Sunni',
      province: 'KPK',
      city: 'Peshawar',
      education: 'Masters',
      profession: null,
      marital_status: 'never_married',
      requirements_notes:
        'Educated, respectful man who understands Pashtun culture and Islamic values.',
    },
  },
];

module.exports = { SAMPLE_PROFILES };
