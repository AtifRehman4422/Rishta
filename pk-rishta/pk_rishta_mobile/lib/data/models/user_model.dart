class AppUser {
  AppUser({
    required this.id,
    required this.email,
    this.role = 'user',
    this.firstName,
    this.lastName,
    this.city,
    this.province,
    this.isProfileComplete = false,
    this.profileVerified = false,
    this.profilePhoto,
  });

  final String id;
  final String email;
  final String role;
  final String? firstName;
  final String? lastName;
  final String? city;
  final String? province;
  final bool isProfileComplete;
  final bool profileVerified;
  final String? profilePhoto;

  bool get isAdmin => role == 'admin';

  String get displayName {
    final name = [firstName, lastName].where((n) => n != null && n.isNotEmpty).join(' ');
    return name.isEmpty ? email : name;
  }

  factory AppUser.fromLogin(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(),
      email: (json['email'] ?? '') as String,
      role: (json['role'] ?? 'user') as String,
    );
  }

  factory AppUser.fromMe(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(),
      email: (json['email'] ?? '') as String,
      role: (json['role'] ?? 'user') as String,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      city: json['city'] as String?,
      province: json['province'] as String?,
      isProfileComplete: json['is_profile_complete'] == true,
      profileVerified: json['profile_verified'] == true,
      profilePhoto: json['profile_photo'] as String?,
    );
  }
}
