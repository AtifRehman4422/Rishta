/**
 * Built-in dropdown values used on the profile form.
 * Seeded into dropdown_options so admin can view + CRUD the complete lists.
 */

const CASTE = [
  'Abbasi', 'Achakzai', 'Afridi', 'Ansari', 'Arain', 'Awan', 'Babar', 'Baloch',
  'Bangash', 'Bhatti', 'Bhutto', 'Bizenjo', 'Bugti', 'Butt', 'Chandio', 'Chaudhry',
  'Cheema', 'Chohan', 'Dar', 'Dogar', 'Durrani', 'Gakhar', 'Gondal', 'Gujjar',
  'Hashmi', 'Jamali', 'Janjua', 'Jatoi', 'Jatt', 'Junejo', 'Kalhoro', 'Kamboh',
  'Khaskheli', 'Khattak', 'Khawaja', 'Khokhar', 'Leghari', 'Lohana', 'Lone', 'Mahar',
  'Malik', 'Marri', 'Mazari', 'Mehsud', 'Memon', 'Mengal', 'Mir', 'Mirza',
  'Mohmand', 'Mughal', 'Orakzai', 'Panhwar', 'Pathan', 'Qureshi', 'Raisani', 'Rajput',
  'Rathore', 'Rind', 'Samma', 'Sandhu', 'Sheikh', 'Shinwari', 'Sial', 'Siddiqui',
  'Soomro', 'Syed', 'Talpur', 'Tareen', 'Tiwana', 'Wani', 'Warraich', 'Wazir',
  'Yousafzai', 'Zehri', 'Other',
];

const EDUCATION = [
  'Preschool / Nursery',
  'Kindergarten',
  'Primary / Elementary School',
  'Middle School',
  'Secondary / High School',
  'Higher Secondary / Intermediate / College',
  'Certificate Course',
  'Diploma',
  'Associate Degree',
  "Bachelor's Degree",
  'Postgraduate Diploma',
  "Master's Degree",
  'MPhil',
  'Doctorate / PhD',
  'Postdoctoral Study',
];

const GOVERNMENT = [
  'Government Teacher', 'Government Doctor', 'Police', 'Army', 'Navy', 'Air Force',
  'Civil Servant', 'Government Clerk', 'Government Engineer', 'Government Employee',
  'Government Office', 'Railway Employee', 'Post Office Employee', 'Judge',
  'Government Lawyer', 'Tax', 'Customs', 'Rescue', 'Firefighter', 'Other',
];

const PRIVATE = [
  'Private Teacher', 'Private Doctor', 'Software Engineer', 'Accountant', 'Bank Employee',
  'Office Assistant', 'Private Employee', 'Private Office', 'Salesman', 'Manager',
  'Driver', 'Security Guard', 'Factory Worker', 'Electrician', 'Mechanic', 'Nurse',
  'Pharmacist', 'Graphic Designer', 'Customer Service Representative', 'Other',
];

const BUSINESS = [
  'Shopkeeper', 'Trader', 'Farmer', 'Contractor', 'Property Dealer', 'Freelancer',
  'Online Seller', 'Restaurant Owner', 'Transport Business Owner', 'Manufacturer',
  'Tailor', 'Barber', 'Mechanic', 'Electrician', 'Plumber', 'Consultant',
  'Importer', 'Exporter', 'Other',
];

const PK_LANGUAGES = [
  'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Saraiki', 'Hindko', 'Brahui',
  'Kashmiri', 'Shina', 'Balti', 'Khowar', 'Burushaski', 'Gujarati', 'Gojri',
  'Pahari-Pothwari', 'Wakhi', 'Kalasha', 'Torwali', 'Dameli', 'Palula',
  'Indus Kohistani', 'Bateri', 'Chilisso', 'Dhatki', 'Marwari', 'Memoni', 'Jadgali',
  'Ormuri', 'Yidgha', 'Ushojo', 'Kundal Shahi', 'Savi',
];

const INTL_LANGUAGES = [
  'English', 'Arabic', 'Mandarin Chinese', 'Spanish', 'French', 'German', 'Portuguese',
  'Russian', 'Turkish', 'Persian', 'Hindi', 'Bengali', 'Japanese', 'Korean', 'Italian',
  'Dutch', 'Greek', 'Hebrew', 'Polish', 'Ukrainian', 'Romanian', 'Czech', 'Hungarian',
  'Danish', 'Swedish', 'Norwegian', 'Finnish', 'Icelandic', 'Irish', 'Welsh', 'Malay',
  'Indonesian', 'Thai', 'Vietnamese', 'Filipino/Tagalog', 'Burmese', 'Khmer', 'Lao',
  'Nepali', 'Sinhala', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Malayalam',
  'Azerbaijani', 'Kurdish', 'Armenian', 'Georgian', 'Swahili', 'Somali', 'Amharic',
  'Hausa', 'Yoruba', 'Zulu', 'Afrikaans',
];

const STATES = [
  'Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad', 'Gilgit-Baltistan', 'AJK', 'Overseas',
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belgium', 'Brazil', 'Brunei', 'Canada', 'China',
  'Denmark', 'Egypt', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan',
  'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Lebanon', 'Libya', 'Malaysia', 'Maldives',
  'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Oman',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia',
  'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Syria', 'Thailand', 'Turkey', 'Turkmenistan', 'UAE', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uzbekistan', 'Vietnam', 'Yemen', 'Other',
];

const CITIES_BY_PROVINCE = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Sialkot', 'Bahawalpur',
    'Sheikhupura', 'Sargodha', 'Jhang', 'Gujrat', 'Kasur', 'Rahim Yar Khan', 'Sahiwal', 'Okara',
    'Wah Cantonment', 'Dera Ghazi Khan', 'Burewala', 'Chiniot', 'Kamoke', 'Hafizabad', 'Khanewal',
    'Muzaffargarh', 'Muridke', 'Pakpattan', 'Jhelum', 'Vehari', 'Attock', 'Mandi Bahauddin',
    'Chakwal', 'Toba Tek Singh', 'Khushab', 'Mianwali', 'Bhakkar', 'Layyah', 'Narowal',
    'Kot Addu', 'Ahmadpur East', 'Wazirabad', 'Daska', 'Gojra', 'Samundri', 'Chishtian',
    'Hasilpur', 'Arifwala', 'Lodhran', 'Jampur', 'Haroonabad', 'Kabirwala', 'Rajanpur',
    'Taunsa', 'Liaquatpur', 'Minchinabad', 'Fort Abbas', 'Nankana Sahib', 'Pattoki', 'Shakargarh',
    'Pasrur', 'Sambrial', 'Kamalia', 'Pir Mahal', 'Bhalwal', 'Dipalpur', 'Renala Khurd',
    'Chunian', 'Kot Radha Kishan', 'Eminabad', 'Hujra Shah Muqeem', 'Dunyapur', 'Kanganpur',
    'Talagang', 'Pind Dadan Khan', 'Phalia', 'Baddomalhi', 'Zahir Pir', 'Kot Mithan',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas', 'Nawabshah', 'Jacobabad',
    'Shikarpur', 'Khairpur', 'Dadu', 'Thatta', 'Badin', 'Sanghar', 'Umerkot', 'Ghotki',
    'Kotri', 'Hala', 'Matiari', 'Tando Allahyar', 'Tando Muhammad Khan', 'Jamshoro',
    'Naushahro Feroze', 'Qambar Shahdadkot', 'Kashmore', 'Kandhkot', 'Ratodero', 'Sehwan',
    'Moro', 'Shahdadpur', 'Digri', 'Kunri', 'Pano Aqil', 'Rohri', 'Gambat', 'Mehar',
    'Khipro', 'Ranipur', 'Dokri', 'Mehrabpur', 'Mithi', 'Islamkot', 'Daharki', 'Ubauro',
    'Warah', 'Hingorja', 'Miro Khan', 'Kandiaro', 'Sakrand', 'Naudero', 'Shahpur Chakar',
    'Sinjhoro', 'Madeji', 'Bhiria', 'Daur', 'Talhar', 'Gharo', 'Gadap', 'Malir', 'Korangi',
  ],
  KPK: [
    'Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Dera Ismail Khan', 'Bannu',
    'Mansehra', 'Charsadda', 'Nowshera', 'Swabi', 'Haripur', 'Karak', 'Chitral', 'Timergara',
    'Parachinar', 'Tank', 'Lakki Marwat', 'Batkhela', 'Khalabat', 'Topi', 'Pabbi', 'Barikot',
    'Shabqadar', 'Landi Kotal', 'Hangu', 'Buner', 'Dir', 'Malakand', 'Matta', 'Kulachi',
    'Tangi', 'Risalpur', 'Jehangira', 'Amangarh', 'Tordher', 'Daggar', 'Alpuri', 'Besham',
    'Naran', 'Kaghan', 'Balakot', 'Battagram', 'Oghi', 'Havelian', 'Taxila', 'Kahuta',
  ],
  Balochistan: [
    'Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Dera Murad Jamali',
    'Sibi', 'Loralai', 'Mastung', 'Nushki', 'Kalat', 'Pasni', 'Panjgur', 'Usta Muhammad',
    'Surab', 'Nokkundi', 'Washuk', 'Dalbandin', 'Kharan', 'Muslim Bagh', 'Wadh', 'Awaran',
    'Qila Saifullah', 'Pishin', 'Killa Abdullah', 'Bela', 'Uthal', 'Lasbela', 'Ormara',
    'Jiwani', 'Tump', 'Mand', 'Hoshab', 'Sohbatpur', 'Gandava', 'Mach', 'Duki', 'Kohlu',
    'Barkhan', 'Musakhel', 'Ziarat', 'Harnai', 'Dera Bugti', 'Jaffarabad', 'Nasirabad',
  ],
  Islamabad: [
    'Islamabad', 'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10',
    'G-11', 'G-13', 'G-15', 'I-8', 'I-9', 'I-10', 'I-11', 'E-7', 'E-11', 'Bahria Town',
    'DHA Islamabad', 'Tarlai', 'Bara Kahu', 'Tarnol', 'Sihala', 'Rawal Town',
  ],
  'Gilgit-Baltistan': [
    'Gilgit', 'Skardu', 'Hunza', 'Aliabad', 'Ghizer', 'Gahkuch', 'Ghanche', 'Khaplu',
    'Diamer', 'Chilas', 'Astore', 'Eidgah', 'Shigar', 'Nagar', 'Ishkoman', 'Yasin',
    'Gupis', 'Phander', 'Juglot', 'Sost', 'Passu', 'Minimarg', 'Rama', 'Bagrot',
  ],
  AJK: [
    'Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bagh', 'Bhimber', 'Neelum', 'Athmuqam',
    'Hattian Bala', 'Haveli', 'Poonch', 'Sudhanoti', 'Palandri', 'Sehnsa', 'Chakswari',
    'Dadyal', 'Islamgarh', 'Khuiratta', 'Nakyal', 'Samahni', 'Forward Kahuta', 'Hajira',
    'Plandri', 'Chikar', 'Kel', 'Sharda', 'Leepa', 'Hattian',
  ],
};

function buildRows() {
  const rows = [];
  let order = 0;

  const push = (field_key, label, category = null) => {
    rows.push({ field_key, category, label, sort_order: order++ });
  };

  for (const label of CASTE) push('caste', label);
  for (const label of EDUCATION) push('education', label);
  for (const label of GOVERNMENT) push('profession', label, 'Government Job');
  for (const label of PRIVATE) push('profession', label, 'Private Job');
  for (const label of BUSINESS) push('profession', label, 'Business / Self-Employed');
  for (const label of PK_LANGUAGES) push('language', label, 'Pakistan');
  for (const label of INTL_LANGUAGES) push('language', label, 'International');
  for (const label of STATES) push('state', label);
  for (const label of COUNTRIES) push('country', label);
  for (const [province, cities] of Object.entries(CITIES_BY_PROVINCE)) {
    for (const label of cities) push('city', label, province);
  }

  for (const label of ['Very Fair', 'Fair', 'Wheatish', 'Dull Wheatish', 'Dark']) {
    push('color', label);
  }
  for (const label of ['Islam', 'Christianity', 'Hinduism', 'Sikhism', 'Other']) {
    push('religion', label);
  }
  const sects = [
    { category: 'Islam', labels: ['Sunni', 'Shia', 'Deobandi', 'Barelvi', 'Ahle Hadees', 'Ismaili', 'Other'] },
    { category: 'Christianity', labels: ['Catholic', 'Protestant', 'Orthodox', 'Anglican', 'Pentecostal', 'Seventh-day Adventist', 'Other'] },
    { category: 'Hinduism', labels: ['Shaivism', 'Vaishnavism', 'Shaktism', 'Smartism', 'Other'] },
    { category: 'Other', labels: ['Other'] },
  ];
  for (const group of sects) {
    for (const label of group.labels) push('sect', label, group.category);
  }
  for (const row of [
    { label: 'Single', value: 'never_married' },
    { label: 'Divorced', value: 'divorced' },
    { label: 'Widowed', value: 'widowed' },
    { label: 'Separated', value: 'separated' },
  ]) {
    push('marital_status', row.value);
  }
  for (const label of ['Father', 'Mother', 'Guardian']) push('guardian_type', label);
  for (const label of ['Own', 'Rent']) push('house_type', label);
  for (const label of ['No', 'Yes']) push('disability', label);

  return rows;
}

module.exports = { buildRows };
