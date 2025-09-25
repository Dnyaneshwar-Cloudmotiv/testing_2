// connectivity_service.dart
import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final _connectivity = Connectivity();
  final _controller = StreamController<bool>.broadcast();
  bool _hasConnection = true;

  ConnectivityService() {
    _connectivity.onConnectivityChanged.listen(_updateConnectionStatus);
    checkConnection();
  }

  Stream<bool> get connectionStream => _controller.stream;
  bool get hasConnection => _hasConnection;
  bool get isClosed => _controller.isClosed; // Check if stream is closed

  Future<void> checkConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _updateConnectionStatus(result);
    } catch (e) {
      if (!_controller.isClosed) {
        _controller.add(false);
      }
      _hasConnection = false;
    }
  }

  void _updateConnectionStatus(ConnectivityResult result) {
    bool hasConnection = result != ConnectivityResult.none;
    _hasConnection = hasConnection;

    if (!_controller.isClosed) {
      _controller.add(hasConnection);
    }
  }

  void dispose() {
    if (!_controller.isClosed) {
      _controller.close();
    }
  }
}
