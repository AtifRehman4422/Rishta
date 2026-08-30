List<String> parseMultiSelect(String? raw) {
  if (raw == null || raw.trim().isEmpty) return [];
  return raw
      .split(',')
      .map((e) => e.trim())
      .where((e) => e.isNotEmpty && e != '---')
      .toList();
}

String joinMultiSelect(List<String> values) {
  final cleaned = values.map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
  return cleaned.isEmpty ? '' : cleaned.join(', ');
}

class MyProfileData {
  MyProfileData({
    this.id,
    this.email = '',
    this.firstName = '',
    this.lastName = '',
    this.gender = '',
    this.dateOfBirth = '',
    this.heightCm,
    this.weightKg,
    this.maritalStatus = '',
    this.color = '',
    this.guardianType = '',
    this.guardianName = '',
    this.disability = '',
    this.religion = '',
    this.sect = '',
    this.caste = '',
    this.languages = '',
    this.motherTongue = '',
    this.city = '',
    this.province = '',
    this.country = 'Pakistan',
    this.education = '',
    this.profession = '',
    this.hafizQuran = '',
    this.incomeRange = '',
    this.aboutMe = '',
    this.familyDetails = '',
    this.lookingFor = '',
    this.houseOwnLocation = '',
    this.houseRentLocation = '',
    this.abroadCountry = '',
    this.abroadHouseOwnLocation = '',
    this.abroadHouseRentLocation = '',
    this.profilePhoto = '',
    this.isProfileComplete = false,
    this.contacts = const [],
    this.partnerMinAge,
    this.partnerMaxAge,
    this.partnerMinHeightCm,
    this.partnerMaxHeightCm,
    this.partnerReligion = '',
    this.partnerSect = '',
    this.partnerCastes = const [],
    this.partnerStates = const [],
    this.partnerCountries = const [],
    this.partnerCities = const [],
    this.partnerEducations = const [],
    this.partnerProfessions = const [],
    this.partnerMaritalStatus = '',
    this.partnerRequirementsNotes = '',
  });

  String? id;
  String email;
  String firstName;
  String lastName;
  String gender;
  String dateOfBirth;
  int? heightCm;
  num? weightKg;
  String maritalStatus;
  String color;
  String guardianType;
  String guardianName;
  String disability;
  String religion;
  String sect;
  String caste;
  String languages;
  String motherTongue;
  String city;
  String province;
  String country;
  String education;
  String profession;
  String hafizQuran;
  String incomeRange;
  String aboutMe;
  String familyDetails;
  String lookingFor;
  String houseOwnLocation;
  String houseRentLocation;
  String abroadCountry;
  String abroadHouseOwnLocation;
  String abroadHouseRentLocation;
  String profilePhoto;
  bool isProfileComplete;
  List<ProfileContact> contacts;
  int? partnerMinAge;
  int? partnerMaxAge;
  int? partnerMinHeightCm;
  int? partnerMaxHeightCm;
  String partnerReligion;
  String partnerSect;
  List<String> partnerCastes;
  List<String> partnerStates;
  List<String> partnerCountries;
  List<String> partnerCities;
  List<String> partnerEducations;
  List<String> partnerProfessions;
  String partnerMaritalStatus;
  String partnerRequirementsNotes;

  String get fullName {
    final name = '$firstName $lastName'.trim();
    if (name == '-' || name.isEmpty) return '';
    if (lastName == '-') return firstName;
    return name;
  }

  set fullName(String value) {
    final cleaned = value.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (cleaned.isEmpty) {
      firstName = '';
      lastName = '';
      return;
    }
    final space = cleaned.indexOf(' ');
    if (space == -1) {
      firstName = cleaned;
      lastName = '—';
    } else {
      firstName = cleaned.substring(0, space);
      lastName = cleaned.substring(space + 1).trim();
      if (lastName.isEmpty) lastName = '—';
    }
  }

  static int? _toInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }

  static num? _toNum(dynamic v) {
    if (v == null) return null;
    if (v is num) return v;
    return num.tryParse(v.toString());
  }

  static String _str(dynamic v) => v == null ? '' : v.toString();

  factory MyProfileData.fromJson(Map<String, dynamic> json) {
    final prefs = (json['partner_preferences'] as Map<String, dynamic>?) ?? {};
    final contactsJson = (json['contacts'] as List?) ?? [];
    return MyProfileData(
      id: json['id']?.toString(),
      email: _str(json['user_email'] ?? json['email']),
      firstName: _str(json['first_name']),
      lastName: _str(json['last_name']),
      gender: _str(json['gender']),
      dateOfBirth: _str(json['date_of_birth']).split('T').first,
      heightCm: _toInt(json['height_cm']),
      weightKg: _toNum(json['weight_kg']),
      maritalStatus: _str(json['marital_status']),
      color: _str(json['color']),
      guardianType: _str(json['guardian_type']),
      guardianName: _str(json['guardian_name']),
      disability: _str(json['disability']),
      religion: _str(json['religion']),
      sect: _str(json['sect']),
      caste: _str(json['caste']),
      languages: _str(json['languages']),
      motherTongue: _str(json['mother_tongue']),
      city: _str(json['city']),
      province: _str(json['province']),
      country: _str(json['country']).isEmpty ? 'Pakistan' : _str(json['country']),
      education: _str(json['education']),
      profession: _str(json['profession']),
      hafizQuran: _str(json['hafiz_quran']),
      incomeRange: _str(json['income_range']),
      aboutMe: _str(json['about_me']),
      familyDetails: _str(json['family_details']),
      lookingFor: _str(json['looking_for']),
      houseOwnLocation: _str(json['house_own_location']),
      houseRentLocation: _str(json['house_rent_location']),
      abroadCountry: _str(json['abroad_country']),
      abroadHouseOwnLocation: _str(json['abroad_house_own_location']),
      abroadHouseRentLocation: _str(json['abroad_house_rent_location']),
      profilePhoto: _str(json['profile_photo']),
      isProfileComplete: json['is_profile_complete'] == true,
      contacts: contactsJson
          .map((e) => ProfileContact.fromJson(e as Map<String, dynamic>))
          .toList(),
      partnerMinAge: _toInt(prefs['min_age']),
      partnerMaxAge: _toInt(prefs['max_age']),
      partnerMinHeightCm: _toInt(prefs['min_height_cm']),
      partnerMaxHeightCm: _toInt(prefs['max_height_cm']),
      partnerReligion: _str(prefs['religion']),
      partnerSect: _str(prefs['sect']),
      partnerCastes: parseMultiSelect(_str(prefs['caste'])),
      partnerStates: parseMultiSelect(_str(prefs['province'])),
      partnerCountries: parseMultiSelect(_str(prefs['country'])),
      partnerCities: parseMultiSelect(_str(prefs['city'])),
      partnerEducations: parseMultiSelect(_str(prefs['education'])),
      partnerProfessions: parseMultiSelect(_str(prefs['profession'])),
      partnerMaritalStatus: _str(prefs['marital_status']),
      partnerRequirementsNotes: _str(prefs['requirements_notes']),
    );
  }

  Map<String, dynamic> toUpdateBody() {
    return {
      'email': email.isEmpty ? null : email,
      'first_name': firstName,
      'last_name': lastName,
      'gender': gender,
      'date_of_birth': dateOfBirth,
      'height_cm': heightCm,
      'weight_kg': weightKg,
      'marital_status': maritalStatus.isEmpty ? null : maritalStatus,
      'color': color.isEmpty ? null : color,
      'guardian_type': guardianType.isEmpty ? null : guardianType,
      'guardian_name': guardianName.isEmpty ? null : guardianName,
      'disability': disability.isEmpty ? null : disability,
      'religion': religion.isEmpty ? null : religion,
      'sect': sect.isEmpty ? null : sect,
      'caste': caste.isEmpty ? null : caste,
      'languages': languages.isEmpty ? null : languages,
      'mother_tongue': motherTongue.isEmpty ? null : motherTongue,
      'city': city,
      'province': province,
      'country': province == 'Overseas' ? (abroadCountry.isEmpty ? country : abroadCountry) : 'Pakistan',
      'education': education.isEmpty ? null : education,
      'profession': profession.isEmpty ? null : profession,
      'hafiz_quran': hafizQuran.isEmpty ? null : hafizQuran,
      'income_range': incomeRange.isEmpty ? null : incomeRange,
      'about_me': aboutMe.isEmpty ? null : aboutMe,
      'family_details': familyDetails.isEmpty ? null : familyDetails,
      'looking_for': lookingFor.isEmpty ? null : lookingFor,
      'house_own_location': houseOwnLocation.isEmpty ? null : houseOwnLocation,
      'house_rent_location': houseRentLocation.isEmpty ? null : houseRentLocation,
      'abroad_country': abroadCountry.isEmpty ? null : abroadCountry,
      'abroad_house_own_location': abroadHouseOwnLocation.isEmpty ? null : abroadHouseOwnLocation,
      'abroad_house_rent_location': abroadHouseRentLocation.isEmpty ? null : abroadHouseRentLocation,
      'profile_photo': profilePhoto.isEmpty ? null : profilePhoto,
      'contacts': contacts
          .where((c) => c.number.trim().isNotEmpty)
          .map((c) => {'type': c.type, 'number': c.number.trim()})
          .toList(),
      'partner_preferences': {
        'min_age': partnerMinAge,
        'max_age': partnerMaxAge,
        'min_height_cm': partnerMinHeightCm,
        'max_height_cm': partnerMaxHeightCm,
        'religion': partnerReligion.isEmpty ? null : partnerReligion,
        'sect': partnerSect.isEmpty ? null : partnerSect,
        'caste': joinMultiSelect(partnerCastes).isEmpty ? null : joinMultiSelect(partnerCastes),
        'province': joinMultiSelect(partnerStates).isEmpty ? null : joinMultiSelect(partnerStates),
        'country': joinMultiSelect(partnerCountries).isEmpty ? null : joinMultiSelect(partnerCountries),
        'city': joinMultiSelect(partnerCities).isEmpty ? null : joinMultiSelect(partnerCities),
        'education': joinMultiSelect(partnerEducations).isEmpty ? null : joinMultiSelect(partnerEducations),
        'profession': joinMultiSelect(partnerProfessions).isEmpty ? null : joinMultiSelect(partnerProfessions),
        'marital_status': partnerMaritalStatus.isEmpty ? null : partnerMaritalStatus,
        'requirements_notes': partnerRequirementsNotes.isEmpty ? null : partnerRequirementsNotes,
      },
    };
  }
}

class ProfileContact {
  ProfileContact({this.type = 'phone', this.number = ''});

  String type;
  String number;

  factory ProfileContact.fromJson(Map<String, dynamic> json) {
    return ProfileContact(
      type: (json['type'] ?? json['contact_type'] ?? 'phone').toString(),
      number: (json['number'] ?? '').toString(),
    );
  }
}
