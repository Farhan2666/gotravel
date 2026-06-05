import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'theme/colors.dart';

void main() {
  runApp(const GOTravelApp());
}

class GOTravelApp extends StatefulWidget {
  const GOTravelApp({Key? key}) : super(key: key);

  @override
  State<GOTravelApp> createState() => _GOTravelAppState();
}

class _GOTravelAppState extends State<GOTravelApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GOtravel',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: ThemeData(
        brightness: Brightness.light,
        primaryColor: GOColors.lightPrimary,
        scaffoldBackgroundColor: GOColors.lightBackground,
        appBarTheme: const AppBarTheme(
          backgroundColor: GOColors.lightPrimary,
          foregroundColor: Colors.white,
        ),
        colorScheme: const ColorScheme.light(
          primary: GOColors.lightPrimary,
          secondary: GOColors.lightSecondary,
        ),
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: GOColors.darkPrimary,
        scaffoldBackgroundColor: GOColors.darkBackground,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black,
          foregroundColor: GOColors.darkText,
        ),
        colorScheme: const ColorScheme.dark(
          primary: GOColors.darkPrimary,
          secondary: GOColors.darkSecondary,
          background: GOColors.darkBackground,
        ),
      ),
      home: Scaffold(
        body: const DashboardScreen(),
        floatingActionButton: FloatingActionButton(
          onPressed: toggleTheme,
          tooltip: 'Toggle Theme',
          child: Icon(_themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode),
        ),
      ),
    );
  }
}