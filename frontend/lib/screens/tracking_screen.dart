import 'package:flutter/material.dart';

class TrackingScreen extends StatelessWidget {
  final String bookingId;
  const TrackingScreen({Key? key, required this.bookingId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Tracking Sopir')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.directions_car, size: 100, color: Colors.blueAccent),
            SizedBox(height: 20),
            Text('Sopir sedang menuju ke titik jemput', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Peta Lokasi Google Maps Real-time', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}