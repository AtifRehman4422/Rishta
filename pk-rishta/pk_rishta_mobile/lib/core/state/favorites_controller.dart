import 'package:flutter/material.dart';

import '../../data/models/profile_model.dart';
import '../../data/repositories/profile_repository.dart';
import '../network/api_client.dart';
import 'auth_controller.dart';

/// Holds the current user's saved (favorite) profile ids so heart icons
/// across Home / Search / Profile Detail stay in sync.
class FavoritesController extends ChangeNotifier {
  FavoritesController._() {
    AuthController.instance.addListener(_onAuthChanged);
  }

  static final FavoritesController instance = FavoritesController._();

  final ProfileRepository _repo = ProfileRepository();

  final Set<String> _ids = {};
  List<Profile> _profiles = [];
  bool _loading = false;

  bool get loading => _loading;
  List<Profile> get profiles => List.unmodifiable(_profiles);
  int get count => _ids.length;

  bool isFavorite(String profileId) => _ids.contains(profileId);

  void _onAuthChanged() {
    if (AuthController.instance.canViewProfiles && !AuthController.instance.isAdmin) {
      Future.microtask(load);
    } else {
      Future.microtask(clear);
    }
  }

  /// Loads favorites once for an already-logged-in session (e.g. app start).
  Future<void> ensureLoaded() async {
    if (!AuthController.instance.canViewProfiles || AuthController.instance.isAdmin) return;
    await load();
  }

  Future<void> load() async {
    if (!AuthController.instance.canViewProfiles || AuthController.instance.isAdmin) return;
    _loading = true;
    notifyListeners();
    try {
      final list = await _repo.getFavorites();
      _profiles = list;
      _ids
        ..clear()
        ..addAll(list.map((p) => p.id));
    } on ApiException {
      // Keep last known state on failure.
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void clear() {
    _ids.clear();
    _profiles = [];
    _loading = false;
    notifyListeners();
  }

  /// Optimistically toggles a favorite and returns the outcome. Callers
  /// should ensure the user is logged in first.
  Future<FavoriteToggleResult> toggle(String profileId) async {
    final wasFavorite = _ids.contains(profileId);
    if (wasFavorite) {
      _ids.remove(profileId);
      _profiles.removeWhere((p) => p.id == profileId);
    } else {
      _ids.add(profileId);
    }
    notifyListeners();

    try {
      if (wasFavorite) {
        await _repo.removeFavorite(profileId);
      } else {
        await _repo.addFavorite(profileId);
      }
      return FavoriteToggleResult(isFavorite: !wasFavorite);
    } on ApiException catch (e) {
      if (wasFavorite) {
        _ids.add(profileId);
      } else {
        _ids.remove(profileId);
      }
      notifyListeners();
      debugPrint('Favorite toggle failed for $profileId: ${e.message}');
      return FavoriteToggleResult(error: e.message);
    } catch (e) {
      if (wasFavorite) {
        _ids.add(profileId);
      } else {
        _ids.remove(profileId);
      }
      notifyListeners();
      debugPrint('Favorite toggle crashed for $profileId: $e');
      return FavoriteToggleResult(error: 'Could not update favorites. Try again.');
    }
  }
}

class FavoriteToggleResult {
  const FavoriteToggleResult({this.isFavorite, this.error});

  /// True = added, false = removed, null = request failed.
  final bool? isFavorite;
  final String? error;
}

/// Shows a colored snackbar for a favorite toggle result:
/// green for "Added", red for "Removed" / errors.
void showFavoriteSnackBar(BuildContext context, FavoriteToggleResult result) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.hideCurrentSnackBar();
  if (result.error != null) {
    messenger.showSnackBar(
      SnackBar(
        content: Text(result.error!),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
    return;
  }
  final added = result.isFavorite == true;
  messenger.showSnackBar(
    SnackBar(
      content: Row(
        children: [
          Icon(
            added ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            color: Colors.white,
            size: 20,
          ),
          const SizedBox(width: 10),
          Text(added ? 'Added to favorites' : 'Removed from favorites'),
        ],
      ),
      backgroundColor: added ? Colors.green.shade600 : Colors.red.shade700,
      behavior: SnackBarBehavior.floating,
    ),
  );
}
