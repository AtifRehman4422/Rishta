/// Options aligned with web my-profile (mobile-friendly subsets where lists are huge).
const colorOptions = ['Very Fair', 'Fair', 'Wheatish', 'Dull Wheatish', 'Dark'];

const guardianTypeOptions = ['Father', 'Mother', 'Guardian'];

const disabilityChoices = ['No', 'Yes'];

const religionOptionsFull = ['Islam', 'Christianity', 'Hinduism', 'Sikhism', 'Other'];

const sectsByReligion = <String, List<String>>{
  'Islam': ['Sunni', 'Shia', 'Deobandi', 'Barelvi', 'Ahle Hadees', 'Ismaili', 'Other'],
  'Christianity': ['Catholic', 'Protestant', 'Orthodox', 'Anglican', 'Pentecostal', 'Seventh-day Adventist', 'Other'],
  'Hinduism': ['Shaivism', 'Vaishnavism', 'Shaktism', 'Smartism', 'Other'],
  'Other': ['Other'],
};

List<String> sectsForReligion(String? religion) {
  if (religion == null || religion.trim().isEmpty) return const [];
  return sectsByReligion[religion] ?? const ['Other'];
}

const pakistanLanguages = [
  'Urdu',
  'Punjabi',
  'Sindhi',
  'Pashto',
  'Balochi',
  'Saraiki',
  'Hindko',
  'Brahui',
  'Kashmiri',
  'Shina',
  'Balti',
  'Khowar',
  'Burushaski',
  'Gujarati',
  'Gojri',
  'Pahari-Pothwari',
  'Wakhi',
  'Kalasha',
  'Torwali',
  'Dameli',
  'Palula',
  'Indus Kohistani',
  'Bateri',
  'Chilisso',
  'Dhatki',
  'Marwari',
  'Memoni',
  'Jadgali',
  'Ormuri',
  'Yidgha',
  'Ushojo',
  'Kundal Shahi',
  'Savi',
];

const internationalLanguages = [
  'English',
  'Arabic',
  'Mandarin Chinese',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Russian',
  'Turkish',
  'Persian',
  'Hindi',
  'Bengali',
  'Japanese',
  'Korean',
  'Italian',
  'Dutch',
  'Greek',
  'Hebrew',
  'Polish',
  'Ukrainian',
  'Romanian',
  'Czech',
  'Hungarian',
  'Danish',
  'Swedish',
  'Norwegian',
  'Finnish',
  'Icelandic',
  'Irish',
  'Welsh',
  'Malay',
  'Indonesian',
  'Thai',
  'Vietnamese',
  'Filipino/Tagalog',
  'Burmese',
  'Khmer',
  'Lao',
  'Nepali',
  'Sinhala',
  'Tamil',
  'Telugu',
  'Marathi',
  'Kannada',
  'Malayalam',
  'Azerbaijani',
  'Kurdish',
  'Armenian',
  'Georgian',
  'Swahili',
  'Somali',
  'Amharic',
  'Hausa',
  'Yoruba',
  'Zulu',
  'Afrikaans',
];

const professionCategories = [
  'Government Job',
  'Private Job',
  'Business / Self-Employed',
  'Not Working',
];

const professionOther = 'Other';

const professionsByCategory = <String, List<String>>{
  'Government Job': [
    'Government Teacher', 'Government Doctor', 'Police', 'Army', 'Navy', 'Air Force',
    'Civil Servant', 'Government Clerk', 'Government Engineer', 'Government Employee',
    'Government Office', 'Railway Employee', 'Post Office Employee', 'Judge',
    'Government Lawyer', 'Tax', 'Customs', 'Rescue', 'Firefighter', 'Other',
  ],
  'Private Job': [
    'Private Teacher', 'Private Doctor', 'Software Engineer', 'Accountant', 'Bank Employee',
    'Office Assistant', 'Private Employee', 'Private Office', 'Salesman', 'Manager',
    'Driver', 'Security Guard', 'Factory Worker', 'Electrician', 'Mechanic', 'Nurse',
    'Pharmacist', 'Graphic Designer', 'Customer Service Representative', 'Other',
  ],
  'Business / Self-Employed': [
    'Shopkeeper', 'Trader', 'Farmer', 'Contractor', 'Property Dealer', 'Freelancer',
    'Online Seller', 'Restaurant Owner', 'Transport Business Owner', 'Manufacturer',
    'Tailor', 'Barber', 'Mechanic', 'Electrician', 'Plumber', 'Consultant', 'Importer',
    'Exporter', 'Other',
  ],
  'Not Working': [
    'No Job', 'Student', 'Housewife', 'Retired', 'Other',
  ],
};

/// Stored format on the backend matches the web: `Category — Role`.
String formatProfession(String category, String choice, {String otherText = ''}) {
  if (category.isEmpty || choice.isEmpty) return '';
  if (choice == professionOther) {
    final custom = otherText.trim();
    return custom.isEmpty ? '' : '$category — $custom';
  }
  return '$category — $choice';
}

/// Splits a stored `Category — Role` value back into its parts.
({String category, String choice, String otherText}) parseStoredProfession(String value) {
  final stored = value.trim();
  if (stored.isEmpty) return (category: '', choice: '', otherText: '');
  for (final category in professionCategories) {
    final prefix = '$category — ';
    if (!stored.startsWith(prefix)) continue;
    final rest = stored.substring(prefix.length).trim();
    final options = professionsByCategory[category] ?? const [];
    if (options.contains(rest)) {
      return (category: category, choice: rest, otherText: '');
    }
    return (category: category, choice: professionOther, otherText: rest);
  }
  return (category: '', choice: stored, otherText: '');
}

/// Roles for a category, including any currently-stored role not in the list.
List<String> professionsForCategory(String category, {String current = ''}) {
  final base = professionsByCategory[category] ?? const <String>[];
  if (current.isEmpty || base.contains(current)) return List.of(base);
  return [current, ...base];
}

const casteOptionsFull = [
  'Abbasi', 'Achakzai', 'Afridi', 'Ansari', 'Arain', 'Awan', 'Babar', 'Baloch', 'Bangash',
  'Bhatti', 'Bhutto', 'Bizenjo', 'Bugti', 'Butt', 'Chandio', 'Chaudhry', 'Cheema', 'Chohan',
  'Dar', 'Dogar', 'Durrani', 'Gakhar', 'Gondal', 'Gujjar', 'Hashmi', 'Jamali', 'Janjua',
  'Jatoi', 'Jatt', 'Junejo', 'Kalhoro', 'Kamboh', 'Khaskheli', 'Khattak', 'Khawaja',
  'Khokhar', 'Leghari', 'Lohana', 'Lone', 'Mahar', 'Malik', 'Marri', 'Mazari', 'Mehsud',
  'Memon', 'Mengal', 'Mir', 'Mirza', 'Mohmand', 'Mughal', 'Orakzai', 'Panhwar', 'Pathan',
  'Qureshi', 'Raisani', 'Rajput', 'Rathore', 'Rind', 'Samma', 'Sandhu', 'Sheikh',
  'Shinwari', 'Sial', 'Siddiqui', 'Soomro', 'Syed', 'Talpur', 'Tareen', 'Tiwana', 'Wani',
  'Warraich', 'Wazir', 'Yousafzai', 'Zehri', 'Other',
];

const heightFeetOptions = [4, 5, 6, 7];
const heightInchesOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

int feetInchesToCm(int feet, int inches) =>
    ((feet * 12 + inches) * 2.54).round();

({int? feet, int? inches}) parseFeetInchesFromCm(int? cm) {
  if (cm == null || cm <= 0) return (feet: null, inches: null);
  final total = (cm / 2.54).round();
  return (feet: total ~/ 12, inches: total % 12);
}

const citiesByProvince = <String, List<String>>{
  'Punjab': [
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
  'Sindh': [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas', 'Nawabshah', 'Jacobabad',
    'Shikarpur', 'Khairpur', 'Dadu', 'Thatta', 'Badin', 'Sanghar', 'Umerkot', 'Ghotki',
    'Kotri', 'Hala', 'Matiari', 'Tando Allahyar', 'Tando Muhammad Khan', 'Jamshoro',
    'Naushahro Feroze', 'Qambar Shahdadkot', 'Kashmore', 'Kandhkot', 'Ratodero', 'Sehwan',
    'Moro', 'Shahdadpur', 'Digri', 'Kunri', 'Pano Aqil', 'Rohri', 'Gambat', 'Mehar',
    'Khipro', 'Ranipur', 'Dokri', 'Mehrabpur', 'Mithi', 'Islamkot', 'Daharki', 'Ubauro',
    'Warah', 'Hingorja', 'Miro Khan', 'Kandiaro', 'Sakrand', 'Naudero', 'Shahpur Chakar',
    'Sinjhoro', 'Madeji', 'Bhiria', 'Daur', 'Talhar', 'Gharo', 'Gadap', 'Malir', 'Korangi',
  ],
  'KPK': [
    'Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Dera Ismail Khan', 'Bannu',
    'Mansehra', 'Charsadda', 'Nowshera', 'Swabi', 'Haripur', 'Karak', 'Chitral', 'Timergara',
    'Parachinar', 'Tank', 'Lakki Marwat', 'Batkhela', 'Khalabat', 'Topi', 'Pabbi', 'Barikot',
    'Shabqadar', 'Landi Kotal', 'Hangu', 'Buner', 'Dir', 'Malakand', 'Matta', 'Kulachi',
    'Tangi', 'Risalpur', 'Jehangira', 'Amangarh', 'Tordher', 'Daggar', 'Alpuri', 'Besham',
    'Naran', 'Kaghan', 'Balakot', 'Battagram', 'Oghi', 'Havelian', 'Taxila', 'Kahuta',
  ],
  'Balochistan': [
    'Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Dera Murad Jamali',
    'Sibi', 'Loralai', 'Mastung', 'Nushki', 'Kalat', 'Pasni', 'Panjgur', 'Usta Muhammad',
    'Surab', 'Nokkundi', 'Washuk', 'Dalbandin', 'Kharan', 'Muslim Bagh', 'Wadh', 'Awaran',
    'Qila Saifullah', 'Pishin', 'Killa Abdullah', 'Bela', 'Uthal', 'Lasbela', 'Ormara',
    'Jiwani', 'Tump', 'Mand', 'Hoshab', 'Sohbatpur', 'Gandava', 'Mach', 'Duki', 'Kohlu',
    'Barkhan', 'Musakhel', 'Ziarat', 'Harnai', 'Dera Bugti', 'Jaffarabad', 'Nasirabad',
  ],
  'Islamabad': [
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
  'AJK': [
    'Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bagh', 'Bhimber', 'Neelum', 'Athmuqam',
    'Hattian Bala', 'Haveli', 'Poonch', 'Sudhanoti', 'Palandri', 'Sehnsa', 'Chakswari',
    'Dadyal', 'Islamgarh', 'Khuiratta', 'Nakyal', 'Samahni', 'Forward Kahuta', 'Hajira',
    'Plandri', 'Chikar', 'Kel', 'Sharda', 'Leepa', 'Hattian',
  ],
};

List<String> citiesForProvince(String province) =>
    citiesByProvince[province] ?? const [];
