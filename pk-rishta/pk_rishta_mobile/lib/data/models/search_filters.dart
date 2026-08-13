class SearchFilters {
  SearchFilters({
    this.gender = '',
    this.city = '',
    this.province = '',
    this.country = '',
    this.maritalStatus = '',
    this.religion = '',
    this.education = '',
    this.minAge = '',
    this.maxAge = '',
  });

  String gender;
  String city;
  String province;
  String country;
  String maritalStatus;
  String religion;
  String education;
  String minAge;
  String maxAge;

  SearchFilters copy() => SearchFilters(
        gender: gender,
        city: city,
        province: province,
        country: country,
        maritalStatus: maritalStatus,
        religion: religion,
        education: education,
        minAge: minAge,
        maxAge: maxAge,
      );

  void reset() {
    gender = '';
    city = '';
    province = '';
    country = '';
    maritalStatus = '';
    religion = '';
    education = '';
    minAge = '';
    maxAge = '';
  }

  int get activeCount {
    var n = 0;
    if (gender.isNotEmpty) n++;
    if (city.isNotEmpty) n++;
    if (province.isNotEmpty) n++;
    if (country.isNotEmpty) n++;
    if (maritalStatus.isNotEmpty) n++;
    if (religion.isNotEmpty) n++;
    if (education.isNotEmpty) n++;
    if (minAge.isNotEmpty) n++;
    if (maxAge.isNotEmpty) n++;
    return n;
  }

  List<String> get summaryChips {
    final chips = <String>[];
    if (gender.isNotEmpty) chips.add(gender == 'male' ? 'Male' : 'Female');
    if (province.isNotEmpty) chips.add(provinceLabel(province));
    if (country.isNotEmpty) chips.add(country);
    if (city.isNotEmpty) chips.add(city);
    if (minAge.isNotEmpty || maxAge.isNotEmpty) {
      chips.add('${minAge.isEmpty ? '18' : minAge}-${maxAge.isEmpty ? '∞' : maxAge} yrs');
    }
    if (maritalStatus.isNotEmpty) {
      chips.add(maritalStatusLabels[maritalStatus] ?? maritalStatus);
    }
    if (religion.isNotEmpty) chips.add(religion);
    if (education.isNotEmpty) chips.add(education);
    return chips;
  }

  Map<String, dynamic> toQuery({int page = 1, int limit = 30}) => {
        'gender': gender.isEmpty ? null : gender,
        'city': city.isEmpty ? null : city,
        'province': province.isEmpty ? null : province,
        'country': country.isEmpty ? null : country,
        'marital_status': maritalStatus.isEmpty ? null : maritalStatus,
        'religion': religion.isEmpty ? null : religion,
        'education': education.isEmpty ? null : education,
        'min_age': minAge.isEmpty ? null : minAge,
        'max_age': maxAge.isEmpty ? null : maxAge,
        'page': page,
        'limit': limit,
      };
}

const pakistanProvinces = [
  'Punjab',
  'Sindh',
  'KPK',
  'Balochistan',
  'Islamabad',
  'Gilgit-Baltistan',
  'AJK',
  'Overseas',
];

const provinceLabels = {
  'Punjab': 'Punjab',
  'Sindh': 'Sindh',
  'KPK': 'Khyber Pakhtunkhwa',
  'Balochistan': 'Balochistan',
  'Islamabad': 'Islamabad Capital Territory',
  'Gilgit-Baltistan': 'Gilgit-Baltistan',
  'AJK': 'Azad Jammu & Kashmir',
  'Overseas': 'Overseas / Abroad',
};

String provinceLabel(String code) => provinceLabels[code] ?? code;

const overseasCountries = [
  'Afghanistan',
  'Australia',
  'Bahrain',
  'Bangladesh',
  'Canada',
  'China',
  'Denmark',
  'Egypt',
  'France',
  'Germany',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Italy',
  'Japan',
  'Jordan',
  'Kuwait',
  'Lebanon',
  'Malaysia',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Oman',
  'Qatar',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'UAE',
  'United Kingdom',
  'United States',
  'Yemen',
];

const countrySuggestions = ['Pakistan', ...overseasCountries];

const religionOptions = [
  'Islam',
  'Christianity',
  'Hinduism',
  'Sikhism',
  'Other',
];

const maritalStatusOptions = [
  ('never_married', 'Single'),
  ('divorced', 'Divorced'),
  ('widowed', 'Widowed'),
  ('separated', 'Separated'),
];

const maritalStatusLabels = {
  'never_married': 'Single',
  'divorced': 'Divorced',
  'widowed': 'Widowed',
  'separated': 'Separated',
};

const educationOptions = [
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
