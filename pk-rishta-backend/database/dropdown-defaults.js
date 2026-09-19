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
  'Hafiz-e-Quran',
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

const NOT_WORKING = [
  'No Job', 'Student', 'Housewife', 'Retired', 'Other',
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
    'Islamabad',
    'B-17', 'C-13', 'C-14', 'C-15', 'C-16',
    'D-12', 'D-13', 'D-17', 'D-18',
    'E-7', 'E-11', 'E-12', 'E-13', 'E-16', 'E-17',
    'F-6', 'F-7', 'F-8', 'F-9', 'F-10', 'F-11', 'F-13', 'F-14', 'F-15', 'F-16', 'F-17',
    'G-5', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10', 'G-11', 'G-12', 'G-13', 'G-14', 'G-15', 'G-16', 'G-17',
    'H-8', 'H-9', 'H-10', 'H-11', 'H-12', 'H-13',
    'I-8', 'I-9', 'I-10', 'I-11', 'I-12', 'I-13', 'I-14', 'I-15', 'I-16',
    'AGOCHS Phase I', 'AGOCHS Phase II', 'Al-Hamra Avenue', 'Al-Hamra Hills Agro Farming Scheme',
    'Al-Makkah City', 'Anza Zephyr Dale Agro Farms', 'Army Welfare Trust',
    'Bahria Enclave Phase I', 'Bahria Enclave II Agro Farming Scheme', 'Bahria Enclave II Phase II',
    'Bahria Garden City', 'Bahria Town Phase III-E & IV', 'Bahria Town Phase VII-E',
    'Bahria Town Phase VII', 'Bahria Town Phases II, III, V & VI', 'Bahria Town',
    'Cabinet Division Employees Cooperative Housing Society', 'Capital Enclave', 'CBR Town',
    'DHA Islamabad', 'Engineers Cooperative', 'Engineers Housing Scheme',
    'Faisal Residentia Housing Scheme', 'Federal Government Employees Housing Foundation',
    'Federation of Employees', 'FIA Park Enclave Housing Scheme', 'Grace Valley',
    'Gulberg Greens', 'Gulberg Residencia', 'Gulshan-e-Rabia', 'Gulshan-e-Sehat',
    'Icon Garden', 'Islamabad Gardens', 'Islamabad Model Town', 'Jeddah Town',
    'Jinnah Garden Phase-I', 'Jinnah Garden Phase-I Extension', 'Jinnah Garden Phase-II',
    'Jinnah Town', 'Kashmir Gardens', 'Khayaban-e-Kashmir', 'Margalla View Housing Scheme',
    'Ministry of Interior Employees Cooperative Housing Society', 'Morgah City',
    'Multi Gardens Phase-I', 'Multi Gardens Phase-II',
    'National Assembly Employees Cooperative Housing Society',
    'National Cooperative Housing Society / New Islamabad Enclave',
    'National Police Foundation', 'Naval Anchorage', 'New Islamabad Garden',
    'OPF Housing Scheme', 'Pakistan Medical Cooperative Housing Scheme', 'Pakistan Navy Farms',
    'Paradise City', 'Park View City', 'Parliamentarians Enclave', 'PWD Housing Society',
    'Rahman Enclave', 'River Garden', 'Roshan Pakistan Housing Scheme', 'Senate Avenue',
    'Services Cooperative Housing Society', 'Soan Garden', 'Supreme Court Employees Housing Scheme',
    'T&T Employees Cooperative Housing Society', 'Tele Gardens F-17', 'Tele Town',
    'WWF Labor Colony', 'Zaraj Housing',
    'Ali Pur', 'Bani Gala', 'Bhara Kahu', 'Burma Town', 'Chak Shahzad', 'Ghauri Garden',
    'Ghauri Town', 'Golra', 'Khanna', 'Koral', 'Korang Town', 'Lehtrar Road', 'Margalla Town',
    'Muslim Town', 'Nilore', 'Pakistan Town', 'Phulgran', 'PWD', 'Rawal Town', 'Sangjani',
    'Shahzad Town', 'Shehzad Town', 'Sihala', 'Simly Dam Road', 'Sohan', 'Tarlai', 'Tarnol',
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
  for (const label of NOT_WORKING) push('profession', label, 'Not Working');
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
