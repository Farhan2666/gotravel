import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Future<List<dynamic>> getRoutes() async {
    final response = await http.get(Uri.parse('$baseUrl/routes'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load travel routes');
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      _token = data['token'];
      return data;
    } else {
      final err = json.decode(response.body);
      throw Exception(err['error'] ?? 'Login failed');
    }
  }

  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> bookingData) async {
    if (_token == null) throw Exception('Unauthorized. Login first.');
    final response = await http.post(
      Uri.parse('$baseUrl/bookings'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: json.encode(bookingData),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final err = json.decode(response.body);
      throw Exception(err['error'] ?? 'Booking failed');
    }
  }

  Future<Map<String, dynamic>> getLiveTracking(String bookingId) async {
    if (_token == null) throw Exception('Unauthorized. Login first.');
    final response = await http.get(
      Uri.parse('$baseUrl/bookings/$bookingId/track'),
      headers: {'Authorization': 'Bearer $_token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load live tracking data');
    }
  }
}