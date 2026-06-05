import 'package:flutter/material.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({Key? key}) : super(key: key);

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  String? _selectedRoute = 'RT_001';
  String? _selectedVehicle = 'premium_suv';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Booking Travel')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Pilih Rute Perjalanan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            DropdownButton<String>(
              value: _selectedRoute,
              isExpanded: true,
              items: const [
                DropdownMenuItem(value: 'RT_001', child: Text('Jakarta to Bandung - Rp150.000')),
                DropdownMenuItem(value: 'RT_002', child: Text('Jakarta to Semarang - Rp350.000')),
              ],
              onChanged: (val) => setState(() => _selectedRoute = val),
            ),
            const SizedBox(height: 20),
            const Text('Pilih Tipe Armada (Premium)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            DropdownButton<String>(
              value: _selectedVehicle,
              isExpanded: true,
              items: const [
                DropdownMenuItem(value: 'premium_suv', child: Text('Premium SUV (Fortuner/Pajero)')),
                DropdownMenuItem(value: 'luxury_van', child: Text('Luxury Van (Alphard/HiAce)')),
              ],
              onChanged: (val) => setState(() => _selectedVehicle = val),
            ),
            const SizedBox(height: 40),
            Center(
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Menghubungkan ke API pembayaran...')),
                  );
                },
                child: const Text('Konfirmasi & Bayar'),
              ),
            )
          ],
        ),
      ),
    );
  }
}